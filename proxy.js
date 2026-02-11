window.logProxyVisit = async function(input) {
    let logUrl;
    try {
        const parsedUrl = new URL(input.startsWith("http") ? input : `https://${input}`);
        logUrl = `https://${parsedUrl.hostname.toLowerCase()}`;
    } catch {
        logUrl = input.toLowerCase();
    }
    const payload = {
        url: logUrl,
        timestamp: new Date().toISOString()
    };
    try {
        await fetch("/logs", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(payload)
        });
    } catch {}
};
const observer = new MutationObserver(() => {
    const btn = document.getElementById('pxyFcrn');
    const frame = document.getElementById('sj-frame');
    if (!btn || !frame) return;
    btn.onclick = () => {
        frame.style.width = '100vw';
        frame.style.height = '100vh';
    };
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            frame.style.height = '85vh';
        }
    });
});
observer.observe(document.body, {childList:true,subtree:true});