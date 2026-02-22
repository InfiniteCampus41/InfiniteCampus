"use strict";
const form = document.getElementById("sj-form");
const addressBar = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const tabsContainer = document.getElementById("tabs");
const content = document.getElementById("content");
const backBtn = document.getElementById("nav-back");
const forwardBtn = document.getElementById("nav-forward");
const reloadBtn = document.getElementById("nav-reload");
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
    } catch {
        blockedUrls = [];
    }
}
function getBaseDomain(input) {
    try {
        const u = new URL(input.startsWith("http") ? input : "https://" + input);
        return u.hostname.toLowerCase();
    } catch {
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
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
const newTabBtn = document.createElement("div");
newTabBtn.className = "chrome-newtab";
newTabBtn.innerHTML = `<i class="bi bi-plus"></i>`;
tabsContainer.appendChild(newTabBtn);
newTabBtn.addEventListener("click", () => {
    createTab(true);
});
function createTab(isNTP = false) {
    const id = "tab-" + (++tabCounter);
    const tabBtn = document.createElement("div");
    tabBtn.className = "chrome-tab active";
    tabBtn.innerHTML = `
        <img class="tab-favicon" src="" style="width:16px;height:16px;margin-right:6px;display:none;">
        <span class="tab-title">${isNTP ? "New Tab" : "Loading..."}</span>
        <i class="bi bi-x close-tab"></i>
    `;
    tabsContainer.insertBefore(tabBtn, newTabBtn);
    let frame = null;
    let frameObj = null;
    if (!isNTP) {
        frameObj = scramjet.createFrame();
        frame = frameObj.frame;
        frame.id = id;
        frame.className = "tab-frame";
        frame.style.display = "none";
        content.appendChild(frame);
    }
    const tabData = {
        id,
        tabBtn,
        frame,
        frameObj,
        isNTP
    };
    tabs.push(tabData);
    tabBtn.addEventListener("click", (e) => {
        if (e.target.classList.contains("close-tab")) return;
        switchTab(id);
    });
    tabBtn.querySelector(".close-tab").addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(id);
    });
    switchTab(id);
    return tabData;
}
function switchTab(id) {
    activeTabId = id;
    tabs.forEach(t => {
        if (t.frame) {
            t.frame.style.display = "none";
        }
        t.tabBtn.classList.remove("active");
    });
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    tab.tabBtn.classList.add("active");
    const ntp = document.getElementById("ntp");
    if (tab.isNTP) {
        if (ntp) ntp.style.display = "flex";
    } else {
        if (ntp) ntp.style.display = "none";
        if (tab.frame) tab.frame.style.display = "block";
    }
    if (tab.frame && tab.frame.contentWindow) {
        try {
            addressBar.value = tab.frame.contentWindow.location.href;
        } catch {}
    }
}
function closeTab(id) {
    const index = tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    const tab = tabs[index];
    tab.tabBtn.remove();
    if (tab.frame) {
        tab.frame.remove();
    }
    tabs.splice(index, 1);
    if (tabs.length === 0) {
        createTab(true);
    } else {
        switchTab(tabs[Math.max(0, index - 1)].id);
    }
}
async function loadIntoActiveTab(input) {
    if (!activeTabId) return;
    const reason = checkBlocked(input);
    if (reason) {
        error.textContent = "Blocked request.";
        errorCode.textContent = `Error Code: ${reason}`;
        return;
    }
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    if (tab.isNTP) {
        tab.isNTP = false;
        tab.frameObj = scramjet.createFrame();
        tab.frame = tab.frameObj.frame;
        tab.frame.id = tab.id;
        tab.frame.className = "tab-frame";
        tab.frame.style.display = "block";
        content.appendChild(tab.frame);
        document.getElementById("ntp").style.display = "none";
    }
    try {
        await registerSW();
    } catch (err) {
        error.textContent = "Service Worker failed.";
        errorCode.textContent = err.toString();
        return;
    }
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
    const url = search(input, searchEngine.value);
    tab.tabBtn.querySelector(".tab-title").textContent = "Loading...";
    tab.frameObj.go(url);
    tab.frame.onload = () => {
        try {
            const doc = tab.frame.contentDocument || tab.frame.contentWindow.document;
            const pageTitle = doc.title || getBaseDomain(input);
            const titleElement = tab.tabBtn.querySelector(".tab-title");
            titleElement.textContent = pageTitle;
            tab.tabBtn.setAttribute("data-fulltitle", pageTitle);            
            let icon = doc.querySelector("link[rel~='icon']");
            const faviconImg = tab.tabBtn.querySelector(".tab-favicon");
            if (icon && icon.href) {
                faviconImg.src = icon.href;
                faviconImg.style.display = "inline-block";
            } else {
                const fallback = new URL(input.startsWith("http") ? input : "https://" + input);
                faviconImg.src = fallback.origin + "/favicon.ico";
                faviconImg.style.display = "inline-block";
            }
        } catch (err) {
            const fallbackTitle = getBaseDomain(input);
            const titleElement = tab.tabBtn.querySelector(".tab-title");
            titleElement.textContent = fallbackTitle;
            tab.tabBtn.setAttribute("data-fulltitle", fallbackTitle);
        }
    };
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadIntoActiveTab(addressBar.value);
});
function updateClock() { 
    const now = new Date(); 
    let hours = now.getHours(); 
    const minutes = now.getMinutes().toString().padStart(2, "0"); 
    const ampm = hours >= 12 ? "PM" : "AM"; 
    hours = hours % 12; 
    hours = hours ? hours : 12;
    document.getElementById("time").textContent = `${hours}:${minutes}${ampm}`; 
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }; 
    document.getElementById("date").textContent = now.toLocaleDateString(undefined, options);
} 
setInterval(updateClock, 1000); 
updateClock(); 
const phrases = [ 
    "Random Phrase1", 
    "Random Phrase2", 
    "Random Phrase3", 
    "Random Phrase4", 
    "Random Phrase5", 
    "Random Phrase6", 
    "Random Phrase7", 
    "Random Phrase8", 
    "Random Phrase9", 
    "Random Phrase10", 
    "Random Phrase11", 
    "Random Phrase12" 
]; 
function setRandomPhrase() { 
    const random = phrases[Math.floor(Math.random() * phrases.length)];
    document.getElementById("phrase").textContent = random; 
} 
function getActiveTab() {
    return tabs.find(t => t.id === activeTabId);
}
backBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab && tab.frame && tab.frame.contentWindow.history.length > 0) {
        tab.frame.contentWindow.history.back();
    }
});
forwardBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab && tab.frame) {
        tab.frame.contentWindow.history.forward();
    }
});
reloadBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab && tab.frame) {
        tab.frame.contentWindow.location.reload();
    }
});
setRandomPhrase();
document.querySelectorAll("#apps div").forEach(app => {
    app.addEventListener("click", async () => {
        const url = app.getAttribute("data-url");
        if (!url) return;
        if (!activeTabId) {
            createTab(true);
        }
        await loadIntoActiveTab(url);
    });
});
createTab(true);