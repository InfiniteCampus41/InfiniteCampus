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
        <!DOCTYPE html>
        <html>
	        <head>
                <style>
                    #ntp {
                        height: calc(100vh - 140px);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: #111;
                        color: white;
                        text-align: center;
                    }
                    #clock #time {
                        font-size: 80px;
                        font-weight: 600;
                        color: #8cbe37;
                    }
                    #clock #date {
                        font-size: 18px;
                        margin-top: 5px;
                        opacity: 0.8;
                    }
                    #phrase {
                        margin-top: 20px;
                        font-size: 18px;
                        opacity: 0.9;
                    }
                    #apps {
                        display: grid;
                        width:100%;
                        grid-template-columns: repeat(auto-fit, 100px);
                        gap: 30px;
                        margin-top: 40px;
                        justify-content: center;
                    }
                    #apps div {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 12px;
                        border-radius: 18px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    #apps div:hover {
                        background: rgba(255,255,255,0.08);
                        transform: scale(1.05);
                    }
                    #apps img {
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        margin-bottom: 8px;
                    }
                    #apps .btxt {
                        font-size: 14px;
                        margin: 0;
                    }
                </style>
	        </head>
	        <body>
                <div id="ntp">
                    <div id="clock">
                        <span id="time">
                        </span>
                        <br>
                        <p id="date">
                        </p>
                    </div>
                    <div id="phrase">
                    </div>
                    <div id="apps">
                        <div>
                            <img src="/res/chatgpt.png" alt="ChatGPT">
                            <p class="btxt">
                                ChatGPT
                            </p>
                        </div>
                        <div>
                            <img src="/res/discord.png" alt="Discord">
                            <p class="btxt">
                                Discord
                            </p>
                        </div>
                        <div>
                            <img src="/res/youtube.png" alt="Youtube">
                            <p class="btxt">
                                Youtube
                            </p>
                        </div>
                    </div>
                </div>
		        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js">
                </script>
                <script>
                    function updateClock() { 
                        const now = new Date(); 
                        let hours = now.getHours(); 
                        const minutes = now.getMinutes().toString().padStart(2, "0"); 
                        const ampm = hours >= 12 ? "PM" : "AM"; 
                        hours = hours % 12; 
                        hours = hours ? hours : 12;
                        document.getElementById("time").textContent = ${hours}:${minutes} ${ampm}; 
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
                    setRandomPhrase();
                </script>
	        </body>
        </html>
    `);
    doc.close();
}
createTab(true);