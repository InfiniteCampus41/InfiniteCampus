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
    let fullscreen = false;
    btn.onclick = () => {
        fullscreen = !fullscreen;
        if (fullscreen) {
            frame.style.width = '100vw';
            frame.style.height = '100vh';
            frame.style.marginTop = '0px';
            frame.style.zIndex = '9998';
        } else {
            frame.style.width = '';
            frame.style.height = '87vh';
            frame.style.marginTop = '60px';
            frame.style.zIndex = '1';
        }
    };
});
observer.observe(document.body, {childList:true,subtree:true});