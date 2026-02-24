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
let fullscreenBtn = null;
let isFullscreen = false;
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
async function loadBlockedUrls() {
    try {
        const res = await fetch("/edit-urls");
        if (!res.ok) throw new Error("Failed To Fetch URLs");
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
newTabBtn.innerHTML = `<i class="bi bi-plus" title="New Tab"></i>`;
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
        <i class="bi bi-x close-tab" title="Close Tab"></i>
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
        attachFrameLoadEvents(tabData);
        startUrlWatcher(tabData);
    }
    const tabData = {
        id,
        tabBtn,
        frame,
        frameObj,
        isNTP,
        displayUrl: ""
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
function attachFrameLoadEvents(tab) {
    if (!tab.frame) return;
    tab.frame.addEventListener("loadstart", () => {
        showPxyLoader();
    });
    tab.frame.addEventListener("beforeunload", () => {
        showPxyLoader();
    });
    tab.frame.addEventListener("load", () => {
        hidePxyLoader();
    });
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
        addressBar.value = '';
    } else {
        if (ntp) ntp.style.display = "none";
        if (tab.frame) tab.frame.style.display = "block";
    }
    if (!tab.isNTP) {
        addressBar.value = tab.displayUrl || "";
    }
}
function decodeScramjetUrl(proxyUrl) {
    try {
        const url = new URL(proxyUrl);
        const parts = url.pathname.split("/scramjet/");
        if (parts.length > 1) {
            return decodeURIComponent(parts[1]);
        }
        return proxyUrl;
    } catch {
        return proxyUrl;
    }
}
function startUrlWatcher(tab) {
    if (!tab.frame) return;
    let lastUrl = "";
    setInterval(() => {
        if (!tab.frame || !tab.frame.contentWindow) return;
        try {
            const currentProxyUrl = tab.frame.contentWindow.location.href;
            if (currentProxyUrl !== lastUrl) {
                lastUrl = currentProxyUrl;
                const realUrl = decodeScramjetUrl(currentProxyUrl);
                tab.displayUrl = realUrl;
                if (tab.id === activeTabId) {
                    addressBar.value = realUrl;
                }
            }
        } catch {}
    }, 300);
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
function createFullscreenButton() {
    if (fullscreenBtn) return;
    fullscreenBtn = document.createElement("button");
    fullscreenBtn.innerHTML = `<i class="bi bi-fullscreen"></i>`;
    fullscreenBtn.style.position = "fixed";
    fullscreenBtn.style.bottom = "40px";
    fullscreenBtn.style.right = "20px";
    fullscreenBtn.style.zIndex = "9999";
    fullscreenBtn.classList = 'button';
    fullscreenBtn.addEventListener("click", toggleFullscreen);
    document.body.appendChild(fullscreenBtn);
}
function toggleFullscreen() {
    const tab = getActiveTab();
    if (!tab || !tab.frame) return;
    if (!isFullscreen) {
        tab.frame.style.position = "fixed";
        tab.frame.style.top = "0";
        tab.frame.style.left = "0";
        tab.frame.style.width = "100vw";
        tab.frame.style.height = "100vh";
        tab.frame.style.zIndex = "9998";
        fullscreenBtn.innerHTML = `<i class="bi bi-fullscreen-exit"></i>`;
        isFullscreen = true;
    } else {
        tab.frame.style.position = "";
        tab.frame.style.top = "";
        tab.frame.style.left = "";
        tab.frame.style.width = "";
        tab.frame.style.height = "";
        tab.frame.style.zIndex = "";
        fullscreenBtn.innerHTML = `<i class="bi bi-fullscreen"></i>`;
        isFullscreen = false;
    }
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
    }
});
async function loadIntoActiveTab(input) {
    if (!activeTabId) return;
    const reason = checkBlocked(input);
    if (reason) {
        error.textContent = "Error";
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
        attachFrameLoadEvents(tab);
        document.getElementById("ntp").style.display = "none";
        startUrlWatcher(tab);
    }
    try {
        await registerSW();
    } catch (err) {
        error.textContent = "Service Worker failed.";
        errorCode.textContent = err.toString();
        hidePxyLoader();
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
    tab.displayUrl = input;
    addressBar.value = input;
    const url = search(input, searchEngine.value);
    tab.tabBtn.querySelector(".tab-title").textContent = "Loading...";
    showPxyLoader();
    tab.frame.onload = null;
    tab.frame.onload = () => {
        try {
            const doc = tab.frame.contentDocument || tab.frame.contentWindow.document;
            const pageTitle = doc.title || getBaseDomain(input);
            const titleElement = tab.tabBtn.querySelector(".tab-title");
            titleElement.textContent = pageTitle;
            tab.tabBtn.title = `${pageTitle}`;
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
            tab.tabBtn.title = `${fallbackTitle}`
        }
        createFullscreenButton();
    };
    tab.frameObj.go(url);
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await logProxyVisit(addressBar.value);
    await loadIntoActiveTab(addressBar.value);
});
function updateClock() { 
    const now = new Date(); 
    let hours = now.getHours(); 
    const minutes = now.getMinutes().toString().padStart(2, "0"); 
    const ampm = hours >= 12 ? "PM" : "AM"; 
    hours = hours % 12; 
    hours = hours ? hours : 12;
    document.getElementById("pxyTime").textContent = `${hours}:${minutes}${ampm}`; 
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }; 
    document.getElementById("pxyDate").textContent = now.toLocaleDateString(undefined, options);
} 
setInterval(updateClock, 1000); 
updateClock(); 
let isGB = 0;
let btMsg = 'hello';
navigator.getBattery().then(function(battery) {
    function updateBattery() {
        const batteryPer = Math.round(battery.level *100);
        btMsg = `I'm Going To Guess Your Battery Percentage, Is It ${batteryPer}? Knew It`;
        if (batteryPer <= 20) {
            btMsg = `Charge Ur Device, Its At ${batteryPer}%`;
            isGB = 1;
        }
        if (battery.charging === true && isGB === 1) {
            btMsg = `Good Boy. Charging, ${batteryPer}%`;
            isGB = 0;
        }
    }
    updateBattery();
    battery.addEventListener("levelchange", updateBattery);
    battery.addEventListener("chargingchange", updateBattery);
    setRandomPhrase();
});
const hosturl = window.location.host;
function setRandomPhrase() { 
    const phrases = [ 
        "Made By Hacker41", 
        "AAAAAAAAAAAAAAAAAAAA", 
        "The Teacher's Bane", 
        "Enemy Of The Principal", 
        "Diddiling Other Proxies", 
        "What The Sigma!?", 
        "[Insert Joke Here]", 
        "JESSE We Need To Cook NOW", 
        "Please Speed I Need This", 
        "Speed, I Am Formerly Requesting Aid Of The Finacial Form, As My Mother Has No Humble Abode", 
        "Kachow - Lightning McQueen", 
        "Dont Believe Everything You See On The Internet - Abraham Lincoln",
        "When You Can't Even Say My Name",
        "Has The Memory Gone? Are You Feeling Numb?",
        "Go On And Call, My Name",
        `Greetings, Person On ${hosturl}`,
        "Loading Virus.exe",
        "Nitrix67 Likes Men",
        "Life Is A Highway",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        `${btMsg}`
    ]; 
    const random = phrases[Math.floor(Math.random() * phrases.length)];
    document.getElementById("phrase").textContent = random; 
} 
function getActiveTab() {
    return tabs.find(t => t.id === activeTabId);
}
backBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab && tab.frameObj) {
        showPxyLoader();
        try {
            tab.frameObj.back();
        } catch {}
    }
});
forwardBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab && tab.frameObj) {
        showPxyLoader();
        try {
            tab.frameObj.forward();
        } catch {}
    }
});
reloadBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab && tab.frameObj) {
        showPxyLoader();
        try {
            tab.frameObj.reload();
        } catch {}
    }
});
updateBattery();
setRandomPhrase();
document.querySelectorAll("#pxyApps div").forEach(app => {
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