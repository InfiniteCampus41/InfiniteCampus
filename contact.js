async function sendMessage() {
    const channel = ( window.location.pathname == '/InfiniteContacts.html' ) ? '1389334335114580229' : '1334377158789042226';
    const nameInput = document.getElementById("name").value.trim();
    const name = nameInput ? nameInput : "Website User";
    const message = document.getElementById("message").value.trim();
    const url = window.location.host;
    if (!message) {
        showError("ERR#8 Message Cannot Be Empty!")
        return;
    }
    const fullMessage = `**${name}** \n Says: ${message} \n-# From ${url}`;
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
            showError("ERR#7 Failed To Send Message.");
        }
    } catch (error) {
        showError("ERR#7 Error Sending Message.");
    }
}