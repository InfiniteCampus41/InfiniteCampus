import { auth, onAuthStateChanged } from "./imports.js";
let authReady = false;
let isLoggedInMsg = "Login";
let isLoggedInLink = "/InfiniteLogins.html";
const DEFAULT_BACKEND = a;
let BACKEND = localStorage.getItem('backendUrl') || DEFAULT_BACKEND;
let currentUser = null;
const authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        isLoggedInMsg = "My Account";
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
onAuthStateChanged(auth, async (user) => {
    if (!user) return;   
    try {
        const [pankey, panurl, title, weather] = await Promise.all([
            dbGet(`users/${user.uid}/settings/panicKey`),
            dbGet(`users/${user.uid}/settings/panicUrl`),
            dbGet(`users/${user.uid}/settings/pageTitle`),
            dbGet(`users/${user.uid}/settings/betterWeather`)
        ]);
        if (pankey) localStorage.setItem('panicKey', pankey);
        if (panurl) localStorage.setItem('panicUrl', panurl);
        if (title) localStorage.setItem('pageTitle', title);
        if (weather !== undefined) {
            localStorage.setItem('betterWeather', weather ? 'true' : 'false');
        }
        window.dispatchEvent(new Event("settingsLoaded"));
        applySettingsToUI();
    } catch (error) {
        console.warn("DB load failed:", error);
    }
});
function applySettingsToUI() {
    const panicKeyInput = document.getElementById('panicKeyInput');
    const panicUrlInput = document.getElementById('panicUrlInput');
    const titleInput = document.getElementById('titleInput');
    const betterWeatherToggle = document.getElementById('betterWeatherToggle');
    const clockBarToggle = document.getElementById('clockBarToggle');
    const clockBar = document.getElementById('clockBar');
    const faviconPreview = document.getElementById('faviconPreview');
    const bgPreview = document.getElementById('bgPreview');
    const savedTitle = localStorage.getItem('pageTitle') || '';
    const savedFavicon = localStorage.getItem('customFavicon') || '';
    const savedBackground = localStorage.getItem('customBackground') || '';
    const betterWeatherState = localStorage.getItem('betterWeather') === 'true';
    const showClockBarState = localStorage.getItem('showClockBar') === null
        ? true
        : localStorage.getItem('showClockBar') === 'true';
    const panicKey = localStorage.getItem('panicKey') || '';
    const panicUrl = localStorage.getItem('panicUrl') || '';
    const popuplogin = document.getElementById('popuplogin');
    if (currentUser) {
        popuplogin.innerText = isLoggedInMsg;
        popuplogin.href = isLoggedInLink;
    }
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
    const popupHTML = `
        <div class="popup2" id="popup">
            <div class="bar themed" id="clockBar" style="${showClockBarState ? '' : 'display:none;'}">
                <div id="clocks">
                    --:--:-- --
                </div>
            </div>
            <div class="text">
                <h3 class="btxt">
                    Settings
                </h3>
                <hr>
                <a class="button" id="popuplogin" href="${isLoggedInLink}">
                    ${isLoggedInMsg}
                </a>
                <div class="setting-row">
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
                <button class="button" id="toggleSnowBtn">
                    Toggle Snow
                </button>
                <hr>
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
                <hr>
                <div class="section" style="justify-content:center">
                    <a class="themed button darkbuttons" href="InfiniteApps.html?theme=true">
                        Change Site Theme
                    </a>
                    <a class="button" href="InfiniteDonaters.html">
                        Help Support By Donating
                    </a>
                    <a class="button" href="InfiniteApps.html?blank=true">
                        Open In About:Blank
                    </a>
                    <a class="button" href="InfiniteChatters.html?channel=Suggestions">
                        Suggest A Feature
                    </a>
                </div>
                <a class="button" id="resetAllBtn">
                    Clear Data
                </a>
                <br>
                <a class="discord" style="display:contents;" href="${i}" target="_blank">
                    Join The Discord
                </a>
            </div>
            <div class="bar themed">
                <a id="CTCbtn" class="darkbuttons" href="InfiniteContacts.html">
                    Contact Me
                </a>
            </div>
        </div>
        <div class="settings-button themed" id="trigger">
            <img class="settings" src="/res/settings.svg">
        </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = popupHTML;
    document.body.appendChild(wrapper);
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
    if (button && popup) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popup.classList.contains('shows');
            popup.classList.toggle('shows');
            button.classList.toggle('actives', !isOpen);
        });
        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target) && !button.contains(e.target)) {
                popup.classList.remove('shows');
                button.classList.remove('actives');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                popup.classList.remove('shows');
                button.classList.remove('actives');
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