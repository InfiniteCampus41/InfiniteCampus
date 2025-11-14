async function sendMessage() {
    const nameInput = document.getElementById("name").value.trim();
    const name = nameInput ? nameInput : "Website User";
    const message = document.getElementById("message").value.trim();
    const status = document.getElementById("status");
    if (!message) {
        status.textContent = "ERR#8 Message Cannot Be empty!";
        status.style.color = "orange";
        return;
    }
    const fullMessage = `**${name}**\n${message}`;
    try {
        const response = await fetch("https://included-touched-joey.ngrok-free.app/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: fullMessage,
                channelId: "1334377158789042226"
            })
        });
        if (response.ok) {
            status.textContent = "Message Sent!";
            status.style.color = "lightgreen";
            document.getElementById("name").value = "";
            document.getElementById("message").value = "";
        } else {
            status.textContent = "ERR#7 Failed To Send Message.";
            status.style.color = "red";
        }
    } catch (error) {
        status.textContent = "ERR#7 Error Sending Message.";
        status.style.color = "orange";
    }
}