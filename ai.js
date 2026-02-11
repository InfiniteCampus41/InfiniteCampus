const endpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";
const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
let contents = [];
function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `aiMsg ${role}`;
    if (role === "user") {
        text = "**You:** " + text;
    }
    div.innerHTML = marked.parse(text);
    chat.appendChild(div);
    enhanceCodeBlocks(div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
}
async function sendMessage(text) {
    contents.push({ role: "user", parts: [{ text }] });
    addMessage("user", text);
    const loadingMsg = addMessage("model", "_Loading..._");
    const body = {
        contents: contents,
        generationConfig: { temperature: 0.7 }
    };
    let responseText = "(No Response)";
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        responseText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || JSON.stringify(json, null, 2);
    } catch (e) {
        responseText = "Request Failed: " + e.message;
    }
    contents.push({ role: "model", parts: [{ text: responseText }] });
    loadingMsg.innerHTML = marked.parse(responseText);
    enhanceCodeBlocks(loadingMsg);
    window.scrollTo(0, document.body.scrollHeight);
}
function enhanceCodeBlocks(container) {
    Prism.highlightAllUnder(container);
    container.querySelectorAll("pre").forEach(pre => {
        if (pre.querySelector(".aicopy-btn")) return;
        const button = document.createElement("button");
        button.textContent = "Copy";
        button.className = "aicopy-btn";
        const code = pre.querySelector("code");
        button.onclick = () => {
            navigator.clipboard.writeText(code.innerText).then(() => {
                button.textContent = "Copied!";
                setTimeout(() => button.textContent = "Copy", 1200);
            });
        };
        pre.appendChild(button);
    });
}
input.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) {
        const text = input.value.trim();
        input.value = "";
        sendMessage(text);
    }
});