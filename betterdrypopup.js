window.addEventListener('DOMContentLoaded', () => {
    let savedTitle = '';
    let savedFavicon = '';
    let betterWeatherState = false;
    let panicKey = localStorage.getItem('panicKey') || null;
    let panicUrl = localStorage.getItem('panicUrl') || '';
    try {
        savedTitle = localStorage.getItem('pageTitle') || '';
        savedFavicon = localStorage.getItem('customFavicon') || '';
        betterWeatherState = localStorage.getItem('betterWeather') === 'true';
    } catch (e) {
        console.warn('LocalStorage Not Available, Using Defaults:', e);
    }
    const popupHTML = `
        <div class="popup2" id="popup">
            <div class="bar test rgb-element">
                <div id="clocks">
                    --:--:-- --
                </div>
            </div>
            <div class="text">
                <p class="txt">Settings</p>
                <div class="section weather-section">
                    <p>Enable More Accurate Weather?</p>
                    <label class="switch">
                        <input type="checkbox" id="betterWeatherToggle" ${betterWeatherState ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <hr>
                <div class="section">
                    <input type="text" id="titleInput" placeholder="Enter Page Title" value="${savedTitle}">
                    <button id="saveTitleBtn">Save</button>
                    <button id="resetTitleBtn">Reset</button>
                    <br>
                    <label id="fLabel" for="faviconInput">Choose Favicon Image</label>
                    <input type="file" id="faviconInput" accept="image/*" hidden>
                    <button class="button" id="setFaviconBtn">Save</button>
                    <button class="button" id="resetFaviconBtn">Reset</button>
                </div>
                <hr>
                <div class="section">
                    <input id="panicKeyInput" placeholder="Panic Key" readonly>
                    <input id="panicUrlInput" placeholder="Set Panic URL">
                    <button id="savePanicBtn">Save</button>
                    <button id="clearPanicBtn">Reset</button>
                </div>
                <hr>
                <div class="section">
                    <br>
                    <a class="test" href="InfiniteColors.html">Change Site Theme</a>
                    <a class="disabled" disabled>Take A Quick Survey</a>
                    <br><br>
                    <a href="InfiniteBypassers.html">Open In About:Blank</a>
                    <a href="InfiniteFeatures.html">Suggest A Feature</a>
                    <br><br>
                    <a href="InfiniteDonaters.html">Help Support By Donating</a>
                    <a id="resetAllBtn">Clear Data</a>
                </div>
                <a class="discord" href="https://discord.gg/4d9hJSVXca">Join The Discord</a>
            </div>
            <div class="bar test rgb-element">
                <a id="CTCbtn" href="InfiniteContacts.html">
                    Contact Me
                </a>
            </div>
        </div>
        <div class="settings-button test rgb-element" id="trigger">
            <img class="settings" src="/res/settings.svg">
        <center>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = popupHTML;
    document.body.appendChild(wrapper);
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
        clearPanicBtn.addEventListener('click', () => {
            localStorage.removeItem('panicKey');
            localStorage.removeItem('panicUrl');
            panicKey = null;
            panicUrl = '';
            panicKeyInput.value = '';
            panicUrlInput.value = '';
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
    });
    resetTitleBtn.addEventListener('click', () => {
        localStorage.removeItem('pageTitle');
        titleInput.value = '';
        setTitle(`${c}`);
    });
    const faviconInput = document.getElementById('faviconInput');
    const setFaviconBtn = document.getElementById('setFaviconBtn');
    const resetFaviconBtn = document.getElementById('resetFaviconBtn');
    const originalFaviconLink = document.querySelector("link[rel~='icon']");
    const originalFaviconUrl = originalFaviconLink ? originalFaviconLink.href : '/favicon.ico';
    function updateFavicon(url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = url;
    }
    if (savedFavicon) {
        updateFavicon(savedFavicon);
    }
    setFaviconBtn.addEventListener('click', () => {
        const file = faviconInput.files[0];
        if (!file) {
            showError('Please Select An Image File First.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            localStorage.setItem('customFavicon', dataUrl);
            updateFavicon(dataUrl);
        };
        reader.readAsDataURL(file);
    });
    resetFaviconBtn.addEventListener('click', () => {
        localStorage.removeItem('customFavicon');
        faviconInput.value = '';
        updateFavicon(originalFaviconUrl);
    });
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
});