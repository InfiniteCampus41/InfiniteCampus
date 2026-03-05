import { auth, db, onAuthStateChanged, ref, get } from "./imports.js";
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
        const displayNameRef = ref(db, `users/${user.uid}/profile/displayName`);
        const snapshot = await get(displayNameRef);
        if (snapshot.exists()) {
            nameInput.value = snapshot.val();
        } else {
            if (user.displayName) {
                nameInput.value = user.displayName;
            }
        }
    } catch (error) {
        console.error("Error Fetching Display Name:", error);
    }
});
const params = new URLSearchParams(window.location.search);
const gameSug = params.get("game");
const suggest = params.get("suggest");
const movieSug = params.get("movie");
let channel = '';
const tptxt = document.getElementById('tptxt');
const button = document.getElementById('contactButton');
if (suggest) {
    if (gameSug) {
        button.href = 'InfiniteDiscords.html?channel=1086362556203028540';
        button.innerText = 'View Responses To Game Suggestions';
        tptxt.innerText = 'Suggest A Game';
        channel = '1086362556203028540';
        messageInput.value = "Game Request: \nURL:";
    } else if (movieSug) {
        button.href = 'InfiniteDiscords.html?channel=1464689808717774970';
        button.innerText = 'View Responses To Movie Suggestions';
        tptxt.innerText = 'Suggest A Movie';
        channel = '1464689808717774970';
        messageInput.value = "Movie Request:";
    } else {
        button.href = 'InfiniteDiscords.html?channel=1334377158789042226';
        button.innerText = 'View Responses To Suggestions';
        tptxt.innerText = "Suggest A Feature";
        channel = '1334377158789042226';
        messageInput.value = "";
    }
} else {
    button.href = 'InfiniteDiscords.html?channel=1389334335114580229';
    button.innerText = 'View Responses To Support';
    tptxt.innerText = "Contact Me";
    channel = '1389334335114580229';
    messageInput.value = "";
}
async function sendMessage() {
    const message = document.getElementById("message").value.trim();
    const name = nameInput.value;
    const url = window.location.host;
    if (!name) {
        showError("Name Cannot Be Empty");
        return
    }
    if (!message) {
        showError("Message Cannot Be Empty!")
        return;
    }
    const fullMessage = `**${name}** \n${message} \n-# From ${url}`;
    try {
        const response = await fetch(`${a}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: fullMessage,
                channelId: channel
            })
        });
        if (response.ok) {
            showSuccess("Message Sent");
            document.getElementById("name").value = "";
            document.getElementById("message").value = "";
        } else {
            showError("Failed To Send Message.");
        }
    } catch (error) {
        showError("Error Sending Message.");
    }
}
window.sendMessage = sendMessage;