import { auth, db, onAuthStateChanged, ref, get } from "./imports.js";
const nameInput = document.getElementById("name");
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
async function sendMessage() {
    const channel = ( window.location.pathname == '/InfiniteContacts.html' ) ? '1389334335114580229' : '1334377158789042226';
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