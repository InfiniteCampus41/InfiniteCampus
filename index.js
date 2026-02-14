"use strict";
/** @type {HTMLFormElement} */
const form = document.getElementById("sj-form");
/** @type {HTMLInputElement} */
const address = document.getElementById("sj-address");
/** @type {HTMLInputElement} */
const searchEngine = document.getElementById("sj-search-engine");
/** @type {HTMLParagraphElement} */
const error = document.getElementById("sj-error");
/** @type {HTMLPreElement} */
const errorCode = document.getElementById("sj-error-code");
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
    files: {
        wasm: "/scram/scramjet.wasm.wasm",
        all: "/scram/scramjet.all.js",
        sync: "/scram/scramjet.sync.js",
    },
});
scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let blockedUrls = [];
async function loadBlockedUrls() {
    try {
        const res = await fetch("/edit-urls");
        if (!res.ok) throw new Error("Failed to fetch blocked URLs");
        const data = await res.json();
        blockedUrls = Object.entries(data).map(([url, reason]) => ({
            url,
            reason
        }));
    } catch (err) {
        console.error("Error Loading URLs:", err);
        blockedUrls = [];
    }
}
function getBaseDomain(input) {
    try {
        const u = new URL(input.startsWith("http") ? input : "https://" + input);
        return u.hostname.toLowerCase();
    } catch (e) {
        return "";
    }
}
function checkBlocked(inputUrl) {
    const domain = getBaseDomain(inputUrl);
    for (const entry of blockedUrls) {
        const blockedDomain = getBaseDomain(entry.url);
        if (domain === blockedDomain) {
            return entry.reason || "Blocked.";
        }
    }
    return null;
}
loadBlockedUrls();
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await logProxyVisit(address.value);
    const reason = checkBlocked(address.value);
    if (reason) {
        error.textContent = "The Server Could Not Process This Request. \n If You Think This Is An Error, Please Send Your Error Code To The Owner Through \n The Website Chat, Padlet, Live Discord Chat, Contact Me page, Or The Report A Bug Form";
        errorCode.textContent = `Error Code: ${reason}`;
        return;
    }
    try {
        await registerSW();
    } catch (err) {
        error.textContent = "Failed To Register Service Worker.";
        errorCode.textContent = err.toString();
        throw err;
    }
    const url = search(address.value, searchEngine.value);
    let wispUrl =
        (location.protocol === "https:" ? "wss" : "ws") +
        "://" +
        location.host +
        "/wisp/";
    if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [
            { websocket: wispUrl },
        ]);
    }
    const frame = scramjet.createFrame();
    frame.frame.id = "sj-frame";
    const fullScreenBtn = document.createElement('button');
    fullScreenBtn.textContent = '⛶';
    fullScreenBtn.classList = 'button';
    fullScreenBtn.id = 'pxyFcrn';
    fullScreenBtn.style.position = 'fixed';
    fullScreenBtn.style.bottom = '20px';
    fullScreenBtn.style.zIndex = '9999';
    fullScreenBtn.style.right = '20px';
    document.body.appendChild(fullScreenBtn);
    document.body.appendChild(frame.frame);
    frame.go(url);
});