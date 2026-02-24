function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (err) {
        console.warn(`LocalStorage Unavailable For Key: ${key}`, err);
        (function () {
            window.addEventListener("load", () => {
                document.documentElement.innerHTML = `
                    <!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.css">
                            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
                            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css">
                            <script async src="https://www.googletagmanager.com/gtag/js?id=G-7SV03ZXJ9R">
                            </script>
                            <script>
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', 'G-7SV03ZXJ9R');
                            </script>
                            <title>
                                Infinite Campus
                            </title>
                            <link id="dynamic-favicon" rel="icon" type="image/png" href="/res/icon.png">
                            <link rel="stylesheet" href="global.css">
                            <meta name="keywords" content="Infinite campus,infinite campus,Infinite Campus,infinite Campus">
                            <meta name="description" content="Infinite Campus Is A International Buisiness And Has Good Devs">
                            <meta property="og:title" content="Infinite Campus">
                            <meta property="og:description" content="Infinite Campus Is An International Buisiness And Has Good Devs">
                            <meta property="og:url" content="https://www.infinitecampus.xyz">
                            <meta name="theme-color" content="#8cbe37">
                            <meta content="/res/icon.png" property="og:image">
                            <script src="main.js">
                            </script>
                        </head>
                        <body>
                            <center>
                                <br>
                                <h1 class="tptxt">
                                    You Are Likely Using This Page On A Data Url
                                </h1>
                                <hr>
                                <br>
                                <h3 class="mdtxt">
                                    Why This Happened
                                </h3>
                                <hr style="width:50%">
                                <br>
                                <h4 class="btxt">
                                    LocalStorage Does Not Work On Data URLs So I Made It So It Is Like Nettleweb And It Opens In About Blank
                                </h4>
                                <br>
                                <h5 class="y">
                                    What Is Localstorage?
                                </h5>
                                <p class="btxt">
                                    LocalStorage Is What Allows This Site To Have Themes, Custom Titles, Custom Icons, Panic URLs, And You Need It For The Website Chat
                                </p>
                                <br>
                                <button class="button" onclick="runEmbeddedDataMode()">
                                    Click Here To Continue
                                </button>
                            </center>
                        </body>
                    </html>
                `;
            });
        })();
        window.runEmbeddedDataMode = function () {
            const win = window.open("about:blank", "_blank");
            if (!win) return;
            win.document.open();
            win.document.write(`
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>
                            Infinite Campus
                        </title>
                    </head>
                    <body style="margin:0; overflow:hidden;">
                    </body>
                </html>
            `);
            win.document.close();
            const iframe = win.document.createElement("iframe");
            iframe.src = window.location.origin;
            iframe.style.width = "100vw";
            iframe.style.height = "100vh";
            iframe.style.border = "none";
            win.document.body.appendChild(iframe);
        };
        return null;
    }
}
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        console.warn(`LocalStorage Unavailable For Key: ${key}`, err);
    }
}
const a = "https://api.infinitecampus.xyz";
const b = "https://www.infinitecampus.xyz";
const c = "Infinite Campus";
const d = "https://included-touched-joey.ngrok-free.app";
const e = ["infinitecampus.xyz", "www.infinitecampus.xyz", "instructure.space"];
const f = window.location.host;
const j = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3R5bGU9IndpZHRoOjEwMHZ3ICFpbXBvcnRhbnQ7IGhlaWdodDoxMDB2aCAhaW1wb3J0YW50OyI+PHRpdGxlPkluZmluaXRlIENhbXB1czwvdGl0bGU+PGZvcmVpZ25PYmplY3QgeD0iMCIgeT0iMCIgc3R5bGU9IndpZHRoOjEwMHZ3ICFpbXBvcnRhbnQ7IGhlaWdodDoxMDB2aCAhaW1wb3J0YW50OyI+PGVtYmVkIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzcmM9IiR7dXJsfSIgdHlwZT0idGV4dC9wbGFpbiIgc3R5bGU9ImhlaWdodDoxMDB2aCAhaW1wb3J0YW50OyB3aWR0aDoxMDB2dyAhaW1wb3J0YW50OyIgLz48L2ZvcmVpZ25PYmplY3Q+PC9zdmc+Cg==`;
const k = `PGh0bWwgbGFuZz0iZW4iPgo8aGVhZD4KPG1ldGEgY2hhcnNldD0iVVRGLTgiPgo8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+Cjx0aXRsZT5JbmZpbml0ZSBDYW1wdXM8L3RpdGxlPgo8c3R5bGU+CmJvZHk6Oi13ZWJraXQtc2Nyb2xsYmFyIHsgZGlzcGxheTogbm9uZTsgfQpib2R5IHsgbWFyZ2luOjBweDsgfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+SW5maW5pdGUgQ2FtcHVzPC90aXRsZT4KICA8c3R5bGU+CiAgICBib2R5Ojotd2Via2l0LXNjcm9sbGJhciB7CiAgICAgIGRpc3BsYXk6IG5vbmU7CiAgICAgIG1hcmdpbjowcHg7CiAgICB9CiAgICBzdmcsIGZvcmVpZ25vYmplY3QsIGVtYmVkIHsKICAgICAgaGVpZ2h0OjEwMHZoOwogICAgICB3aWR0aDoxMDB2dzsKICAgIH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgogIDxzdmcgc3R5bGU9ImhlaWdodDoxMDB2aDsgd2lkdGg6MTAwdnc7Ij4KICAgIDxmb3JlaWdub2JqZWN0PgogICAgICA8ZW1iZWQgc3JjPSJQVVRfVVJMX0hFUkUiPgogICAgPC9mb3JlaWdub2JqZWN0PgogIDwvc3ZnPgo8L2JvZHk+CjwvaHRtbD4=`;
const m = "https://discord.com/api/guilds/1002698920809463808/widget.json";
const o = ["Dad", "Default Bot", "Infinite Campus", "Log Bot", "Music Bot"];
const key = 5;
console.log('%cWelcome To The Console, If You Do Not Know What You Are Doing, Close It, If You Do I Would Be Happy To Let You Develop The Website With Me At support@infinitecampus.xyz', 'color: purple; font-size: 24px; font-weight: bold;');
console.log('%cC', `
    font-size: 100px;
    padding: 1px 35px 1px 35px;
    background-size: cover;
    border-radius:10px;
    font-family: 'Montserrat', sans-serif;
    font-weight:bold;
    color: #8BC53F;
    background-color: #121212;
