import { auth, onAuthStateChanged } from "./imports.js";
let authReady = false;
let isLoggedInMsg = "Login";
let isLoggedInClass = "button";
let isLoggedInLink = "/InfiniteLogins.html";
const DEFAULT_BACKEND = a;
let BACKEND = localStorage.getItem('backendUrl') || DEFAULT_BACKEND;
let currentUser = null;
const authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        isLoggedInMsg = "My Account";
        isLoggedInClass = ""
        isLoggedInLink = "/InfiniteAccounts.html"; 
        authReady = true;
        resolve(user);
    });
});
async function getAuthToken() {
    await authReadyPromise;
    if (currentUser) {
        return await currentUser.getIdToken();
    }
    return null;
}
async function fetchAPI(endpoint, body) {
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(`${BACKEND}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Request failed");
    }
    return json;
}
function pathToArray(path) {
    return path.split("/").filter(Boolean);
}
async function dbGet(path) {
    const res = await fetchAPI("read", { path: pathToArray(path) });
    return res.data;
}
async function dbSet(path, value) {
    return await fetchAPI("write", {
        path: pathToArray(path),
        value
    });
}
let pfpDomain = "/pfps";
if (!(e.includes(window.location.host))) {
    pfpDomain = "https://raw.githubusercontent.com/InfiniteCampus41/InfiniteCampus/refs/heads/main/pfps";
}
let profileImages = [];
async function loadProfileImages() {
    try {
        const res = await fetch(`${pfpDomain}/index.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const files = await res.json();
        return files.map(f => `${pfpDomain}/` + f);
    } catch (e) {
        console.error("Failed To Load Profile Images:", e);
        return [`${pfpDomain}/1.jpeg`];
    }
}
async function resolveProfilePicUrl(picIndex) {
    try {
        if (!profileImages || profileImages.length === 0) {
            profileImages = await loadProfileImages();
        }
        const baseUrl = profileImages[picIndex || 0] || profileImages[0] || `${pfpDomain}/1.jpeg`;
        return baseUrl.split("?")[0];
    } catch (err) {
        console.error("Failed To Resolve Profile Picture:", err);
        return `${pfpDomain}/1.jpeg`;
    }
}
let accountDisplayName = "";
let accountNameColor = "#ffffff";
let accountPicUrl = "";
onAuthStateChanged(auth, async (user) => {
    if (!user) return;   
    try {
        const [pankey, panurl, title, weather, displayName, nameColor, picIndex] = await Promise.all([
            dbGet(`users/${user.uid}/settings/panicKey`),
            dbGet(`users/${user.uid}/settings/panicUrl`),
            dbGet(`users/${user.uid}/settings/pageTitle`),
            dbGet(`users/${user.uid}/settings/betterWeather`),
            dbGet(`users/${user.uid}/profile/displayName`),
            dbGet(`users/${user.uid}/settings/color`),
            dbGet(`users/${user.uid}/profile/pic`)
        ]);
        if (pankey) localStorage.setItem('panicKey', pankey);
        if (panurl) localStorage.setItem('panicUrl', panurl);
        if (title) localStorage.setItem('pageTitle', title);
        if (weather !== undefined) {
            localStorage.setItem('betterWeather', weather ? 'true' : 'false');
        }
        accountDisplayName = displayName || user.email || "Account";
        accountNameColor = nameColor || localStorage.getItem('color') || "#ffffff";
        if (nameColor) localStorage.setItem('color', nameColor);
        accountPicUrl = await resolveProfilePicUrl(picIndex);
        window.dispatchEvent(new Event("settingsLoaded"));
        applySettingsToUI();
    } catch (error) {
        console.warn("DB load failed:", error);
    }
});
function updateAccountButton(el) {
    if (!el) return;
    el.href = isLoggedInLink;
    el.innerHTML = '';
    if (currentUser) {
        el.classList.remove('button');
        el.classList.add('mini-profile-btn');
        const photoURL = accountPicUrl || `${pfpDomain}/1.jpeg`;
        const username = accountDisplayName || currentUser.email || 'Account';
        const nameColor = accountNameColor || '#ffffff';
        const pic = document.createElement('img');
        pic.className = 'mini-profile-pic';
        pic.src = photoURL;
        pic.alt = '';
        const info = document.createElement('div');
        info.className = 'mini-profile-info';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'mini-profile-username';
        nameSpan.style.color = nameColor;
        nameSpan.textContent = username;
        const editSpan = document.createElement('p');
        editSpan.className = 'mini-profile-edit';
        editSpan.innerHTML = '<i class="ic ic-pencil-fill"></i>  Edit Profile';
        info.appendChild(nameSpan);
        info.appendChild(editSpan);
        el.appendChild(pic);
        el.appendChild(info);
    } else {
        el.classList.remove('mini-profile-btn');
        el.classList.add('button');
        el.textContent = isLoggedInMsg;
    }
}
function applySettingsToUI() {
    const panicKeyInput = document.getElementById('panicKeyInput');
    const panicUrlInput = document.getElementById('panicUrlInput');
    const titleInput = document.getElementById('titleInput');
    const fontInputEl = document.getElementById('fontInput');
    const betterWeatherToggle = document.getElementById('betterWeatherToggle');
    const clockBarToggle = document.getElementById('clockBarToggle');
    const clockBar = document.getElementById('clockBar');
    const faviconPreview = document.getElementById('faviconPreview');
    const bgPreview = document.getElementById('bgPreview');
    const savedTitle = localStorage.getItem('pageTitle') || '';
    const savedFavicon = localStorage.getItem('customFavicon') || '';
    const savedBackground = localStorage.getItem('customBackground') || '';
    const savedFontVal = localStorage.getItem('customFont') || '';
    const betterWeatherState = localStorage.getItem('betterWeather') === 'true';
    const showClockBarState = localStorage.getItem('showClockBar') === null
        ? true
        : localStorage.getItem('showClockBar') === 'true';
    const panicKey = localStorage.getItem('panicKey') || '';
    const panicUrl = localStorage.getItem('panicUrl') || '';
    const popuplogin = document.getElementById('popuplogin');
    updateAccountButton(popuplogin);
    if (panicKeyInput) {
        panicKeyInput.value = panicKey ? `Key: ${panicKey}` : '';
    }
    if (panicUrlInput) {
        panicUrlInput.value = panicUrl;
    }
    if (titleInput) {
        titleInput.value = savedTitle;
        if (savedTitle) document.title = savedTitle;
    }
    if (fontInputEl) {
        fontInputEl.value = savedFontVal;
    }
    if (betterWeatherToggle) {
        betterWeatherToggle.checked = betterWeatherState;
    }
    if (clockBarToggle) {
        clockBarToggle.checked = showClockBarState;
    }
    if (clockBar) {
        clockBar.style.display = showClockBarState ? '' : 'none';
    }
    if (savedFavicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = savedFavicon;
        if (faviconPreview) {
            faviconPreview.src = savedFavicon;
            faviconPreview.classList.add('show');
        }
    }
    if (savedBackground && bgPreview) {
        bgPreview.style.backgroundImage = `url('${savedBackground}')`;
        bgPreview.classList.add('show');
    }
}
const DEFAULT_BG = '/res/bg.png';
window.addEventListener('DOMContentLoaded', () => {
    let savedTitle = '';
    let savedFavicon = '';
    let savedBackground = '';
    let betterWeatherState = false;
    let showClockBarState = true;
    let panicKey = localStorage.getItem('panicKey') || null;
    let panicUrl = localStorage.getItem('panicUrl') || '';
    try {
        savedTitle = localStorage.getItem('pageTitle') || '';
        savedFavicon = localStorage.getItem('customFavicon') || '';
        savedBackground = localStorage.getItem('customBackground') || '';
        betterWeatherState = localStorage.getItem('betterWeather') === 'true';
        showClockBarState = localStorage.getItem('showClockBar') === null
            ? true
            : localStorage.getItem('showClockBar') === 'true';
    } catch (e) {
        console.warn('LocalStorage Not Available, Using Defaults:', e);
    }
    const savedFont = localStorage.getItem('customFont') || '';
    const ICON_CLOAK = `<i class="ic ic-eye-slash"></i>`;
    const ICON_CUSTOM = `<i class="ic ic-palette"></i>`;
    const ICON_ADV = `<i class="ic ic-sliders"></i>`;
    const ICON_DATA = `<i class="ic ic-database-fill"></i>`;
    const ICON_ABOUT = `<i class="ic ic-info-circle"></i>`;
    const ICON_CHECK = `<i class="ic ic-check-circle-fill"></i>`;
    const ICON_SEARCH = `<i class="ic ic-search"></i>`;
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
    const savedSearchEngineId = localStorage.getItem('searchEngineId') || DEFAULT_SEARCH_ENGINE_KEY;
    const savedSearchEngineUrl = localStorage.getItem('searchEngineUrl') || SEARCH_ENGINES.find(e => e.key === DEFAULT_SEARCH_ENGINE_KEY).url;
    const savedSearchEngineCustomUrl = localStorage.getItem('searchEngineCustomUrl') || '';
    const searchEngineGridHTML = SEARCH_ENGINES.map(se => `
        <div class="search-engine-item ${se.key === savedSearchEngineId ? 'selected' : ''}" data-engine="${se.key}">
            <span class="search-engine-check">${ICON_CHECK}</span>
            <span class="search-engine-title">
                ${se.name}
            </span>
            <span class="search-engine-desc">
                ${se.desc}
            </span>
        </div>
    `).join('');
    const THEMES = [
        { key: 'red', name: 'Crimson', gradient: 'linear-gradient(to right, darkred, black)' },
        { key: 'green', name: 'Green Fien', gradient: 'linear-gradient(to right, #8cbe37, black)' },
        { key: 'sunset', name: 'Sunset', gradient: 'linear-gradient(to right, yellow, brown)' },
        { key: 'reversered', name: 'Reverse Crimson', gradient: 'linear-gradient(to right, black, darkred)' },
        { key: 'reversegreen', name: 'Reverse Green', gradient: 'linear-gradient(to right, black, #8cbe37)' },
        { key: 'reversesunset', name: 'Reverse Sunset', gradient: 'linear-gradient(to right, brown, yellow)' },
        { key: 'bty', name: 'Beauty', gradient: 'linear-gradient(to right, #37A7BE, #8cbe37, yellow)' },
        { key: 'btg', name: 'Black & Gold', gradient: 'linear-gradient(to right, black, gold)' },
        { key: 'lights', name: 'Stripes', gradient: 'linear-gradient(234deg, black, darkred, red, blue, orange, darkgreen, lime, yellow, gold, black)' },
        { key: 'bld', name: 'Darksaber', gradient: 'linear-gradient(to bottom, black, white, black)' },
        { key: 'gsaber', name: 'Green Saber', gradient: 'linear-gradient(to bottom, #004000, #00FF00, white)' },
        { key: 'rsaber', name: 'Red Saber', gradient: 'linear-gradient(to bottom, #330000, red, white)' },
        { key: 'bsaber', name: 'Blue Saber', gradient: 'linear-gradient(to bottom, #011926, #5880A2, white)' },
        { key: 'psaber', name: 'Purple Saber', gradient: 'linear-gradient(to bottom, #1B1B1B, purple, white)' },
        { key: 'trans', name: 'Transparent', gradient: 'linear-gradient(to bottom, black, transparent, black)' },
        { key: 'drk', name: 'Dark', gradient: 'linear-gradient(to right, black, black)' },
        { key: 'lit', name: 'Light', gradient: 'linear-gradient(to right, rgb(214,214,214), rgb(214,214,214))' },
        { key: 'mnb', name: 'Midnight Blue', gradient: 'linear-gradient(to right, darkblue, black)' },
        { key: 'cms', name: 'Christmas', gradient: 'linear-gradient(to right, green, red)' },
        { key: 'wtr', name: 'Winter', gradient: 'linear-gradient(to right, #374377, #bec7ad)' },
        { key: 'lve', name: 'Valentines', gradient: 'linear-gradient(to right, #be5f37, #be3786)' },
        { key: 'tky', name: 'Fall Theme', gradient: 'linear-gradient(to right, #be9a37, #be5f37)' },
        { key: 'hwn', name: 'Halloween', gradient: 'linear-gradient(to right, #ff9500, #231f1f)' },
        { key: 'rgb', name: 'RGB', gradient: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)' }
    ];
    const THEME_SWATCH_PARTICLES = {
        wtr: { iconClass: "ic ic-snow", colors: ["white", "#e0f7ff", "#cfe8ff"] },
        cms: { iconClass: "ic ic-snow", colors: ["white", "#e0f7ff", "#cfe8ff"] },
        lve: { iconClass: "ic ic-heart-fill", colors: ["red", "#ff4d6d", "#ff8fa3"] },
        hwn: { iconClass: "ic ic-pumpkin", colors: ["orange", "#ff7518", "#cc5500"] },
        tky: { iconClass: "ic ic-leaf-fill", colors: ["yellow", "#d4a017", "#b7410e"] }
    };
    const SWATCH_PARTICLE_ROTATIONS = [25, 100, 125];
    function buildSwatchParticlesHTML(themeKey) {
        const config = THEME_SWATCH_PARTICLES[themeKey];
        if (!config) return '';
        const particles = SWATCH_PARTICLE_ROTATIONS.map((deg, i) => {
            const color = config.colors[i % config.colors.length];
            return `<i class="${config.iconClass} theme-swatch-particle" style="color:${color}; transform:rotate(${deg}deg);"></i>`;
        }).join('');
        return `<div class="theme-swatch-particles">${particles}</div>`;
    }
    const themeGridHTML = THEMES.map(t => `
        <div class="theme-item" data-theme="${t.key}">
            <div class="theme-swatch" style="background:${t.gradient}">
                <div class="theme-check">
                    ${ICON_CHECK}
                </div>
                ${buildSwatchParticlesHTML(t.key)}
            </div>
            <span class="theme-name">
                ${t.name}
            </span>
        </div>
    `).join('');
    const popupHTML = `
        <div class="popup-backdrop" id="popupBackdrop"></div>
        <div class="popup2" id="popup">
            <div class="popup-header themed">
                <div class="bar" id="clockBar" style="${showClockBarState ? '' : 'display:none;'}">
                    <div id="clocks">
                        --:--:-- --
                    </div>
                </div>
                <h3 class="btxt">
                    Settings
                </h3>
                <button class="popup-close" id="popupClose" type="button" aria-label="Close">
                    <i class="ic ic-x-circle">
                    </i>
                </button>
            </div>
            <div class="popup-body">
                <div class="popup-sidebar">
                    <a class="account-btn ${isLoggedInClass}" id="popuplogin" href="${isLoggedInLink}">
                        ${isLoggedInMsg}
                    </a>
                    <div class="tab-list">
                        <button class="tab-btn active" type="button" data-tab="cloaking">
                            ${ICON_CLOAK}
                            <span>
                                Tab Cloaking
                            </span>
                        </button>
                        <button class="tab-btn" type="button" data-tab="customization">
                            ${ICON_CUSTOM}
                            <span>
                                Customization
                            </span>
                        </button>
                        <button class="tab-btn" type="button" data-tab="search">
                            ${ICON_SEARCH}
                            <span>
                                Search
                            </span>
                        </button>
                        <button class="tab-btn" type="button" data-tab="advanced">
                            ${ICON_ADV}
                            <span>
                                Advanced
                            </span>
                        </button>
                        <button class="tab-btn" type="button" data-tab="data">
                            ${ICON_DATA}
                            <span>
                                Data
                            </span>
                        </button>
                        <button class="tab-btn" type="button" data-tab="about">
                            ${ICON_ABOUT}
                            <span>
                                About
                            </span>
                        </button>
                    </div>
                    <a class="button contact-btn-side" href="InfiniteContacts.html">
                        Contact Me
                    </a>
                </div>
                <div class="popup-content">
                    <div class="tab-title-bar" id="tabTitleBar">
                        Tab Cloaking
                    </div>
                    <div class="tab-panes-wrapper">
                        <div class="tab-pane active" id="tab-cloaking">
                            <div class="section">
                                <div class="field-group">
                                    <input class="button" type="text" id="titleInput" placeholder="Page Title" value="${savedTitle}">
                                    <div class="row-actions">
                                        <button id="saveTitleBtn" class="button">
                                            Save
                                        </button>
                                        <button id="resetTitleBtn" class="button">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div class="field-group">
                                    <label id="fLabel" for="faviconInput" class="button">
                                        Favicon Image
                                    </label>
                                    <input type="file" class="button" id="faviconInput" accept="image/*" hidden>
                                    <img id="faviconPreview" class="preview-img ${savedFavicon ? 'show' : ''}" src="${savedFavicon}">
                                    <div class="row-actions">
                                        <button class="button" id="setFaviconBtn">
                                            Save
                                        </button>
                                        <button class="button" id="resetFaviconBtn">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div class="field-group" style="display:flex; flex-direction:column; align-items:center;">
                                    <input id="panicKeyInput" class="button" placeholder="Panic Key" readonly>
                                    <input id="panicUrlInput" class="button" placeholder="Set Panic URL">
                                    <div class="row-actions">
                                        <button id="savePanicBtn" class="button">
                                            Save
                                        </button>
                                        <button id="clearPanicBtn" class="button">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <hr>
                            <div class="section" style="justify-content:center">
                                <a class="button" href="InfiniteApps.html?blank=true">
                                    Open In About:Blank
                                </a>
                            </div>
                        </div>
                        <div class="tab-pane" id="tab-customization">
                            <div class="setting-row weather-switch">
                                <label>
                                    More Accurate Weather
                                </label>
                                <label class="switch">
                                    <input type="checkbox" id="betterWeatherToggle" ${betterWeatherState ? 'checked' : ''}>
                                    <span class="slider">
                                    </span>
                                </label>
                            </div>
                            <div class="setting-row">
                                <label>
                                    Show Clock Bar
                                </label>
                                <label class="switch">
                                    <input type="checkbox" id="clockBarToggle" ${showClockBarState ? 'checked' : ''}>
                                    <span class="slider">
                                    </span>
                                </label>
                            </div>
                            <hr>
                            <div class="section">
                                <div class="field-group">
                                    <label id="bgLabel" for="bgInput" class="button">
                                        Background Image
                                    </label>
                                    <input type="file" class="button" id="bgInput" accept="image/*" hidden>
                                    <div id="bgPreview" class="preview-img-bg ${savedBackground ? 'show' : ''}" style="${savedBackground ? `background-image:url('${savedBackground}')` : ''}"></div>
                                    <div class="row-actions">
                                        <button class="button" id="setBgBtn">
                                            Save
                                        </button>
                                        <button class="button" id="resetBgBtn">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div class="field-group">
                                    <input class="button" type="text" id="fontInput" placeholder="Google Font Name" value="${savedFont}">
                                    <div class="row-actions">
                                        <button id="applyFontBtn" class="button">
                                            Save
                                        </button>
                                        <button id="resetFontBtn" class="button">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div class="field-group">
                                    <label id="fontFileLabel" for="fontFileInput" class="button">
                                        Import .woff2 Font
                                    </label>
                                    <input type="file" class="button" id="fontFileInput" accept=".woff2" hidden>
                                    <span id="fontFileName" class="theme-name"></span>
                                    <div class="row-actions">
                                        <button id="resetFontFileBtn" class="button">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button class="button" id="toggleSnowBtn">
                                Toggle Snow
                            </button>
                            <hr>
                            <div class="section" style="flex-direction:column; align-items:center;">
                                <div class="field-group theme-option-group" id="solidColorGroup">
                                    <label class="theme-section-label">Solid Color <span class="option-check">${ICON_CHECK}</span></label>
                                    <input type="color" class="button" id="colorInput" title="Pick A Solid Header Color">
                                </div>
                                <div class="field-group theme-option-group" id="gradientColorGroup">
                                    <label class="theme-section-label">
                                        Custom Gradient 
                                        <span class="option-check">
                                            ${ICON_CHECK}
                                        </span>
                                    </label>
                                    <div class="row-actions">
                                        <input type="color" class="button" id="gradientLeft" title="Left Gradient Color">
                                        <input type="color" class="button" id="gradientRight" title="Right Gradient Color">
                                    </div>
                                </div>
                                <div class="field-group">
                                    <label class="theme-section-label">
                                        Preset Themes
                                    </label>
                                    <div class="theme-grid" id="themeGrid">
                                        ${themeGridHTML}
                                    </div>
                                </div>
                                <button class="button" id="resetColors">
                                    Reset Theme
                                </button>
                            </div>
                        </div>
                        <div class="tab-pane" id="tab-search">
                            <div class="section" style="flex-direction:column; align-items:stretch;">
                                <p class="search-section-title">
                                    Search Engine
                                </p>
                                <p class="search-section-sub">
                                    Used For Anything Typed Into The Proxy Address Bar That Isn't A URL.
                                </p>
                                <div class="search-engine-grid" id="searchEngineGrid">
                                    ${searchEngineGridHTML}
                                </div>
                                <div class="field-group" id="customEngineGroup" style="${savedSearchEngineId === 'custom' ? '' : 'display:none;'} margin-top:10px;">
                                    <input class="button" type="text" id="customEngineInput" placeholder="https://example.com/search?q=%s" value="${savedSearchEngineCustomUrl}">
                                    <div class="row-actions">
                                        <button id="saveCustomEngineBtn" class="button">
                                            Save
                                        </button>
                                    </div>
                                </div>
                                <p class="search-section-title" style="margin-top:14px;">
                                    Preview
                                </p>
                                <div class="search-preview-box" id="searchEnginePreview">
                                    ${savedSearchEngineUrl.replace('%s', encodeURIComponent('hello world'))}
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane" id="tab-advanced">
                            <div class="section">
                                <div class="field-group">
                                    <input id="backendUrlInput" class="button" placeholder="Backend URL" value="${localStorage.getItem('backendUrl') || ''}">
                                    <div class="row-actions">
                                        <button id="saveBackendBtn" class="button">
                                            Save
                                        </button>
                                        <button id="resetBackendBtn" class="button">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>                            
                        </div>
                        <div class="tab-pane" id="tab-data">
                            <div class="section" style="flex-direction:column; align-items:center;">
                                <p class="btxt" style="text-align:center">
                                    Export A Backup Of All Your Local Data Including Settings, Playlists, And Login Data Or Import A Previously Exported Backup.
                                </p>
                                <div class="row-actions">
                                    <button class="button" id="exportDataBtn">
                                        Export Data
                                    </button>
                                    <label id="importDataLabel" for="importDataInput" class="button">
                                        Import Data
                                    </label>
                                    <input type="file" class="button" id="importDataInput" accept="application/json,.json" hidden>
                                </div>
                                <span id="dataStatus" class="theme-name">
                                </span>
                                <hr style="width:75%;">
                                <div style="position:relative; display:inline-block;">
                                    <span class="r" style="display:block; font-size:0.8em; text-align:center; margin-bottom:2px;">
                                        WARNING: Contains Your Login Data
                                    </span>
                                    <button class="button" id="exportDataFullBtn">
                                        Export Data (Full)
                                    </button>
                                </div>
                                <br>
                                <hr style="width:75%;">
                                <a class="button" id="resetAllBtn">
                                    Clear Data
                                </a>
                            </div>
                        </div>
                        <div class="tab-pane" id="tab-about">
                            <div class="section" style="justify-content:center">
                                <a class="button" href="InfiniteChatters.html?channel=Suggestions">
                                    Suggest A Feature
                                </a>
                                <a class="discord button" href="${i}" target="_blank">
                                    Join The Discord
                                </a>
                                <a class="button" href="InfiniteDonaters.html">
                                    Help Support By Donating
                                </a>
                            </div>
                            <hr>
                            <p class="btxt" style="text-align:left">
                                Credits
                            </p>
                            <div class="credits">
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Hacker41
                                    </span>
                                    <span class="credit-role">
                                        Owner & Developer
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        F3intl
                                    </span>
                                    <span class="credit-role">
                                        Co-Owner
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Kaiden
                                    </span>
                                    <span class="credit-role">
                                        Co-Owner
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Yoyomaster95
                                    </span>
                                    <span class="credit-role">
                                        Co-Owner
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Nitrix67
                                    </span>
                                    <span class="credit-role">
                                        Head-Admin
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Gmacbride
                                    </span>
                                    <span class="credit-role">
                                        Developer
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Breeezyy
                                    </span>
                                    <span class="credit-role">
                                        Admin
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Kid
                                    </span>
                                    <span class="credit-role">
                                        Admin
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        WalmartQuagmire
                                    </span>
                                    <span class="credit-role">
                                        Admin
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Scramjet
                                    </span>
                                    <span class="credit-role">
                                        Proxy Engine
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        GN-Math
                                    </span>
                                    <span class="credit-role">
                                        Games Source
                                    </span>
                                </div>
                                <div class="credits-row">
                                    <span class="credit-name">
                                        Cherri
                                    </span>
                                    <span class="credit-role">
                                        UI Inspiration
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="settings-button themed" id="trigger">
            <img class="settings" src="/res/settings.svg">
        </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = popupHTML;
    document.body.appendChild(wrapper);
    const tabBtns = wrapper.querySelectorAll('.tab-btn');
    const tabPanes = wrapper.querySelectorAll('.tab-pane');
    const tabTitleBar = document.getElementById('tabTitleBar');
    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach((b) => b.classList.remove('active'));
            tabPanes.forEach((p) => p.classList.remove('active'));
            btn.classList.add('active');
            const target = wrapper.querySelector(`#tab-${btn.dataset.tab}`);
            if (target) target.classList.add('active');
            if (tabTitleBar) {
                const label = btn.querySelector('span');
                tabTitleBar.textContent = label ? label.textContent : '';
            }
        });
    });
    function updateFont(fontName) {
        const existingLink = document.getElementById('customFontLink');
        if (existingLink) existingLink.remove();
        if (fontName) {
            const link = document.createElement('link');
            link.id = 'customFontLink';
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName).replace(/%20/g, '+')}&display=swap`;
            document.head.appendChild(link);
            document.body.style.fontFamily = `'${fontName}', sans-serif`;
        } else {
            document.body.style.fontFamily = '';
        }
    }
    if (savedFont) updateFont(savedFont);
    const fontInput = document.getElementById('fontInput');
    const applyFontBtn = document.getElementById('applyFontBtn');
    const resetFontBtn = document.getElementById('resetFontBtn');
    if (applyFontBtn) {
        applyFontBtn.addEventListener('click', () => {
            const fontName = fontInput.value.trim();
            if (!fontName) {
                showError('Please Enter A Valid Font Name');
                return;
            }
            localStorage.setItem('customFont', fontName);
            updateFont(fontName);
            if (uploadedFontFace) {
                try { document.fonts.delete(uploadedFontFace); } catch (e) {}
                uploadedFontFace = null;
            }
            deleteFontFileFromDB().catch(() => {});
            const fFileInput = document.getElementById('fontFileInput');
            const fFileName = document.getElementById('fontFileName');
            const fFileLabel = document.getElementById('fontFileLabel');
            if (fFileInput) fFileInput.value = '';
            if (fFileName) fFileName.textContent = '';
            if (fFileLabel) fFileLabel.style.display = '';
            showSuccess(`Font Set To "${fontName}"`);
        });
    }
    if (resetFontBtn) {
        resetFontBtn.addEventListener('click', () => {
            localStorage.removeItem('customFont');
            fontInput.value = '';
            updateFont('');
            showSuccess('Font Reset To Default');
        });
    }
    const FONT_DB_NAME = 'customFontFilesDB';
    const FONT_STORE_NAME = 'fonts';
    const FONT_DB_KEY = 'customFontFile';
    function openFontDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(FONT_DB_NAME, 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(FONT_STORE_NAME)) {
                    req.result.createObjectStore(FONT_STORE_NAME);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async function saveFontFileToDB(name, buffer) {
        const db = await openFontDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FONT_STORE_NAME, 'readwrite');
            tx.objectStore(FONT_STORE_NAME).put({ name, buffer }, FONT_DB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    async function loadFontFileFromDB() {
        const db = await openFontDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FONT_STORE_NAME, 'readonly');
            const req = tx.objectStore(FONT_STORE_NAME).get(FONT_DB_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }
    async function deleteFontFileFromDB() {
        const db = await openFontDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FONT_STORE_NAME, 'readwrite');
            tx.objectStore(FONT_STORE_NAME).delete(FONT_DB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    let uploadedFontFace = null;
    async function applyFontFile(buffer) {
        if (uploadedFontFace) {
            try { document.fonts.delete(uploadedFontFace); } catch (e) {}
        }
        const fontFace = new FontFace('CustomUploadedFont', buffer);
        await fontFace.load();
        document.fonts.add(fontFace);
        uploadedFontFace = fontFace;
        const existingLink = document.getElementById('customFontLink');
        if (existingLink) existingLink.remove();
        document.body.style.fontFamily = "'CustomUploadedFont', sans-serif";
    }
    const fontFileInput = document.getElementById('fontFileInput');
    const fontFileLabel = document.getElementById('fontFileLabel');
    const fontFileName = document.getElementById('fontFileName');
    const resetFontFileBtn = document.getElementById('resetFontFileBtn');
    (async () => {
        try {
            const stored = await loadFontFileFromDB();
            if (stored && stored.buffer) {
                await applyFontFile(stored.buffer);
                if (fontFileName) fontFileName.textContent = stored.name || '';
                if (fontFileLabel) fontFileLabel.style.display = 'none';
            }
        } catch (err) {
            console.warn('Could Not Load Stored Font File:', err);
        }
    })();
    if (fontFileInput) {
        fontFileInput.addEventListener('change', async () => {
            const file = fontFileInput.files[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith('.woff2')) {
                showError('Please Select A .woff2 Font File');
                return;
            }
            try {
                const buffer = await file.arrayBuffer();
                await applyFontFile(buffer);
                await saveFontFileToDB(file.name, buffer);
                localStorage.removeItem('customFont');
                if (fontInput) fontInput.value = '';
                if (fontFileName) fontFileName.textContent = file.name;
                if (fontFileLabel) fontFileLabel.style.display = 'none';
                showSuccess(`Font File "${file.name}" Applied`);
            } catch (err) {
                console.error('Failed To Load Font File:', err);
                showError('Failed To Load Font File');
            }
        });
    }
    if (resetFontFileBtn) {
        resetFontFileBtn.addEventListener('click', async () => {
            try {
                await deleteFontFileFromDB();
            } catch (err) {
                console.warn('Could Not Clear Stored Font File:', err);
            }
            if (uploadedFontFace) {
                try { document.fonts.delete(uploadedFontFace); } catch (e) {}
                uploadedFontFace = null;
            }
            document.body.style.fontFamily = '';
            if (fontFileInput) fontFileInput.value = '';
            if (fontFileName) fontFileName.textContent = '';
            if (fontFileLabel) fontFileLabel.style.display = '';
            showSuccess('Custom Font File Reset');
            const gFont = localStorage.getItem('customFont');
            if (gFont) updateFont(gFont);
        });
    }
    const themeItems = wrapper.querySelectorAll('.theme-item');
    const solidColorGroup = document.getElementById('solidColorGroup');
    const gradientColorGroup = document.getElementById('gradientColorGroup');
    function clearThemeSelection() {
        themeItems.forEach((item) => {
            const swatch = item.querySelector('.theme-swatch');
            if (swatch) swatch.classList.remove('selected');
        });
    }
    function clearCustomOptionSelection() {
        solidColorGroup?.classList.remove('selected');
        gradientColorGroup?.classList.remove('selected');
    }
    function markThemeSelected(key) {
        clearThemeSelection();
        clearCustomOptionSelection();
        if (!key) return;
        const match = wrapper.querySelector(`.theme-item[data-theme="${key}"] .theme-swatch`);
        if (match) match.classList.add('selected');
    }
    function markSolidColorSelected() {
        clearThemeSelection();
        gradientColorGroup?.classList.remove('selected');
        solidColorGroup?.classList.add('selected');
    }
    function markGradientSelected() {
        clearThemeSelection();
        solidColorGroup?.classList.remove('selected');
        gradientColorGroup?.classList.add('selected');
    }
    const initialTheme = localStorage.getItem('useGradient');
    const initialFlat = localStorage.getItem('headerColor');
    if (initialTheme && initialTheme !== 'custom') {
        markThemeSelected(initialTheme);
    } else if (initialTheme === 'custom') {
        markGradientSelected();
    } else if (initialFlat) {
        markSolidColorSelected();
    }
    themeItems.forEach((item) => {
        item.addEventListener('click', () => {
            const key = item.dataset.theme;
            ['gradientLeft', 'gradientRight', 'headerColor'].forEach((k) => localStorage.removeItem(k));
            localStorage.setItem('useGradient', key);
            if (typeof window.applyTheme === 'function') {
                window.applyTheme('#000000', key);
            }
            markThemeSelected(key);
            const nameEl = item.querySelector('.theme-name');
            showSuccess(`Theme Set To "${nameEl ? nameEl.textContent : key}"`);
        });
    });
    const colorInputEl = document.getElementById('colorInput');
    const gradientLeftEl = document.getElementById('gradientLeft');
    const gradientRightEl = document.getElementById('gradientRight');
    colorInputEl?.addEventListener('input', markSolidColorSelected);
    gradientLeftEl?.addEventListener('input', markGradientSelected);
    gradientRightEl?.addEventListener('input', markGradientSelected);
    const resetColorsBtn = document.getElementById('resetColors');
    resetColorsBtn?.addEventListener('click', () => {
        clearThemeSelection();
        clearCustomOptionSelection();
    });
    const searchEngineItems = wrapper.querySelectorAll('.search-engine-item');
    const customEngineGroup = document.getElementById('customEngineGroup');
    const customEngineInput = document.getElementById('customEngineInput');
    const saveCustomEngineBtn = document.getElementById('saveCustomEngineBtn');
    const searchEnginePreview = document.getElementById('searchEnginePreview');
    function updateSearchEnginePreview(url) {
        if (!searchEnginePreview) return;
        searchEnginePreview.textContent = (url || '').includes('%s')
            ? url.replace('%s', encodeURIComponent('hello world'))
            : url || '';
    }
    function markSearchEngineSelected(key) {
        searchEngineItems.forEach((item) => {
            item.classList.toggle('selected', item.dataset.engine === key);
        });
    }
    function applySearchEngine(key, url, name) {
        localStorage.setItem('searchEngineId', key);
        localStorage.setItem('searchEngineUrl', url);
        markSearchEngineSelected(key);
        updateSearchEnginePreview(url);
        const sjSearchEngine = document.getElementById('sj-search-engine');
        if (sjSearchEngine) sjSearchEngine.value = url;
        showSuccess(`Search Engine Set To "${name}"`);
    }
    searchEngineItems.forEach((item) => {
        item.addEventListener('click', () => {
            const key = item.dataset.engine;
            const engine = SEARCH_ENGINES.find(se => se.key === key);
            if (!engine) return;
            if (key === 'custom') {
                markSearchEngineSelected('custom');
                if (customEngineGroup) customEngineGroup.style.display = '';
                const existingCustom = localStorage.getItem('searchEngineCustomUrl');
                if (existingCustom) {
                    updateSearchEnginePreview(existingCustom);
                } else if (customEngineInput) {
                    customEngineInput.focus();
                }
                return;
            }
            if (customEngineGroup) customEngineGroup.style.display = 'none';
            applySearchEngine(engine.key, engine.url, engine.name);
        });
    });
    if (saveCustomEngineBtn) {
        saveCustomEngineBtn.addEventListener('click', () => {
            const url = customEngineInput.value.trim();
            if (!url || !url.includes('%s')) {
                showError('Please Enter A Valid URL Containing %s');
                return;
            }
            localStorage.setItem('searchEngineCustomUrl', url);
            applySearchEngine('custom', url, 'Custom');
        });
    }
    const backendUrlInput = document.getElementById('backendUrlInput');
    const saveBackendBtn = document.getElementById('saveBackendBtn');
    const resetBackendBtn = document.getElementById('resetBackendBtn');
    if (saveBackendBtn) {
        saveBackendBtn.addEventListener('click', () => {
            const url = backendUrlInput.value.trim();
            if (!url) {
                showError('Please Enter A Valid Backend URL');
                return;
            }
            localStorage.setItem('backendUrl', url);
            BACKEND = url;
            showSuccess(`Backend URL Saved: ${url}`);
        });
    }
    if (resetBackendBtn) {
        resetBackendBtn.addEventListener('click', () => {
            localStorage.removeItem('backendUrl');
            BACKEND = DEFAULT_BACKEND;
            backendUrlInput.value = '';
            showSuccess('Backend URL Reset To Default');
        });
    }
    window.addEventListener('storage', (e) => {
        if (e.key === 'backendUrl') {
            BACKEND = e.newValue || DEFAULT_BACKEND;
        }
    });
    const panicKeyInput = document.getElementById('panicKeyInput');
    const panicUrlInput = document.getElementById('panicUrlInput');
    const savePanicBtn = document.getElementById('savePanicBtn');
    const clearPanicBtn = document.getElementById('clearPanicBtn');
    if (panicKeyInput) {
        panicKeyInput.addEventListener('keydown', (e) => {
            e.preventDefault();
            panicKey = e.key;
            panicKeyInput.value = `Key: ${panicKey}`;
        });
    }
    if (savePanicBtn) {
        savePanicBtn.addEventListener('click', () => {
            const url = panicUrlInput.value.trim();
            if (!panicKey || !url) {
                showError('Please Set Both A Panic Key And URL');
                return;
            }
            if (currentUser) {
                dbSet(`/users/${currentUser.uid}/settings/panicKey`, panicKey);
                dbSet(`/users/${currentUser.uid}/settings/panicUrl`, url);
            }
            localStorage.setItem('panicKey', panicKey);
            localStorage.setItem('panicUrl', url);
            panicUrl = url;
            showSuccess(`Panic Key "${panicKey}" Saved → ${panicUrl}`);
        });
    }
    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', async () => {
            localStorage.clear();
            sessionStorage.clear();
            if (indexedDB.databases) {
                const dbs = await indexedDB.databases();
                dbs.forEach(db => indexedDB.deleteDatabase(db.name));
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                keys.forEach(key => caches.delete(key));
            }
            document.cookie.split(";").forEach(cookie => {
                const name = cookie.split("=")[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            location.reload();
        });
    }
    function reqToPromise(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
    async function toSerializable(value) {
        if (value === null || typeof value !== 'object') return value;
        if (value instanceof ArrayBuffer) {
            return { __icType: 'ArrayBuffer', data: arrayBufferToBase64(value) };
        }
        if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
            return { __icType: 'TypedArray', ctor: value.constructor.name, data: arrayBufferToBase64(value.buffer) };
        }
        if (value instanceof Date) {
            return { __icType: 'Date', data: value.toISOString() };
        }
        if (value instanceof Blob) {
            const buffer = await value.arrayBuffer();
            return { __icType: 'Blob', mime: value.type || '', data: arrayBufferToBase64(buffer) };
        }
        if (Array.isArray(value)) {
            const out = [];
            for (const item of value) out.push(await toSerializable(item));
            return out;
        }
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = await toSerializable(v);
        }
        return out;
    }
    function importJsonReviver(key, value) {
        if (value && typeof value === 'object' && value.__icType) {
            if (value.__icType === 'ArrayBuffer') {
                return base64ToArrayBuffer(value.data);
            }
            if (value.__icType === 'TypedArray') {
                const buffer = base64ToArrayBuffer(value.data);
                const Ctor = window[value.ctor] || Uint8Array;
                return new Ctor(buffer);
            }
            if (value.__icType === 'Date') {
                return new Date(value.data);
            }
            if (value.__icType === 'Blob') {
                const buffer = base64ToArrayBuffer(value.data);
                return new Blob([buffer], { type: value.mime || '' });
            }
        }
        return value;
    }
    async function exportIndexedDBDatabase(name) {
        const db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(name);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const storeNames = Array.from(db.objectStoreNames);
        const result = { version: db.version, stores: {} };
        for (const storeName of storeNames) {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const keyPath = store.keyPath;
            const autoIncrement = store.autoIncrement;
            const keys = await reqToPromise(store.getAllKeys());
            const values = await reqToPromise(store.getAll());
            result.stores[storeName] = {
                keyPath,
                autoIncrement,
                entries: keys.map((k, idx) => ({ key: k, value: values[idx] }))
            };
        }
        db.close();
        return result;
    }
    async function exportAllData(includeFirebase = true) {
        const data = {
            exportedAt: new Date().toISOString(),
            localStorage: {},
            sessionStorage: {},
            indexedDB: {}
        };
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data.localStorage[key] = localStorage.getItem(key);
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            data.sessionStorage[key] = sessionStorage.getItem(key);
        }
        if (indexedDB.databases) {
            const dbs = await indexedDB.databases();
            for (const dbInfo of dbs) {
                if (!dbInfo.name) continue;
                if (!includeFirebase && dbInfo.name.toLowerCase().startsWith('firebase')) continue;
                try {
                    data.indexedDB[dbInfo.name] = await exportIndexedDBDatabase(dbInfo.name);
                } catch (err) {
                    console.warn(`Failed To Export IndexedDB "${dbInfo.name}":`, err);
                }
            }
        }
        const serializableData = await toSerializable(data);
        const json = JSON.stringify(serializableData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ic-data-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
    async function importIndexedDBDatabase(name, dbData) {
        const storeNames = Object.keys(dbData.stores || {});
        let db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(name);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const missingStores = storeNames.filter(s => !db.objectStoreNames.contains(s));
        if (missingStores.length > 0) {
            const newVersion = db.version + 1;
            db.close();
            db = await new Promise((resolve, reject) => {
                const req = indexedDB.open(name, newVersion);
                req.onupgradeneeded = () => {
                    const upgradeDb = req.result;
                    missingStores.forEach(storeName => {
                        const storeInfo = dbData.stores[storeName];
                        upgradeDb.createObjectStore(storeName, storeInfo.keyPath
                            ? { keyPath: storeInfo.keyPath, autoIncrement: !!storeInfo.autoIncrement }
                            : { autoIncrement: !!storeInfo.autoIncrement });
                    });
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }
        for (const storeName of storeNames) {
            if (!db.objectStoreNames.contains(storeName)) continue;
            const storeInfo = dbData.stores[storeName];
            await new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                store.clear();
                (storeInfo.entries || []).forEach(entry => {
                    if (storeInfo.keyPath) {
                        store.put(entry.value);
                    } else {
                        store.put(entry.value, entry.key);
                    }
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }
        db.close();
    }
    async function importAllData(file) {
        const text = await file.text();
        const data = JSON.parse(text, importJsonReviver);
        if (data.localStorage) {
            for (const [k, v] of Object.entries(data.localStorage)) {
                try { localStorage.setItem(k, v); } catch (e) { console.warn('Failed To Set LocalStorage Key', k, e); }
            }
        }
        if (data.sessionStorage) {
            for (const [k, v] of Object.entries(data.sessionStorage)) {
                try { sessionStorage.setItem(k, v); } catch (e) { console.warn('Failed To Set SessionStorage Key', k, e); }
            }
        }
        if (data.indexedDB) {
            for (const [dbName, dbData] of Object.entries(data.indexedDB)) {
                try {
                    await importIndexedDBDatabase(dbName, dbData);
                } catch (err) {
                    console.warn(`Failed To Import IndexedDB "${dbName}":`, err);
                }
            }
        }
    }
    const exportDataBtn = document.getElementById('exportDataBtn');
    const exportDataFullBtn = document.getElementById('exportDataFullBtn');
    const importDataInput = document.getElementById('importDataInput');
    const dataStatus = document.getElementById('dataStatus');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => {
            try {
                if (dataStatus) dataStatus.textContent = 'Exporting...';
                await exportAllData(false);
                if (dataStatus) dataStatus.textContent = '';
                showSuccess('Data Exported Successfully');
            } catch (err) {
                if (dataStatus) dataStatus.textContent = '';
                console.error('Export Failed:', err);
                showError('Failed To Export Data');
            }
        });
    }
    if (exportDataFullBtn) {
        exportDataFullBtn.addEventListener('click', async () => {
            showConfirm('This Export Will Include Your Login Data (Firebase). Do Not Share This File With Anyone. Continue?', async (confirmed) => {
                if (!confirmed) return;
                try {
                    if (dataStatus) dataStatus.textContent = 'Exporting...';
                    await exportAllData(true);
                    if (dataStatus) dataStatus.textContent = '';
                    showSuccess('Data Exported Successfully');
                } catch (err) {
                    if (dataStatus) dataStatus.textContent = '';
                    console.error('Export Failed:', err);
                    showError('Failed To Export Data');
                }
            });
        });
    }
    if (importDataInput) {
        importDataInput.addEventListener('change', () => {
            const file = importDataInput.files && importDataInput.files[0];
            if (!file) return;
            showConfirm('Importing Will Overwrite Your Current Local Data With The Contents Of This File. Continue?', async (confirmed) => {
                if (!confirmed) {
                    importDataInput.value = '';
                    return;
                }
                try {
                    if (dataStatus) dataStatus.textContent = 'Importing...';
                    await importAllData(file);
                    if (dataStatus) dataStatus.textContent = '';
                    showSuccess('Data Imported Successfully. Reloading...');
                    setTimeout(() => location.reload(), 1200);
                } catch (err) {
                    if (dataStatus) dataStatus.textContent = '';
                    console.error('Import Failed:', err);
                    showError('Failed To Import Data. Make Sure The File Is A Valid Export.');
                } finally {
                    importDataInput.value = '';
                }
            });
        });
    }
    if (clearPanicBtn) {
        clearPanicBtn.addEventListener('click', async () => {
            localStorage.removeItem('panicKey');
            localStorage.removeItem('panicUrl');
            panicKey = null;
            panicUrl = '';
            panicKeyInput.value = '';
            panicUrlInput.value = '';
            if (currentUser) {
                await dbSet(`/users/${currentUser.uid}/settings/panicKey`, null);
                await dbSet(`/users/${currentUser.uid}/settings/panicUrl`, null);
            }
            showSuccess('Panic Settings Cleared');
        });
    }
    document.addEventListener('keydown', (e) => {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
        if (panicKey && panicUrl && e.key === panicKey) {
            window.location.href = panicUrl;
        }
    });
    const betterWeatherToggle = document.getElementById('betterWeatherToggle');
    betterWeatherToggle.addEventListener('change', function () {
        const isEnabled = this.checked;
        localStorage.setItem('betterWeather', isEnabled ? 'true' : 'false');
        if (currentUser) {
            dbSet(`/users/${currentUser.uid}/settings/betterWeather`, isEnabled);
        }
        sessionStorage.clear();
        location.reload();
        if (isEnabled && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();      
                    const city = data.address.city || data.address.town || data.address.village || '';
                    const state = data.address.state || '';
                    sessionStorage.setItem('city', city);
                    sessionStorage.setItem('state', state);
                } catch (err) {
                    console.warn('Failed To Get City/State:', err);
                }
            }, (error) => {
                console.warn('Geolocation Error:', error);
            });
        }
    });
    const clockBarToggle = document.getElementById('clockBarToggle');
    const clockBar = document.getElementById('clockBar');
    if (clockBarToggle) {
        clockBarToggle.addEventListener('change', function () {
            const isEnabled = this.checked;
            localStorage.setItem('showClockBar', isEnabled ? 'true' : 'false');
            if (clockBar) {
                clockBar.style.display = isEnabled ? '' : 'none';
            }
        });
    }
    const button = document.getElementById('trigger');
    const popup = document.getElementById('popup');
    const popupBackdrop = document.getElementById('popupBackdrop');
    const popupClose = document.getElementById('popupClose');
    function openPopup() {
        popup.classList.add('shows');
        if (popupBackdrop) popupBackdrop.classList.add('shows');
        button.classList.add('actives');
    }
    function closePopup() {
        popup.classList.remove('shows');
        if (popupBackdrop) popupBackdrop.classList.remove('shows');
        button.classList.remove('actives');
    }
    if (button && popup) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popup.classList.contains('shows');
            isOpen ? closePopup() : openPopup();
        });
        if (popupClose) {
            popupClose.addEventListener('click', (e) => {
                e.stopPropagation();
                closePopup();
            });
        }
        if (popupBackdrop) {
            popupBackdrop.addEventListener('click', () => {
                closePopup();
            });
        }
        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target) && !button.contains(e.target)) {
                closePopup();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePopup();
            }
        });
    }
    const titleInput = document.getElementById('titleInput');
    const saveTitleBtn = document.getElementById('saveTitleBtn');
    const resetTitleBtn = document.getElementById('resetTitleBtn');
    function setTitle(newTitle) {
        document.title = newTitle || `${c}`;
    }
    if (savedTitle) {
        setTitle(savedTitle);
    }
    saveTitleBtn.addEventListener('click', () => {
        const newTitle = titleInput.value.trim();
        if (newTitle.length > 0) {
            localStorage.setItem('pageTitle', newTitle);
            setTitle(newTitle);
        } else {
            showError('Please Enter A Valid Title Before Saving.');
        }
        if (currentUser) {
            dbSet(`/users/${currentUser.uid}/settings/pageTitle`, newTitle);
        }
    });
    resetTitleBtn.addEventListener('click', async () => {
        localStorage.removeItem('pageTitle');
        titleInput.value = '';
        setTitle(c);
        if (currentUser) {
            await dbSet(`/users/${currentUser.uid}/settings/pageTitle`, null);
        }
    });
    const faviconInput = document.getElementById('faviconInput');
    const setFaviconBtn = document.getElementById('setFaviconBtn');
    const resetFaviconBtn = document.getElementById('resetFaviconBtn');
    const originalFaviconLink = document.querySelector("link[rel~='icon']");
    const originalFaviconUrl = originalFaviconLink ? originalFaviconLink.href : '/res/icon.png';
    function updateFavicon(url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = url;
    }
    if (savedFavicon) updateFavicon(savedFavicon);
    const faviconPreview = document.getElementById('faviconPreview');
    let faviconPendingDataUrl = null;
    faviconInput.addEventListener('change', () => {
        const file = faviconInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            faviconPendingDataUrl = e.target.result;
            if (faviconPreview) {
                faviconPreview.src = faviconPendingDataUrl;
                faviconPreview.classList.add('show');
            }
        };
        reader.readAsDataURL(file);
    });
    const fLabel = document.getElementById('fLabel');
    setFaviconBtn.addEventListener('click', () => {
        if (!faviconPendingDataUrl) return showError('Select An Image First');
        localStorage.setItem('customFavicon', faviconPendingDataUrl);
        updateFavicon(faviconPendingDataUrl);
        // if (currentUser) {
        //     dbSet(`/users/${currentUser.uid}/settings/customFavicon`, faviconPendingDataUrl);
        // }
        showSuccess('Favicon Saved');
        fLabel.style.display='none';
    });
    resetFaviconBtn.addEventListener('click', () => {
        localStorage.removeItem('customFavicon');
        updateFavicon('/res/icon.png');
        faviconPendingDataUrl = null;
        faviconInput.value = '';
        if (faviconPreview) {
            faviconPreview.src = '';
            faviconPreview.classList.remove('show');
        }
        // if (currentUser) {
        //     dbSet(`/users/${currentUser.uid}/settings/customFavicon`, null);
        // }
        fLabel.style.display='block';
    });
    const bgLabel = document.getElementById('bgLabel');
    const bgInput = document.getElementById('bgInput');
    const setBgBtn = document.getElementById('setBgBtn');
    const resetBgBtn = document.getElementById('resetBgBtn');
    const bgPreview = document.getElementById('bgPreview');
    let bgPendingDataUrl = null;
    function updateBackground(url) {
        document.body.style.backgroundImage = url ? `url('${url}')` : '';
        if (url) {
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundSize = "cover";
        } else {
            document.body.style.backgroundRepeat = "repeat";
            document.body.style.backgroundSize = "unset";
        }
        bgLabel.style.display = url ? 'none' : 'block';
        applyBrightnessTheme(url || DEFAULT_BG);
    }
    function applyBrightnessTheme(imgSrc) {
        if (!imgSrc) {
            document.body.classList.remove('light-bg');
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            try {
                const size = 32;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);
                const data = ctx.getImageData(0, 0, size, size).data;
                let total = 0;
                let count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    total += (0.299 * r + 0.587 * g + 0.114 * b);
                    count++;
                }
                const avgBrightness = total / count;
                document.body.classList.toggle('light-bg', avgBrightness > 175);
            } catch (e) {
                console.warn('Could Not Analyze Background Brightness:', e);
            }
        };
        img.onerror = function () {
            console.warn('Could Not Load Background Image For Brightness Check');
        };
        img.src = imgSrc;
    }
    if (savedBackground) updateBackground(savedBackground);
    applyBrightnessTheme(savedBackground || DEFAULT_BG);
    if (bgInput) {
        bgInput.addEventListener('change', () => {
            const file = bgInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                bgPendingDataUrl = e.target.result;
                if (bgPreview) {
                    bgPreview.style.backgroundImage = `url('${bgPendingDataUrl}')`;
                    bgPreview.style.height = '30%';
                    bgPreview.classList.add('show');
                }
            };
            reader.readAsDataURL(file);
        });
    }
    if (setBgBtn) {
        setBgBtn.addEventListener('click', () => {
            if (!bgPendingDataUrl) return showError('Select An Image First');
            localStorage.setItem('customBackground', bgPendingDataUrl);
            updateBackground(bgPendingDataUrl);
            showSuccess('Background Image Saved');
            bgLabel.style.display='none';
            bgPreview.style.height = '70%';
        });
    }
    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            localStorage.removeItem('customBackground');
            bgPendingDataUrl = null;
            if (bgInput) bgInput.value = '';
            if (bgPreview) {
                bgPreview.style.backgroundImage = '';
                bgPreview.classList.remove('show');
            }
            updateBackground('');
            bgLabel.style.display='block';
        });
    }
    function updateTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const clock = document.getElementById('clock');
        const clocks = document.getElementById('clocks');
        if (clock) {
            clock.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;
        }
        if (clocks) {
            clocks.textContent = `${displayHours}:${minutes} ${ampm}`;
        }
    }
    updateTime();
    setInterval(updateTime, 1000);
    applySettingsToUI();
});
window.addEventListener("settingsLoaded", () => {
    applySettingsToUI();
});