import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, onValue, push, remove, update, get, forceWebSockets} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
forceWebSockets();
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const updatesRef = ref(db, "updates");
let lastSentKey = null;
let hasLoaded = false;
let isOwner = false;
let isTester = false;
function sendToCustomDB(message) {
    const channelId = "1389703415810101308";
    fetch(`${a}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: message,
            channelId: channelId
        })
    }).catch((e) => console.error("ERR#7 Server Post Error:", e));
}
function addUpdate() {
  	if (!isOwner && !isTester) return;
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
  	if (!isOwner && !isTester) return;
  	remove(ref(db, "updates/" + key));
  	if (lastSentKey === key) lastSentKey = null;
}
function editUpdate(key, currentText) {
  	if (!isOwner && !isTester) return;
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
  	if (updates.length > 10) {
    	updates.slice(10).forEach((u) => deleteUpdate(u.key));
  	}
  	const container = document.getElementById("updates");
  	container.innerHTML = "";
  	updates.slice(0, 10).forEach((update, index) => {
    	const div = document.createElement("div");
    	div.className = `update-box ${index % 2 === 0 ? "r" : "y"}`;
    	if (isOwner || isTester) {
      		div.innerHTML = `
        		<button class="button" onclick="editUpdate('${update.key}', \`${update.content.replace(/`/g, "\\`")}\`)">Edit</button>
        		${index + 1}. ${update.content}
        		<button class="button" onclick="deleteUpdate('${update.key}')">Delete</button>
      		`;
    	} else {
      		div.innerHTML = `${index + 1}. ${update.content}`;
      		div.style.border = "none";
    	}
    	container.appendChild(div);
  	});
  	if (updates.length > 0) {
    	const firstUpdate = updates[0];
    	if (hasLoaded && firstUpdate.key !== lastSentKey) {
      		lastSentKey = firstUpdate.key;
			sendToCustomDB(firstUpdate.content);
    	} else if (!hasLoaded) {
      		lastSentKey = firstUpdate.key;
      		hasLoaded = true;
    	}
  	}
}
onValue(updatesRef, (snapshot) => {
  	renderUpdates(snapshot);
});
onAuthStateChanged(auth, async (user) => {
  	const inputBox = document.getElementById("newUpdateContainer") || document.getElementById("newUpdate");
  	isOwner = false;
	isTester = false;
  	if (user) {
    	const ownerRef = ref(db, `users/${user.uid}/profile/isOwner`);
    	const ownerSnap = await get(ownerRef);
		const testerRef = ref(db, `users/${user.uid}/profile/isTester`);
		const testerSnap = await get(testerRef);
    	if (ownerSnap.exists() && ownerSnap.val() === true) {
      		isOwner = true;
      		if (inputBox) inputBox.style.display = "block";
    	} else if (testerSnap.exists() && testerSnap.val() === true) {
      		isTester = true;
      		if (inputBox) inputBox.style.display = "block";
    	} else {
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