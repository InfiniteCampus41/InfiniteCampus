import { ref, onValue, push, remove, update, get, forceWebSockets } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
forceWebSockets();
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { auth, db } from "./firebase.js";
const updatesRef = ref(db, "updates");
let lastSentKey = null;
let hasLoaded = false;
let isOwner = false;
let isTester = false;
let isDev = false;
let cleanupRunning = false;
function sendToCustomDB(message) {
    const channelId = "1389703415810101308";
    fetch(`${a}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: message,
            channelId: channelId
        })
    }).catch((e) => console.error("Error: Server Post Error:", e));
}
async function enforceUpdateLimit(snapshot) {
    if (cleanupRunning) return;
    cleanupRunning = true;
    try {
        const updates = [];
        snapshot.forEach(child => {
            updates.push({ key: child.key, ...child.val() });
        });
        updates.sort((a, b) => b.timestamp - a.timestamp);
        if (updates.length <= 10) return;
        const toDelete = updates.slice(10);
        const multi = {};
        toDelete.forEach(u => {
            multi["updates/" + u.key] = null;
        });
        await update(ref(db), multi);
    } finally {
        cleanupRunning = false;
    }
}
function addUpdate() {
  	if (!isOwner && !isTester && !isDev) return;
  	const contentEl = document.getElementById("newUpdate");
  	const content = contentEl.value.trim();
  	if (content) {
    	push(updatesRef, {
      		content,
      		timestamp: Date.now()
    	}).then(() => showSuccess("Update Added."));
    	contentEl.value = "";
  	}
}
function deleteUpdate(key) {
  	if (!isOwner && !isTester && !isDev) return;
  	remove(ref(db, "updates/" + key));
  	if (lastSentKey === key) lastSentKey = null;
}
function editUpdate(key, currentText) {
  	if (!isOwner && !isTester && !isDev) return;
  	const newText = prompt("Edit Update:", currentText);
  	if (newText !== null && newText.trim() !== "") {
    	update(ref(db, "updates/" + key), {
      		content: newText.trim()
    	});
  	}
}
window.addUpdate = addUpdate;
window.deleteUpdate = deleteUpdate;
window.editUpdate = editUpdate;
function renderUpdates(snapshot) {
  	const updates = [];
  	snapshot.forEach((child) => {
    	updates.push({ key: child.key, ...child.val() });
  	});
  	updates.sort((a, b) => b.timestamp - a.timestamp);
  	const container = document.getElementById("updates");
  	container.innerHTML = "";
  	updates.slice(0, 10).forEach((update, index) => {
    	const div = document.createElement("div");
    	div.className = `update-box ${index % 2 === 0 ? "r" : "y"}`;
    	if (isOwner || isTester || isDev) {
      		div.innerHTML = `
        		<button class="button" onclick="editUpdate('${update.key}', \`${update.content.replace(/`/g, "\\`")}\`)">
					Edit
				</button>
        		${index + 1}. ${update.content}
        		<button class="button" onclick="deleteUpdate('${update.key}')">
					Delete
				</button>
      		`;
    	} else {
      		div.innerHTML = `${index + 1}. ${update.content}`;
      		div.style.border = "none";
    	}
    	container.appendChild(div);
  	});
}
onValue(updatesRef, async (snapshot) => {
    const updates = [];
    snapshot.forEach(child => {
        updates.push({ key: child.key, ...child.val() });
    });
    updates.sort((a, b) => b.timestamp - a.timestamp);
    if (!hasLoaded && updates.length) {
        lastSentKey = updates[0].key;
        hasLoaded = true;
    } 
    else if (updates.length && updates[0].key !== lastSentKey) {
        lastSentKey = updates[0].key;
        sendToCustomDB(updates[0].content);
    }
    renderUpdates(snapshot);
    await enforceUpdateLimit(snapshot);
});
onAuthStateChanged(auth, async (user) => {
  	const inputBox = document.getElementById("newUpdateContainer") || document.getElementById("newUpdate");
  	isOwner = false;
	isTester = false;
	isDev = false;
  	if (user) {
    	const ownerRef = ref(db, `users/${user.uid}/profile/isOwner`);
		const testerRef = ref(db, `users/${user.uid}/profile/isTester`);
		const devRef = ref(db, `users/${user.uid}/profile/isDev`);
    	const ownerSnap = await get(ownerRef);
		const testerSnap = await get(testerRef);
		const devSnap = await get(devRef);
    	if (ownerSnap.exists() && ownerSnap.val() === true) {
      		isOwner = true;
      		if (inputBox) inputBox.style.display = "block";
    	} else if (testerSnap.exists() && testerSnap.val() === true) {
      		isTester = true;
      		if (inputBox) inputBox.style.display = "block";
    	} else if (devSnap.exists() && devSnap.val() === true) {
			isDev = true;
			if (inputBox) inputBox.style.display = "block";
		}  else {
      		if (inputBox) inputBox.style.display = "none";
    	}
  	} else {
    	if (inputBox) inputBox.style.display = "none";
  	}
  	const snapshot = await get(updatesRef);
  	renderUpdates(snapshot);
});
document.addEventListener("DOMContentLoaded", () => {
  	const input = document.getElementById("newUpdate");
  	if (input) {
    	input.addEventListener("keydown", (e) => {
      		if (e.key === "Enter") {
        		e.preventDefault();
        		addUpdate();
      		}
    	});
  	}
});