`);
let isFahrenheit = true;
localStorage.setItem("replit-pill-preference", "hidden");
function showError(err) {
    const existing = document.getElementById("errDiv");
    if (existing) existing.remove();
    const errDiv = document.createElement("div");
    errDiv.id = "errDiv";
    errDiv.textContent = err;
    errDiv.style.marginTop = "60px";
    errDiv.style.background = "salmon";
    errDiv.style.color = "red";
    errDiv.style.border = "3px solid red";
    errDiv.style.borderRadius = "5px";
    errDiv.style.padding = "3px";
    errDiv.style.cursor = "pointer";
    errDiv.style.position = "fixed";
    errDiv.style.textAlign = "center";
    errDiv.style.fontWeight = "bold";
    errDiv.style.maxWidth = "fit-content";
    errDiv.style.height = "35px";
    errDiv.style.top = "70";
    errDiv.style.justifySelf = "center";
    errDiv.addEventListener("click", () => {
        errDiv.remove();
    });
    document.body.insertBefore(errDiv, document.body.firstChild);
}
function showSuccess(success) {
    const existing = document.getElementById("successDiv");
    if (existing) existing.remove();
    const successDiv = document.createElement("div");
    successDiv.id = "successDiv";
    successDiv.textContent = success;
    successDiv.style.marginTop = "60px";
    successDiv.style.background = "paleGreen";
    successDiv.style.color = "green";
    successDiv.style.border = "3px solid green";
    successDiv.style.borderRadius = "5px";
    successDiv.style.padding = "3px";
    successDiv.style.cursor = "pointer";
    successDiv.style.position = "fixed";
    successDiv.style.textAlign = "center";
    successDiv.style.fontWeight = "bold";
    successDiv.style.maxWidth = "fit-content";
    successDiv.style.height = "35px";
    successDiv.style.top = "70";
    successDiv.style.justifySelf = "center";
    successDiv.addEventListener("click", () => {
        successDiv.remove();
    });
    document.body.insertBefore(successDiv, document.body.firstChild);
}
function showConfirm(message, callback) {
    const existing = document.getElementById("confirmDiv");
    if (existing) existing.remove();
    const confirmDiv = document.createElement("div");
    confirmDiv.id = "confirmDiv";
    confirmDiv.textContent = message;
    confirmDiv.style.background = "darkorange";
    confirmDiv.style.color = "red";
    confirmDiv.style.border = "3px solid red";
    confirmDiv.style.borderRadius = "5px";
    confirmDiv.style.padding = "10px";
    confirmDiv.style.position = "fixed";
    confirmDiv.style.top = "-150px";
    confirmDiv.style.left = "50%";
    confirmDiv.style.transform = "translateX(-50%)";
    confirmDiv.style.textAlign = "center";
    confirmDiv.style.fontWeight = "bold";
    confirmDiv.style.zIndex = "9999";
    confirmDiv.style.transition = "top 0.4s ease";
    confirmDiv.style.display = "flex";
    confirmDiv.style.flexDirection = "column";
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "8px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";
    const yesBtn = document.createElement("button");
    yesBtn.textContent = "Ok";
    yesBtn.id = "confirmBtns";
    yesBtn.style.marginRight = "5px";
    yesBtn.style.cursor = "pointer";
    const noBtn = document.createElement("button");
    noBtn.textContent = "Cancel";
    noBtn.id = "confirmBtns";
    noBtn.style.cursor = "pointer";
    yesBtn.addEventListener("click", () => {
        confirmDiv.remove();
        callback(true);
    });
    noBtn.addEventListener("click", () => {
        confirmDiv.remove();
        callback(false);
    });
    buttonContainer.appendChild(noBtn);
    buttonContainer.appendChild(yesBtn);
    confirmDiv.appendChild(buttonContainer);
    document.body.insertBefore(confirmDiv, document.body.firstChild);
    setTimeout(() => {
        confirmDiv.style.top = "50%";
    }, 10);
}
function customPrompt(message, hidden = false, value) {
    return new Promise((resolve) => {
        const existing = document.getElementById("customPromptOverlay");
        if (existing) existing.remove();
        const overlay = document.createElement("div");
        overlay.id = "customPromptOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";
        const box = document.createElement("div");
        box.style.background = "#333";
        box.style.color = "white";
        box.style.padding = "20px";
        box.style.borderRadius = "10px";
        box.style.width = "300px";
        box.style.textAlign = "center";
        box.style.border = "1px solid white";
        box.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
        const text = document.createElement("div");
        text.textContent = message;
        text.style.marginBottom = "10px";
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        const input = document.createElement("input");
        input.type = hidden ? "password" : "text";
        input.style.borderRadius = "10px";
        input.style.background = "#666";
        input.style.color = "white";
        input.style.border = "1px solid white";
        input.value = value ? `${value}` : "";
        input.style.width = "90%";
        input.style.padding = "5px";
        input.style.marginBottom = "10px";
        const okBtn = document.createElement("button");
        okBtn.textContent = "Ok";
        okBtn.id = "cuPromptBtns";
        okBtn.style.marginRight = "10px";
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.id = "cuPromptBtns";
        okBtn.onclick = () => {
            resolve(input.value);
            overlay.remove();
        };
        cancelBtn.onclick = () => {
            resolve(null);
            overlay.remove();
            showSuccess("Canceled");
        };
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                okBtn.click();
            }
        });
        box.appendChild(text);
        box.appendChild(input);
        div.appendChild(cancelBtn);
        div.appendChild(okBtn);
        box.appendChild(div);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        input.focus();
    });
}
window.addEventListener('DOMContentLoaded', () => {
    if (e.includes(window.location.host)) {
    } else {
        let showWarn = localStorage.getItem("warn");
        if ( showWarn !== '1') {
            showError("You Are On A Non Official Link. Go To The About Tab To Learn More");
            localStorage.setItem("warn", "1");
        }
    }
    let currentCity = "";
    function setPopup2Color(isDark) {
        document.querySelectorAll('.popup2').forEach(el => {
            el.style.color = isDark ? 'white' : 'black';
        });
    }
    function applyDarkModeClass() {
        const isDark = safeGetItem("globalDarkTheme") === "true";
        const toggle = document.getElementById("toggle");
        const weather = document.getElementById("weather");
        const poppups = document.getElementById("ppupcolor");
        if (isDark) {
            document.body.classList.add("w");
            if (toggle) toggle.classList.add("w");
            if (weather) weather.classList.add("w");
            if (poppups) poppups.classList.add("w");
        } else {
            document.body.classList.remove("w");
            if (toggle) toggle.classList.remove("w");
            if (weather) weather.classList.remove("w");
            if (poppups) poppups.classList.remove("w");
        }
        setPopup2Color(isDark);
    }
    const observer = new MutationObserver(() => {
        const isDark = safeGetItem("globalDarkTheme") === "true";
        setPopup2Color(isDark);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    async function getLocation() {
        try {
            let city = sessionStorage.getItem('city');
            let state = sessionStorage.getItem('state');
            if (city && state) {
                currentCity = city;
                return;
            }
            if (safeGetItem("betterWeather") === "true" && navigator.geolocation) {
                await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        const lat = pos.coords.latitude;
                        const lon = pos.coords.longitude;
                        try {
                            const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                            const revData = await revRes.json();
                            currentCity = revData.address.city || revData.address.town || revData.address.village || "";
                            state = revData.address.state || "";
                            sessionStorage.setItem('city', currentCity);
                            sessionStorage.setItem('state', state);
                            resolve();
                        } catch (err) {
                            console.warn("Reverse Geocode Failed, Fallback To IP:", err);
                            await fallbackToIP(resolve);
                        }
                    }, async (err) => {
                        console.warn("Geolocation Failed, Fallback To IP:", err);
                        await fallbackToIP(resolve);
                    });
                });
            } else {
                await fallbackToIP();
            }
        } catch (error) {
            console.error("Failed To Get Location:", error);
            currentCity = "";
        }
    }
    async function fallbackToIP(resolve) {
        try {
            const locRes = await fetch("https://ipapi.co/json/");
            if (!locRes.ok) throw new Error("IP Location Unavailable");
            const loc = await locRes.json();
            currentCity = loc.city || "";
            const state = loc.region || "";
            sessionStorage.setItem('city', currentCity);
            sessionStorage.setItem('state', state);
        } catch (err) {
            console.error("IP Fallback Failed:", err);
            currentCity = "";
        }
        if (resolve) resolve();
    }
    async function getWeather(city, state, useFahrenheit) {
        if (!city || !state) return;
        try {
            const res = await fetch(
                `${a}/weather?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`
            );
            if (!res.ok) throw new Error("Weather Request Failed");
            const data = await res.json();
            if (!data.temperature) {
                console.error("Temperature Unavailable");
                return;
            }
            const temp = useFahrenheit ? `${data.temperature.fahrenheit}°F` : `${data.temperature.celsius}°C`;
            const display = `${data.location}: ${data.emoji} ${temp}`;
            const weatherEl = document.getElementById("weather");
            const toggleEl = document.getElementById("toggle");
            weatherEl.textContent = display;
            weatherEl.classList.add("show");
            toggleEl.classList.add("show");
            applyDarkModeClass();
        } catch (err) {
            console.error("Weather Error:", err);
            weatherEl.textContent("Unable To Get Weather");
        }
    }
    function removePlusSignsFromPage() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            node.nodeValue = node.nodeValue.replace(/\+/g, "");
        }
    }
    document.getElementById("toggle")?.addEventListener("click", () => {
        if (isFahrenheit === true) {
            isFahrenheit = false;
        } else {
            isFahrenheit = true;
        }
        document.getElementById("toggle").innerText = isFahrenheit ? "°C" : "°F";
        const city = sessionStorage.getItem("city");
        const state = sessionStorage.getItem("state");
        getWeather(city, state, isFahrenheit);
    });
    async function initWeather() {
        await getLocation();
        const city = sessionStorage.getItem("city");
        const state = sessionStorage.getItem("state");
        getWeather(city, state, isFahrenheit);
        removePlusSignsFromPage();
        applyDarkModeClass();
    }
    const savedTitle = safeGetItem('pageTitle');
    if (savedTitle) document.title = savedTitle;
    const savedFavicon = safeGetItem('customFavicon');
    if (savedFavicon) {
        const favicon = document.getElementById('dynamic-favicon');
        if (favicon) favicon.href = savedFavicon;
    }
    initWeather();
    function invertColor(rgb) {
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return '#000';
        const r = 255 - parseInt(match[0]);
        const g = 255 - parseInt(match[1]);
        const b = 255 - parseInt(match[2]);
        return `rgb(${r}, ${g}, ${b})`;
    }
    function applyInvertedColors() {
        const darkElement = document.querySelector('.darkbuttons');
        const lightElements = document.querySelectorAll('.lightbuttons');
        if (!darkElement || lightElements.length === 0) return;
        const darkBg = getComputedStyle(darkElement).color;
        const invertedColor = invertColor(darkBg);
        lightElements.forEach(el => {
            el.style.color = invertedColor;
        });
    }
    applyInvertedColors();
    const panicKey = safeGetItem("panicKey");
    const panicUrl = safeGetItem("panicUrl");
    if (panicKey && panicUrl) {
        document.addEventListener("keydown", (e) => {
            if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
            if (e.key === panicKey) {
                window.location.href = panicUrl;
            }
        });
    }
});