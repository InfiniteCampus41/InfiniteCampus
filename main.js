(function () {
    let isDataContext = window.location.href.startsWith("data:");
    if (!isDataContext) return;
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
                    <hr >
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
function runEmbeddedDataMode() {
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
            <link id="dynamic-favicon" rel="icon" type="image/png" href="https://www.infinitecampus.xyz/res/icon.png">
        </head>
        <body style="margin:0; overflow:hidden;">
        </body>
        </html>
    `);
    win.document.close();
    const iframe = win.document.createElement("iframe");
    iframe.src = "https://www.infinitecampus.xyz";
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";
    iframe.style.border = "none";
    win.document.body.appendChild(iframe);
}
function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (err) {
        console.warn(`LocalStorage Unavailable For Key: ${key}`, err);
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
const j = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3R5bGU9IndpZHRoOjEwMHZ3ICFpbXBvcnRhbnQ7IGhlaWdodDoxMDB2aCAhaW1wb3J0YW50OyI+PHRpdGxlPkluZmluaXRlIENhbXB1czwvdGl0bGU+PGZvcmVpZ25PYmplY3QgeD0iMCIgeT0iMCIgc3R5bGU9IndpZHRoOjEwMHZ3ICFpbXBvcnRhbnQ7IGhlaWdodDoxMDB2aCAhaW1wb3J0YW50OyI+PGVtYmVkIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzcmM9IiR7dXJsfSIgdHlwZT0idGV4dC9wbGFpbiIgc3R5bGU9ImhlaWdodDoxMDB2aCAhaW1wb3J0YW50OyB3aWR0aDoxMDB2dyAhaW1wb3J0YW50OyIgLz48L2ZvcmVpZ25PYmplY3Q+PC9zdmc+Cg==`;
const k = `PGh0bWwgbGFuZz0iZW4iPgo8aGVhZD4KPG1ldGEgY2hhcnNldD0iVVRGLTgiPgo8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+Cjx0aXRsZT5JbmZpbml0ZSBDYW1wdXM8L3RpdGxlPgo8c3R5bGU+CmJvZHk6Oi13ZWJraXQtc2Nyb2xsYmFyIHsgZGlzcGxheTogbm9uZTsgfQpib2R5IHsgbWFyZ2luOjBweDsgfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+SW5maW5pdGUgQ2FtcHVzPC90aXRsZT4KICA8c3R5bGU+CiAgICBib2R5Ojotd2Via2l0LXNjcm9sbGJhciB7CiAgICAgIGRpc3BsYXk6IG5vbmU7CiAgICAgIG1hcmdpbjowcHg7CiAgICB9CiAgICBzdmcsIGZvcmVpZ25vYmplY3QsIGVtYmVkIHsKICAgICAgaGVpZ2h0OjEwMHZoOwogICAgICB3aWR0aDoxMDB2dzsKICAgIH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgogIDxzdmcgc3R5bGU9ImhlaWdodDoxMDB2aDsgd2lkdGg6MTAwdnc7Ij4KICAgIDxmb3JlaWdub2JqZWN0PgogICAgICA8ZW1iZWQgc3JjPSJQVVRfVVJMX0hFUkUiPgogICAgPC9mb3JlaWdub2JqZWN0PgogIDwvc3ZnPgo8L2JvZHk+CjwvaHRtbD4=`;
const m = "https://discord.com/api/guilds/1002698920809463808/widget.json";
const o = ["Dad", "Default Bot", "Infinite Campus", "Log Bot", "Music Bot"];
const key = 5;
console.log('%cWelcome To The Console, If You Do Not Know What You Are Doing, Close It, If You Do I Would Be Happy To Let You Develop The Website With Me At support@infinitecampus.xyz@gmail.com', 'color: purple; font-size: 24px; font-weight: bold;');
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
function padlet() { window.open("https://padlet.com/newsomr95/chat-room-br2tjbusbebezr2n"); }
function converter() { window.open("https://spotidownloader.com/en"); }
function puter() { window.open("https://puter.com"); }
function thumbnail() { window.open("https://tagmp3.net/"); }
window.addEventListener('DOMContentLoaded', () => {
    let isFahrenheit = true;
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
    async function getWeather(city, useFahrenheit) {
        city = city.replace(/\+/g, "");
        const unit = useFahrenheit ? "u" : "m";
        const res = await fetch(`https://wttr.in/${city}?format=3&${unit}`);
        const text = await res.text();
        if (text.startsWith("Unknown Location")) {
            console.error("Error #3");
            return;
        }
        const weatherEl = document.getElementById("weather");
        const toggleEl = document.getElementById("toggle");
        weatherEl.innerText = text.replace(/\n/g, " ");
        weatherEl.textContent = text.replace(/\r?\n|\r/g, " ");
        weatherEl.classList.add("show");
        toggleEl.classList.add("show");
        removePlusSignsFromPage();
        applyDarkModeClass();
    }
    function removePlusSignsFromPage() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            node.nodeValue = node.nodeValue.replace(/\+/g, "");
        }
    }
    document.getElementById("toggle")?.addEventListener("click", () => {
        isFahrenheit = !isFahrenheit;
        document.getElementById("toggle").innerText = isFahrenheit ? "°C" : "°F";
        getWeather(currentCity, isFahrenheit);
    });
    async function initWeather() {
        await getLocation();
        getWeather(currentCity, isFahrenheit);
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