async function showLocationAndIp() {
    let infoEl = document.getElementById("ligma");
    try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("Fetch Failed");
        const data = await res.json();
        if (!infoEl) {
            infoEl = document.createElement("div");
            infoEl.id = "ligma";
            document.body.appendChild(infoEl);
        }
        const nav = navigator;
        const browserInfo = `
            Browser Info:
            User Agent: ${nav.userAgent}
            Platform: ${nav.platform}
            Language: ${nav.language}
            Cookies Enabled: ${nav.cookieEnabled}
            Online Status: ${nav.onLine}
            Hardware Threads (CPU cores): ${nav.hardwareConcurrency ?? "Unknown"}
            Device Memory (GB): ${nav.deviceMemory ?? "Unknown"}
        `;
        const screenInfo = `
            Screen Info:
            Resolution: ${screen.width} x ${screen.height}
            Available Screen Size: ${screen.availWidth} x ${screen.availHeight}
            Color Depth: ${screen.colorDepth}
            Pixel Ratio: ${window.devicePixelRatio}
        `;
        let gpuInfo = "Unavailable";
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (gl) {
                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                if (debugInfo) {
                    gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        } catch (e) {
            gpuInfo = "Unavailable";
        }
        let batteryInfo = "Unavailable";
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            batteryInfo = `
                Battery Level: ${Math.round(battery.level * 100)}%
                Charging: ${battery.charging}
            `;
        }
        const locationInfo = `
            Location Info:
            Current State: ${data.region ?? "Unknown"}
            City: ${data.city ?? "Unknown"}
            IPv4 Address: ${data.ip ?? "Unknown"}
            Org: ${data.org ?? "Unknown"}
            Zip Code: ${data.postal ?? "Unknown"}
            Latitude: ${data.latitude ?? "0"}
            Longitude: ${data.longitude ?? "0"}
        `;
        infoEl.innerText =
            locationInfo +
            browserInfo +
            screenInfo +
            `
                GPU: ${gpuInfo}
            ` +
            batteryInfo;
        infoEl.classList.add("show");
    } catch (err) {
        console.error("Error Fetching Location:", err);
        if (!infoEl) {
            infoEl = document.createElement("div");
            infoEl.id = "ligma";
            document.body.appendChild(infoEl);
        }
        infoEl.innerText = "Error Fetching Data.";
    }
}
function init() {
    showLocationAndIp();
}
document.addEventListener("DOMContentLoaded", init);