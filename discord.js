async function sendMessage() {
    const nameInput = document.getElementById("name").value.trim();
    const name = nameInput ? nameInput : "Website User";
    const message = document.getElementById("message").value.trim();
    const channelId = "1389334335114580229";
    if (!message) {
        showError("ERR#8 Message Cannot Be empty!");
        return;
    }
    const fullMessage = `**${name}**\n${message}`;
    try {
        const response = await fetch(`${a}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: fullMessage,
                channelId: channelId
            })
        });
        if (response.ok) {
            showSuccess("Message Sent!");
            document.getElementById("name").value = "";
            document.getElementById("message").value = "";
        } else {
            showError("ERR#7 Failed To Send Message.");
        }
    } catch (error) {
        showError("ERR#7 Error Sending Message.");
    }
}