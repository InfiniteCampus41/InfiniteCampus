import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, get, push, onValue} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);
const pollList = document.getElementById("pollList");
const entriesDiv = document.getElementById("entries");
const pollRef = ref(db, `poll`);
const votedMsg = document.getElementById("voted");
const voteContainer = document.getElementById("voteContainer");
const voteInput = document.getElementById("pollVote");
const voted = localStorage.getItem('voted') === 'true';
const pollContainer = document.getElementById("pollContainer");
onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const profileRef = ref(db, "users/" + user.uid + "/profile");
    const profileSnap = await get(profileRef);
    if (!profileSnap.exists()) return;
    const data = profileSnap.val();
    const allowed = data.isOwner === true || data.isTester === true || data.isDev === true;
    if (allowed) {
        pollList.style.display = "block";
        pollContainer.style.display = 'none';
        loadPolls();
    } else {
        pollList.style.display = "none";
    }
});
function loadPolls() {
    onValue(pollRef, snap => {
        entriesDiv.innerHTML = "";
        snap.forEach(child => {
            const poll = child.val();
            const time = poll.timestamp ? new Date(poll.timestamp).toLocaleString() : "Unknown";
            const div = document.createElement("div");
            div.innerHTML = `<strong>Message:</strong> ${poll.content || "(none)"}<br><strong>Time:</strong> ${time}`;
            entriesDiv.appendChild(div);
        });
    });
}
if (voted) {
    votedMsg.style.display = 'block';
    voteContainer.style.display = 'none';
}
function submit() {
    const content = voteInput.value.trim();
    if (content) {
        push(pollRef, { content, timestamp: Date.now() }).then(() => showSuccess("Vote Submitted"));
        voteInput.value = "";
        localStorage.setItem('voted', 'true');
        votedMsg.textContent = 'Vote Submitted';
        votedMsg.style.display = 'block';
        voteContainer.style.display = 'none';
    }
}
voteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        submit();
    }
})
window.submit = submit;