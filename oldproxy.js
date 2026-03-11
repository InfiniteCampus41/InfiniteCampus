"use strict"
/** @type {HTMLFormElement}*/
const form = document.getElementById("sj-form");
/** @type {HTMLInputElement} */
const address = document.getElementById("sj-address");
/** @type {HTMLInputElement} */
const searchEngine = document.getElementById("sj-search-engine");
/** @type {HTMLParagraphElement} */
const error = document.getElementById("sj-error");
/** @type {HTMLPreElement} */
/** @param {string} input */
/** @param {string} template */
/** @returns {string} */
const stockSW = "./sw.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];
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
function search(input, template) {
	try {
		return new URL(input).toString();
	} catch (err) {
	}
	try {
		const url = new URL(`http://${input}`);
		if (url.hostname.includes(".")) return url.toString();
	} catch (err) {
	}
	return template.replace("%s", encodeURIComponent(input));
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
    showLoader();
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
    fullScreenBtn.innerHTML = '<i class="bi bi-fullscreen"></i>';
    fullScreenBtn.classList = 'button';
    fullScreenBtn.id = 'pxyFcrn';
    fullScreenBtn.style.position = 'fixed';
    fullScreenBtn.style.bottom = '20px';
    fullScreenBtn.style.zIndex = '9999';
    fullScreenBtn.style.right = '20px';
    document.body.appendChild(fullScreenBtn);
    let proxyContainerOld = document.querySelector('#proxy-container');
    if (!proxyContainerOld) {
        const proxyContainer = document.createElement("div");
        proxyContainer.id = "proxy-container";
        proxyContainer.style.height = "87vh";
        document.body.appendChild(proxyContainer);
        proxyContainer.appendChild(frame.frame);
        frame.go(url);
    } else {
        proxyContainerOld.appendChild(frame.frame);
        frame.go(url);
    }
});
async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
		throw new Error("Service Workers Cannot Be Registered Without https.");
		throw new Error("Your Browser Doesn't Support Service Workers.");
	}
	await navigator.serviceWorker.register(stockSW);
}
const before = document.getElementById("before");
async function logProxyVisit(input) {
    let logUrl;
    before.style.display = 'none';
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
    }
    if (frame.complete) {
        hideLoader();
    }
    observer.disconnect();
});
observer.observe(document.body, { childList:true, subtree:true });