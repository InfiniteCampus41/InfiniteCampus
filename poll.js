import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, push} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const votedMsg = document.getElementById("voted");
const voteContainer = document.getElementById("voteContainer");
const voteInput = document.getElementById("pollVote");
const voted = localStorage.getItem('voted') === 'true';
const pollRef = ref(db, `poll`);
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