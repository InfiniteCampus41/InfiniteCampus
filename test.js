"use strict";
const form = document.getElementById("sj-form");
const addressBar = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const tabsContainer = document.getElementById("tabs");
const content = document.getElementById("content");
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
        <span class="tab-title">${isNTP ? "New Tab" : "Loading..."}</span>
        <i class="bi bi-x close-tab"></i>
    `;
    tabsContainer.insertBefore(tabBtn, newTabBtn);
    const frameObj = scramjet.createFrame();
    const frame = frameObj.frame;
    frame.id = id;
    frame.className = "tab-frame";
    frame.style.display = "none";
    content.appendChild(frame);
    const tabData = {
        id,
        tabBtn,
        frame,
        frameObj
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
    if (isNTP) {
        loadNewTabPage(frame);
    }
    return tabData;
}
function switchTab(id) {
    activeTabId = id;
    tabs.forEach(t => {
        t.frame.style.display = "none";
        t.tabBtn.classList.remove("active");
    });
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    tab.frame.style.display = "block";
    tab.tabBtn.classList.add("active");
}
function closeTab(id) {
    const index = tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    const tab = tabs[index];
    tab.tabBtn.remove();
    tab.frame.remove();
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
        tab.tabBtn.querySelector(".tab-title").textContent = getBaseDomain(input);
    };
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadIntoActiveTab(addressBar.value);
});
function loadNewTabPage(frame) {
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`
        <html>
        <body style="
            background:black;
            color:#00ff66;
            display:flex;
            justify-content:center;
            align-items:center;
            flex-direction:column;
            height:100vh;
            font-family:sans-serif;
        ">
            <h1 id="time"></h1>
            <p id="date"></p>
            <script>
                function updateClock(){
                    const now=new Date();
                    let h=now.getHours();
                    const m=now.getMinutes().toString().padStart(2,"0");
                    const ampm=h>=12?"PM":"AM";
                    h=h%12||12;
                    document.getElementById("time").innerText=h+":"+m+" "+ampm;
                    document.getElementById("date").innerText=now.toDateString();
                }
                setInterval(updateClock,1000);
                updateClock();
            </script>
        </body>
        </html>
    `);
    doc.close();
}
createTab(true);