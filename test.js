const tabsContainer = document.getElementById("tabs");
const content = document.getElementById("content");
const addressBar = document.getElementById("sj-address");
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
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
function createTab(url = null, isNTP = false) {
    const id = "tab-" + (++tabCounter);
    const tabBtn = document.createElement("div");
    tabBtn.className = "chrome-tab";
    tabBtn.innerHTML = `
        <span class="tab-title">${isNTP ? "New Tab" : "Loading..."}</span>
        <i class="bi bi-x close-tab"></i>
    `;
    tabsContainer.insertBefore(tabBtn, newTabBtn);
    let frame;
    let frameObj = null;
    if (!isNTP && url) {
        frameObj = window.scramjet.createFrame();
        frame = frameObj.frame;
        frameObj.go(url);
    } else {
        frame = document.createElement("iframe");
        frame.src = "about:blank";
    }
    frame.id = id;
    frame.className = "tab-frame";
    frame.style.display = "none";
    content.appendChild(frame);
    tabs.push({ id, tabBtn, frame, frameObj });
    tabBtn.addEventListener("click", (e) => {
        if (e.target.classList.contains("close-tab")) return;
        switchTab(id);
    });
    tabBtn.querySelector(".close-tab").addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(id);
    });
    switchTab(id);
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
        createTab(null, true);
    } else {
        switchTab(tabs[Math.max(0, index - 1)].id);
    }
}
async function loadIntoActiveTab(input) {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const url = search(input, document.getElementById("sj-form").value);
    if (!tab.frameObj) {
        const frameObj = window.scramjet.createFrame();
        const newFrame = frameObj.frame;
        newFrame.id = tab.id;
        newFrame.className = "tab-frame";
        newFrame.style.display = "block";
        tab.frame.replaceWith(newFrame);
        tab.frame = newFrame;
        tab.frameObj = frameObj;
    }
    tab.frameObj.go(url);
    tab.tabBtn.querySelector(".tab-title").textContent = "Loading...";
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadIntoActiveTab(addressBar.value);
});
const newTabBtn = document.createElement("div");
newTabBtn.className = "chrome-newtab";
newTabBtn.innerHTML = `<i class="bi bi-plus"></i>`;
tabsContainer.appendChild(newTabBtn);
newTabBtn.addEventListener("click", () => {
    createTab(null, true);
});
createTab(null, true);