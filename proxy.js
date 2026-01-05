const iframe = document.getElementById("view");
const urlInput = document.getElementById("purlinp");
const loadingMessage = document.getElementById("loadingMessage");
const text = document.getElementById('pxybf');
const SERVER_URL = `${d}`;
function doubleBase64Encode(str) {
    return btoa(btoa(str));
}
async function checkServer() {
    try {
        const response = await fetch(`${SERVER_URL}/index.html`);
        if (!response.ok) throw new Error();
        urlInput.disabled = false;
        loadingMessage.style.display = "none";
    } catch {
        urlInput.disabled = true;
        loadingMessage.textContent = "Could Not Reach Server";
        loadingMessage.style.display = "block";
    }
}
async function go() {
    let url = urlInput.value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }
    loadingMessage.textContent = "Loading...";
    loadingMessage.style.display = "block";
    const encodedUrl = doubleBase64Encode(url);
    iframe.src = `${SERVER_URL}/proxy?url=${encodedUrl}`;
    iframe.style.background = 'white';
    iframe.style.display = 'block';
    text.style.display = 'none';
}
iframe.onload = () => {
    loadingMessage.style.display = "none";
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('http')) {
                const fullUrl = new URL(href, iframe.src).href;
                a.href = `/proxy?url=${doubleBase64Encode(fullUrl)}`;
            }
        });
    } catch (e) {}
};
urlInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") go();
});
checkServer();