"use strict";
/** @param {string} input */
/** @param {string} template */
/** @returns {string} */
const form = document.getElementById("sj-form");
const addressBar = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const pxyErr = document.getElementById("pxyErr");
const errorCode = document.getElementById("sj-error-code");
const tabsContainer = document.getElementById("tabs");
const content = document.getElementById("content");
const backBtn = document.getElementById("nav-back");
const forwardBtn = document.getElementById("nav-forward");
const reloadBtn = document.getElementById("nav-reload");
const stockSW = "./sw.js";
const working = document.getElementById("workingPxy");
const broken = document.getElementById("brokenPxy");
let fullscreenBtn = null;
let isFullscreen = false;
let scramjet = null;
console.log("[proxy] location.hostname (n) =", n);
console.log("[proxy] location.href =", location.href);
console.log("[proxy] $scramjetLoadController available:", typeof $scramjetLoadController !== "undefined");
if (typeof $scramjetLoadController !== "undefined") {
    try {
        const { ScramjetController } = $scramjetLoadController();
        const scramjetFiles = {
            wasm: `https://${n}/scram/scramjet.wasm.wasm`,
            all: `https://${n}/scram/scramjet.all.js`,
            sync: `https://${n}/scram/scramjet.sync.js`,
        };
        console.log("[proxy] scramjet file URLs:", scramjetFiles);
        scramjet = new ScramjetController({ files: scramjetFiles });
        scramjet.init();
        console.log("[proxy] scramjet initialized successfully");
    } catch (err) {
        console.error("[proxy] scramjet initialization FAILED:", err);
        scramjet = null;
    }
} else {
    console.warn("[proxy] $scramjetLoadController is undefined — scramjet.all.js probably didn't load. Check network tab for a failed/404 request to /scram/scramjet.all.js");
}
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let blockedUrls = [];
async function loadBlockedUrls() {
    const endpoint = `https://${n}/edit-urls`;
    console.log("[proxy] fetching blocked urls from", endpoint);
    try {
        const res = await fetch(endpoint);
        console.log("[proxy] /edit-urls response status:", res.status);
        if (!res.ok) throw new Error("Failed To Fetch URLs");
        const data = await res.json();
        blockedUrls = Object.entries(data).map(([url, reason]) => ({
            url,
            reason
        }));
        console.log("[proxy] loaded", blockedUrls.length, "blocked url entries");
    } catch (err) {
        console.error("[proxy] loadBlockedUrls FAILED:", err);
        blockedUrls = [];
    }
}
async function registerSW() {
	if (!navigator.serviceWorker) {
		console.error("[proxy] navigator.serviceWorker is unavailable (page not served over https/localhost, or unsupported browser)");
		throw new Error("Service Workers Cannot Be Registered Without https.");
	}
	console.log("[proxy] registering service worker:", stockSW);
	try {
		const reg = await navigator.serviceWorker.register(stockSW);
		console.log("[proxy] service worker registered, scope:", reg.scope);
		if (reg.installing) console.log("[proxy] sw state: installing");
		if (reg.waiting) console.log("[proxy] sw state: waiting");
		if (reg.active) console.log("[proxy] sw state: active");
	} catch (err) {
		console.error("[proxy] service worker registration FAILED:", err);
		throw err;
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
const SEARCH_ENGINES = [
    { key: 'google', name: 'Google', desc: 'Most results', url: 'https://www.google.com/search?q=%s' },
    { key: 'brave', name: 'Brave', desc: 'Independent index', url: 'https://search.brave.com/search?q=%s' },
    { key: 'duckduckgo', name: 'DuckDuckGo', desc: 'Private, Bing-backed', url: 'https://duckduckgo.com/?q=%s' },
    { key: 'bing', name: 'Bing', desc: 'Microsoft', url: 'https://www.bing.com/search?q=%s' },
    { key: 'startpage', name: 'Startpage', desc: 'Google results, no tracking', url: 'https://www.startpage.com/sp/search?query=%s' },
    { key: 'ecosia', name: 'Ecosia', desc: 'Plants trees', url: 'https://www.ecosia.org/search?q=%s' },
    { key: 'wikipedia', name: 'Wikipedia', desc: 'Encyclopedia only', url: 'https://en.wikipedia.org/wiki/Special:Search?search=%s' },
    { key: 'custom', name: 'Custom', desc: 'Your own URL with %s', url: null }
];
const DEFAULT_SEARCH_ENGINE_KEY = 'google';
function applySavedSearchEngineToAddressBar() {
    const savedUrl = localStorage.getItem('searchEngineUrl');
    if (savedUrl && searchEngine) {
        searchEngine.value = savedUrl;
    } else if (searchEngine) {
        searchEngine.value = SEARCH_ENGINES.find(e => e.key === DEFAULT_SEARCH_ENGINE_KEY).url;
    }
}
applySavedSearchEngineToAddressBar();
function initSearchEnginePopup() {
    const trigger = document.getElementById("searchEngineTrigger");
    const popup = document.getElementById("miniEnginePopup");
    const grid = document.getElementById("miniSearchEngineGrid");
    const customGroup = document.getElementById("miniCustomEngineGroup");
    const customInput = document.getElementById("miniCustomEngineInput");
    const saveCustomBtn = document.getElementById("miniSaveCustomEngineBtn");
    if (!trigger || !popup || !grid) return;
    function getSelectedId() {
        return localStorage.getItem('searchEngineId') || DEFAULT_SEARCH_ENGINE_KEY;
    }
    function renderGrid() {
        const selectedId = getSelectedId();
        grid.innerHTML = SEARCH_ENGINES.map(se => `
            <div class="search-engine-item ${se.key === selectedId ? 'selected' : ''}" data-engine="${se.key}">
                <span class="search-engine-title">${se.name}</span>
                <span class="search-engine-desc">${se.desc}</span>
            </div>
        `).join('');
        grid.querySelectorAll('.search-engine-item').forEach((item) => {
            item.addEventListener('click', () => {
                const key = item.dataset.engine;
                const engine = SEARCH_ENGINES.find(se => se.key === key);
                if (!engine) return;
                if (key === 'custom') {
                    grid.querySelectorAll('.search-engine-item').forEach((el) => el.classList.remove('selected'));
                    item.classList.add('selected');
                    customGroup.style.display = '';
                    const existingCustom = localStorage.getItem('searchEngineCustomUrl');
                    if (existingCustom && customInput) customInput.value = existingCustom;
                    if (customInput) customInput.focus();
                    return;
                }
                customGroup.style.display = 'none';
                applyEngine(engine.key, engine.url, engine.name);
            });
        });
    }
    function updateTooltip(name) {
        trigger.title = `Currently Selected: ${name}`;
    }
    function applyEngine(key, url, name) {
        localStorage.setItem('searchEngineId', key);
        localStorage.setItem('searchEngineUrl', url);
        if (searchEngine) searchEngine.value = url;
        updateTooltip(name);
        renderGrid();
    }
    const initialId = getSelectedId();
    const initialEngine = SEARCH_ENGINES.find(se => se.key === initialId) || SEARCH_ENGINES.find(se => se.key === DEFAULT_SEARCH_ENGINE_KEY);
    updateTooltip(initialEngine.name);
    if (initialId === 'custom') {
        customGroup.style.display = '';
        const existingCustom = localStorage.getItem('searchEngineCustomUrl');
        if (existingCustom && customInput) customInput.value = existingCustom;
    }
    renderGrid();
    if (saveCustomBtn) {
        saveCustomBtn.addEventListener('click', () => {
            const url = customInput.value.trim();
            if (!url || !url.includes('%s')) return;
            localStorage.setItem('searchEngineCustomUrl', url);
            applyEngine('custom', url, 'Custom');
        });
    }
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.toggle('shows');
    });
    document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && !trigger.contains(e.target)) {
            popup.classList.remove('shows');
        }
    });
}
document.addEventListener("DOMContentLoaded", initSearchEnginePopup);
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
const newTabBtn = document.createElement("div");
newTabBtn.className = "chrome-newtab";
newTabBtn.innerHTML = `<i class="ic ic-plus" title="New Tab"></i>`;
tabsContainer.appendChild(newTabBtn);
newTabBtn.addEventListener("click", () => {
    createTab(true);
});
function createTab(isNTP = false) {
    const id = "tab-" + (++tabCounter);
    const tabBtn = document.createElement("div");
    tabBtn.className = "chrome-tab opening";
    tabBtn.innerHTML = `
        <img class="tab-favicon" src="" style="width:16px;height:16px;margin-right:6px;display:none;">
        <span class="tab-title">${isNTP ? "New Tab" : "Loading..."}</span>
        <i class="ic ic-x close-tab" title="Close Tab"></i>
    `;
    tabsContainer.insertBefore(tabBtn, newTabBtn);
    requestAnimationFrame(() => {
        tabBtn.classList.remove("opening");
        tabBtn.classList.add("active");
    });
    let frame = null;
    let frameObj = null;
    const tabData = {
        id,
        tabBtn,
        frame,
        frameObj,
        isNTP,
        displayUrl: "",
        isLoading: false
    };
    tabs.push(tabData);
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
        tab.isLoading = true;
        if (tab.id === activeTabId) showPxyLoader();
    });
    tab.frame.addEventListener("beforeunload", () => {
        tab.isLoading = true;
        if (tab.id === activeTabId) showPxyLoader();
    });
    tab.frame.addEventListener("load", () => {
        tab.isLoading = false;
        if (tab.id === activeTabId) hidePxyLoader();
    });
}
function switchTab(id) {
    activeTabId = id;
    tabs.forEach(t => {
        if (t.frame) {
            t.frame.classList.remove("active-frame");
            setTimeout(() => {
                t.frame.style.display = "none";
            }, 200);
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
        if (fullscreenBtn) {
            fullscreenBtn.style.display = "none";
        }
    } else {
        if (ntp) ntp.style.display = "none";
        if (tab.frame) {
            tab.frame.style.display = "block";
            requestAnimationFrame(() => {
                tab.frame.classList.add("active-frame");
            });
            if (fullscreenBtn) {
                fullscreenBtn.style.display = "block";
            } else {
                createFullscreenButton();
            }
        }    
    }
    if (!tab.isNTP) {
        if (fullscreenBtn) {
            fullscreenBtn.style.display = "block";
        } else {
            createFullscreenButton();
        }
        addressBar.value = tab.displayUrl || "";
        if (tab.isLoading) {
            showPxyLoader();
        } else {
            hidePxyLoader();
        }
    } else {
        hidePxyLoader();
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
    tab.tabBtn.classList.add("closing");
    setTimeout(() => {
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
    }, 250);
    if (tabs.length === 0) {
        createTab(true);
    } else {
        switchTab(tabs[Math.max(0, index - 1)].id);
    }
}
function createFullscreenButton() {
    if (fullscreenBtn) return;
    fullscreenBtn = document.createElement("button");
    fullscreenBtn.innerHTML = `<i class="ic ic-fullscreen"></i>`;
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
    if (!document.fullscreenElement) {
        tab.frame.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener("fullscreenchange", () => {
    const tab = getActiveTab();
    if (!tab) return;
    if (document.fullscreenElement) {
        isFullscreen = true;
        if (fullscreenBtn) fullscreenBtn.innerHTML = `<i class="ic ic-fullscreen-exit"></i>`;
        tab.frame.style.width = "100vw";
        tab.frame.style.height = "100vh";
    } else {
        isFullscreen = false;
        if (fullscreenBtn) fullscreenBtn.innerHTML = `<i class="ic ic-fullscreen"></i>`;
        tab.frame.style.width = "";
        tab.frame.style.height = "";
    }
});
async function loadIntoActiveTab(input) {
    if (!activeTabId) return;
    const reason = checkBlocked(input);
    if (reason) {
        pxyErr.style.display = "block";
        error.textContent = "Error";
        errorCode.textContent = `Error Code: ${reason}`;
        return;
    }
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    if (tab.isNTP) {
        tab.isNTP = false;
        if (fullscreenBtn) {
            fullscreenBtn.style.display = "block";
        } else {
            createFullscreenButton();
        }
        tab.frameObj = scramjet.createFrame();
        tab.frame = tab.frameObj.frame;
        tab.frame.id = tab.id;
        tab.frame.className = "tab-frame";
        tab.frame.style.display = "block";
        content.appendChild(tab.frame);
        attachFrameLoadEvents(tab);
        document.getElementById("ntp").style.display = "none";
        startUrlWatcher(tab);
    } else {
        createFullscreenButton();
    }
    try {
        await registerSW();
    } catch (err) {
        console.error("[proxy] aborting load — service worker failed:", err);
        pxyErr.style.display = "block";
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
    console.log("[proxy] wispUrl =", wispUrl);
    console.log("[proxy] bare-mux connection object:", connection);
    try {
        const currentTransport = await connection.getTransport();
        console.log("[proxy] current bare-mux transport:", currentTransport);
        if (currentTransport !== "/libcurl/index.mjs") {
            console.log("[proxy] setting bare-mux transport to /libcurl/index.mjs with websocket:", wispUrl);
            await connection.setTransport("/libcurl/index.mjs", [
                { websocket: wispUrl },
            ]);
            console.log("[proxy] transport set successfully");
        } else {
            console.log("[proxy] transport already set, skipping");
        }
    } catch (err) {
        console.error("[proxy] setting bare-mux transport FAILED:", err);
        pxyErr.style.display = "block";
        error.textContent = "Proxy transport failed.";
        errorCode.textContent = err.toString();
        hidePxyLoader();
        return;
    }
    if (!scramjet) {
        console.error("[proxy] scramjet is null — cannot navigate frame. See earlier [proxy] logs for why scramjet failed to initialize.");
    }
    tab.displayUrl = input;
    addressBar.value = input;
    const url = search(input, searchEngine.value);
    console.log("[proxy] navigating tab", tab.id, "to resolved url:", url);
    tab.tabBtn.querySelector(".tab-title").textContent = "Loading...";
    tab.isLoading = true;
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
        if (!tab.isNTP) {
            createFullscreenButton();
        }    
    };
    try {
        tab.frameObj.go(url);
        console.log("[proxy] tab.frameObj.go() called successfully for", url);
    } catch (err) {
        console.error("[proxy] tab.frameObj.go() threw:", err);
    }
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
    document.getElementById("pxyTime").textContent = `${hours}:${minutes}${ampm}`; 
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }; 
    document.getElementById("pxyDate").textContent = now.toLocaleDateString(undefined, options);
} 
setInterval(updateClock, 1000); 
updateClock(); 
let isGB = 0;
let btMsg = 'Hello';
if ("getBattery" in navigator) {
    navigator.getBattery().then(function(battery) {
        function updateBattery() {
            const batteryPer = Math.round(battery.level * 100);
            btMsg = `I'm Going To Guess Your Battery Percentage, Is It ${batteryPer}%? Knew It`;
            if (batteryPer <= 20 && !battery.charging) {
                btMsg = `Charge Your Device, Its At ${batteryPer}%`;
                isGB = 1;
            }
            if (battery.charging && isGB === 1) {
                btMsg = `Good Boy. Charging, ${batteryPer}%`;
                isGB = 0;
            }
            const phraseEl = document.getElementById("phrase");
            if (phraseEl.textContent.includes("Charge Your Device") ||
                phraseEl.textContent.includes("Battery Percentage") ||
                phraseEl.textContent.includes("Charging")) {
                phraseEl.textContent = btMsg;
            }
        }
        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
        setRandomPhrase();
    });
}
const hosturl = window.location.host;
function setRandomPhrase() { 
        const phrases = [ 
        "Walking By The Wall",
        "The Shadows Will Not Fall",
        "Is Silently Ignored",
        "Discouraged By The Noise",
        "Living Without Choice",
        "Is A Life Without A Voice",
        "When You Can't Even Say My Name",
        "Has The Memory Gone? Are You Feeling Numb?",
        "Go On, Call My Name",
        "I Can't Play This Game, So I Ask Again",
        "Will You Say My Name?",
        "Has The Memory Gone? Are You Feeling Numb?",
        "Or Have I Become Invisible?",
        "The Dreamers Wish Away",
        "Its Falling On My Face",
        "The Shape Of My Disgrace",
        "When You Don't Hear A Word I Say",
        "As The Talking Goes, It's A One-Way Flow",
        "No Fault, No Blame",
        "Has The Memory Gone? Are You Feelin' Numb?",
        "And Have I Become Invisible?",
        "No One Hears A Word They Say",
        "Has The Memory Gone? Are You Feelin' Numb?",
        "Not A Word They Say",
        "But A Voiceless Crowd Isn't Backin' Down",
        "When The Air Turns Red",
        "With A Loaded Hesitation",
        "Can You Say My Name?",
        "Has The Memory Gone? Are You Feelin' Numb?",
        "Have We All Become Invisible?",
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
        `Greetings, Person On ${hosturl}`,
        "Loading Virus.exe",
        "Nitrix67 Likes Men",
        "Life Is A Highway",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        `${btMsg}`,
        `${i}`,
        "Kim Jong Un Is Master Of Goon",
        "Rest In Peace My Granny She Got Hit By A Bazooka",
        "Yeah, I think about her every time I hit the hookah",
        "Kaboom, Kablow, Kaboom",
        "I Was In My Room Trying To Teach My Little Sister",
        "Then I Heard A Boom And It Sounded Like A Missle",
        "Who That Is, What That Was",
        "Oh That Granny, Oh She Done",
        "I Was In The Matrix, But The Matrix Was Too Slow So I Had To Come Here",
        "What Is This Diddyblud Doin On The Calculator",
        "EXCUSE ME SIR"
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
document.addEventListener("DOMContentLoaded", function () {
    console.log("[proxy] DOMContentLoaded — scramjet is", scramjet ? "initialized" : "NULL (showing broken screen)");
    if (!scramjet) {
        working.style.display = "none";
        broken.style.display = "block";
    }
});