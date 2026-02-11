document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("sj-form");
    const addressInput = document.getElementById("sj-address");
    const errorEl = document.getElementById("sj-error");
    let player = null;
    let iframe = null;
    let fullscreenBtn = null;
    function setupFullscreen(playerEl, btn) {
        function isFullscreen() {
            return document.fullscreenElement === playerEl ||
                   document.webkitFullscreenElement === playerEl ||
                   document.msFullscreenElement === playerEl;
        }
        async function enterFullscreen() {
            if (playerEl.requestFullscreen) await playerEl.requestFullscreen();
            else if (playerEl.webkitRequestFullscreen) playerEl.webkitRequestFullscreen();
            else if (playerEl.msRequestFullscreen) playerEl.msRequestFullscreen();
        }
        async function exitFullscreen() {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
        btn.addEventListener("click", async () => {
            try {
                if (!isFullscreen()) {
                    await enterFullscreen();
                } else {
                    await exitFullscreen();
                }
            } catch (err) {
                console.error("Fullscreen Error:", err);
            }
        });
        document.addEventListener("fullscreenchange", () => {
            btn.textContent = isFullscreen() ? "⤢" : "⛶";
        });
    }
    function createPlayer() {
        if (player) return;
        player = document.createElement("div");
        player.id = "sjPlayer";
        fullscreenBtn = document.createElement("button");
        fullscreenBtn.id = "fullscreen-btn";
        fullscreenBtn.textContent = "⛶";
        iframe = document.createElement("iframe");
        iframe.id = "sj-frame";
        iframe.allowFullscreen = true;
        player.appendChild(fullscreenBtn);
        player.appendChild(iframe);
        document.body.appendChild(player);
        setupFullscreen(player, fullscreenBtn);
    }
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let input = addressInput.value.trim();
        if (!input) {
            errorEl.textContent = "Please Enter A URL Or Search Term.";
            return;
        }
        createPlayer();
        try {
            const parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
            iframe.src = parsed.href;
        } catch {
            iframe.src = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
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
            const response = await fetch("/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            addressInput.value = "";
            errorEl.textContent = "";
        } catch (err) {
            console.error(err);
        }
    });
});