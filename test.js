async function logProxyVisit(input) {
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
    if (!frame) return;
    frame.addEventListener("load", () => {
        hideLoader();
    });
    if (btn) {
        let fullscreen = false;
        btn.onclick = () => {
            fullscreen = !fullscreen;
            if (fullscreen) {
                btn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
                frame.style.width = '100vw';
                frame.style.height = '100vh';
                frame.style.marginTop = '0px';
                frame.style.zIndex = '9998';
            } else {
                btn.innerHTML = '<i class="bi bi-fullscreen"></i>';
                frame.style.width = '';
                frame.style.height = '87vh';
                frame.style.marginTop = '60px';
                frame.style.zIndex = '1';
            }
        };
    }
    if (frame.complete) {
        hideLoader();
    }
    observer.disconnect();
});
observer.observe(document.body, { childList:true, subtree:true });
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById("clock").textContent =
        `${hours}:${minutes} ${ampm}`;
    document.getElementById("date").textContent =
        now.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
}
setInterval(updateClock, 1000);
updateClock();
const frame = document.getElementById("sj-frame");
const newtab = document.getElementById("newtab-page");
document.querySelectorAll(".app").forEach(app => {
    app.addEventListener("click", () => {
        const url = app.getAttribute("data-url");
        newtab.style.display = "none";
        frame.style.display = "block";
        document.getElementById("sj-address").value = url;
        document.getElementById("sj-form").dispatchEvent(new Event("submit"));
    });
});
document.getElementById("new-tab-btn").addEventListener("click", () => {
    frame.style.display = "none";
    newtab.style.display = "flex";
    document.getElementById("sj-address").value = "";
});