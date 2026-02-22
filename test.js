const tabsContainer = document.getElementById("tabs");
const content = document.getElementById("content");
const addressBar = document.getElementById("sj-address");
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
function createTab(url = null, isNTP = false) {
    const id = "tab-" + (++tabCounter);
    const tabBtn = document.createElement("div");
    tabBtn.className = "chrome-tab";
    tabBtn.innerHTML = `
        <span class="tab-title">${isNTP ? "New Tab" : "Loading..."}</span>
        <i class="bi bi-x close-tab"></i>
    `;
    tabsContainer.appendChild(tabBtn);
    const frame = document.createElement("iframe");
    frame.id = id;
    frame.className = "tab-frame";
    frame.style.display = "none";
    if (!isNTP && url) {
        frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
    }
    content.appendChild(frame);
    tabs.push({ id, tabBtn, frame });
    tabBtn.addEventListener("click", (e) => {
        if (e.target.classList.contains("close-tab")) return;
        switchTab(id);
    });
    tabBtn.querySelector(".close-tab").addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(id);
    });
    if (!isNTP && url) {
        frame.onload = () => {
            tabBtn.querySelector(".tab-title").textContent =
                frame.contentDocument?.title || url;
        };
    }
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
form.addEventListener("submit", e => {
    e.preventDefault();
    const input = addressBar.value.trim();
    if (!input) return;
    let url;
    try {
        url = new URL(input.startsWith("http") ? input : `https://${input}`).href;
    } catch {
        url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
    createTab(url);
    addressBar.value = "";
});
const newTabBtn = document.createElement("div");
newTabBtn.className = "chrome-newtab";
newTabBtn.innerHTML = `<i class="bi bi-plus"></i>`;
tabsContainer.appendChild(newTabBtn);
newTabBtn.addEventListener("click", () => {
    createTab(null, true);
});
createTab(null, true);