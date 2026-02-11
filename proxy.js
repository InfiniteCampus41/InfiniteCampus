document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("sj-form");
    const addressInput = document.getElementById("sj-address");
    const errorEl = document.getElementById("sj-error");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    function isFullscreen() {
        return document.fullscreenElement ||
               document.webkitFullscreenElement ||
               document.msFullscreenElement;
    }
    async function enterFullscreen() {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }
    async function exitFullscreen() {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
    fullscreenBtn.addEventListener("click", async () => {
        try {
            if (!isFullscreen()) {
                await enterFullscreen();
                fullscreenBtn.textContent = "⤢";
            } else {
                await exitFullscreen();
                fullscreenBtn.textContent = "⛶";
            }
        } catch (err) {
            console.error("Fullscreen Error:", err);
        }
    });
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let input = addressInput.value.trim();
        if (!input) {
            errorEl.textContent = "Please Enter A URL Or Search Term.";
            return;
        }
        let logUrl;
        try {
            const parsedUrl = new URL(input.startsWith("http") ? input : `https://${input}`);
            logUrl = `https://${parsedUrl.hostname.toLowerCase()}`;
        } catch {
            logUrl = input.toLowerCase();
        }
        const now = new Date().toISOString();
        const payload = {
            url: logUrl,
            timestamp: now
        };
        try {
            const response = await fetch("/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }
            addressInput.value = "";
            errorEl.textContent = "";
        } catch (err) {
            console.error(err);
        }
    });
});