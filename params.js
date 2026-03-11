const x3tfypage = window.location.pathname;
const x3tfyparams = new URLSearchParams(window.location.search);
if (x3tfypage === '/InfiniteAbouts.html') {
    const roleParams = x3tfyparams.get("role");
    const allowedHosts = ["infinitecampus.xyz", "www.infinitecampus.xyz", "instructure.space", "localhost:2000"];
    const before = document.getElementById("before");
    const toptext = document.getElementById("tptxt");
    const rolecontainer = document.getElementById('rolesContainer');
    const beforecontainer = document.getElementById('beforeContainer');
    if (roleParams) {
        rolecontainer.style.display = "block";
        beforecontainer.style.display = "none";
    }
    if (!allowedHosts.includes(window.location.host)) {
        toptext.textContent = "About Infinite Campus";
        before.innerHTML = `
            Infinite Campus Was Founded On December 19th, 2024.
            <br>
            <br>
            <p class="r">
                You Are Using This Site On A Mirror Link
                <br>
                <br>
                Please Be Careful About Entering Important Information
                <br>
                <br>
                The Proxy 
                <strong>
                    WILL NOT
                </strong>
                Work
                <br>
                Any Support Requests Regarding The Proxy From A Non-Official Link Will Not Be Responded To
                <br>
                <br>
                Depending On If The Code Exists, There Should Only Be One Games Button In The Games Tab
                <br>
                If There Is More Than One Button, The First One Will Not Work As It Utilizes The Proxy
                <br>
                <br>
                The Official Links To This Site Are:
                <br>
                <a class="discord" href="https://www.infinitecampus.xyz">
                    https://infinitecampus.xyz
                </a>
                And
                <a class="discord" href="https://instructure.space">
                    https://instructure.space
                </a>
            </p>
            To Contact The Owner, Email support@infinitecampus.xyz
        `;
    }
} else if (x3tfypage === '/InfiniteAis.html') {
    const endpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";
    const input = document.getElementById("aiInput");
    const chat = document.getElementById("aiChat");
    let contents = [];
    function addMessage(role, text) {
        const div = document.createElement("div");
        div.className = `aiMsg ${role}`;
        if (role === "user") {
            text = "**You:** " + text;
        }
        div.innerHTML = marked.parse(text);
        chat.appendChild(div);
        enhanceCodeBlocks(div);
        window.scrollTo(0, document.body.scrollHeight);
        return div;
    }
    async function sendMessage(text) {
        contents.push({ role: "user", parts: [{ text }] });
        addMessage("user", text);
        const loadingMsg = addMessage("model", "_Loading..._");
        const body = {
            contents: contents,
            generationConfig: { temperature: 0.7 }
        };
        let responseText = "(No Response)";
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            responseText =
                json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || JSON.stringify(json, null, 2);
        } catch (e) {
            responseText = "Request Failed: " + e.message;
        }
        contents.push({ role: "model", parts: [{ text: responseText }] });
        loadingMsg.innerHTML = marked.parse(responseText);
        enhanceCodeBlocks(loadingMsg);
        window.scrollTo(0, document.body.scrollHeight);
    }
    function enhanceCodeBlocks(container) {
        Prism.highlightAllUnder(container);
        container.querySelectorAll("pre").forEach(pre => {
            if (pre.querySelector(".aicopy-btn")) return;
            const button = document.createElement("button");
            button.innerHTML = "<i class='bi bi-copy'></i>";
            button.className = "aicopy-btn";
            const code = pre.querySelector("code");
            button.onclick = () => {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    button.textContent = "Copied!";
                    setTimeout(() => button.innerHTML = "<i class='bi bi-copy'></i>", 1200);
                });
            };
            pre.appendChild(button);
        });
    }
    input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim()) {
            const text = input.value.trim();
            input.value = "";
            sendMessage(text);
        }
    });
} else if (x3tfypage === '/InfiniteArchives.html') {
    document.querySelectorAll('.vhtml').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const fileURL = this.getAttribute('href');
            fetch(fileURL)
            .then(response => response.text())
            .then(html => {
                const win = window.open();
                win.document.write('<pre>' +
                    html.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                '</pre>');
            })
            .catch(err => showError('Error: ' + err));
        });
    });
} else if (x3tfypage === '/InfiniteBypassers.html') {
    let bypassCustomChecks = false;
    function openGame(url) {
        var win = window.open('about:blank');
        if (win) {
            win.document.open();
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <link rel="icon" type="image/png" href="/res/icon.png">
                    <title>${c}</title>
                    <style>
                        html, body {
                            margin: 0;
                            padding: 0;
                            width: 100%;
                            height: 100%;
                            overflow: hidden;
                            background: black;
                        }
                        iframe {
                            width: 100vw;
                            height: 100vh;
                            border: none;
                        }
                    </style>
                </head>
                <body>
                    <iframe src="${url}"></iframe>
                </body>
                </html>
            `);

            win.document.close();
        } else {
            showError("Popup Blocked");
        }
    }
    function normalizeUrl(url) {
        url = url.trim();
        if (/^https?:\/\/www\./i.test(url)) {
            return url;
        }
        url = url.replace(/^https?:\/\//i, '');
        return 'https://.' + url;
    }
    async function checkURLStatus(url) {
        url = normalizeUrl(url);
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                return { status: "cors-ok" };
            } else {
                return { status: "cors-ok-but-error", code: response.status };
            }
        } catch (error) {
            if (error.name === "TypeError") {
                try {
                    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                    return { status: "cors-blocked" };
                } catch {
                    return { status: "not-exist" };
                }
            }
            return { status: "not-exist" };
        }
    }
    document.getElementById('openCustomUrl').addEventListener('click', async () => {
        let url = document.getElementById('customUrl').value.trim();
        if (!url) {
            showError('Please Enter A URL.');
            return;
        }
        try {
            url = new URL(url).href;
        } catch {
            try {
                url = normalizeUrl(url);
                url = new URL(url).href;
            } catch {
                showError('Invalid URL. Please Enter A Valid URL.');
                return;
            }
        }
        if (bypassCustomChecks) {
            openGame(url);
            return;
        }
        const existingWarning = document.getElementById('corsWarning');
        if (existingWarning) existingWarning.remove();
        const check = await checkURLStatus(url);
        if (check.status === "cors-ok" || check.status === "cors-ok-but-error") {
            openGame(url);
        } else if (check.status === "cors-blocked") {
            const container = document.createElement('div');
            container.id = 'corsWarning';
            container.style.marginTop = '15px';
            container.style.textAlign = 'center';
            const warningText = document.createElement('p');
            warningText.style.color = 'red';
            warningText.textContent =
                'Website Does Not Have CORS Enabled — About:Blank May Not Work';
            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.classList.add('button');
            okButton.style.marginTop = '8px';
            okButton.addEventListener('click', () => {
                openGame(url);
                container.remove();
            });
            container.appendChild(warningText);
            container.appendChild(okButton);
            document
                .getElementById('openCustomUrl')
                .insertAdjacentElement('afterend', container);
        } else {
            showError('Error: Website Does Not Exist');
        }
    });
    document.getElementById('openInfiniteCampus').addEventListener('click', () => {
        openGame(window.location.origin);
    });
    const bypassBtn = document.createElement('button');
    bypassBtn.textContent = 'Bypass URL Checks OFF';
    bypassBtn.classList = 'button apbtn';
    bypassBtn.style.marginTop = '10px';
    bypassBtn.style.display = 'block';
    bypassBtn.addEventListener('click', () => {
        bypassCustomChecks = !bypassCustomChecks;
        bypassBtn.textContent = bypassCustomChecks
            ? 'Bypass URL Checks ON'
            : 'Bypass URL Checks OFF';
    });
    document.getElementById('customUrl').insertAdjacentElement('afterend', bypassBtn);
} else if (x3tfypage === '/InfiniteCounters.html') {
    let timer;
    let targetDate;
    let audioStarted = false;
    let lastLoggedAt = 0;
    const audio = new Audio("https://codehs.com/uploads/4c43e4c918e704a08db7b92ff1daadf3");
    const picker = document.getElementById("dateTimePicker");
    const startBtn = document.getElementById("startBtn");
    const digitalClock = document.getElementById("digitalClock");
    const setupUI = document.getElementById("setup");
    const clockUI = document.getElementById("clockView");
    const dateText = document.getElementById("dateText");
    const hourHand = document.getElementById("hour");
    const minuteHand = document.getElementById("minute");
    const secondHand = document.getElementById("second");
    const reset = document.getElementById("reset");
    const today = new Date();
    const clockMode = document.getElementById("clockMode");
    const analogClock = document.getElementById("analogClock");
    today.setHours(0, 0, 0, 0);
    function formatLocalDate(date) {
        const pad = n => n.toString().padStart(2, "0");
        return date.getFullYear() + "-" +
            pad(date.getMonth() + 1) + "-" +
            pad(date.getDate()) + "T" +
            pad(date.getHours()) + ":" +
            pad(date.getMinutes());
    }
    picker.value = formatLocalDate(today);
    startBtn.onclick = () => {
        targetDate = new Date(picker.value);
        if (isNaN(targetDate)) return;
        localStorage.setItem("countdownTarget", targetDate.getTime());
        setupUI.style.display = "none";
        clockUI.style.display = "flex";
        clearInterval(timer);
        timer = setInterval(update, 1000);
        update();
    };
    function updateClockMode() {
        if (clockMode.value === "digital") {
            analogClock.style.display = "none";
            digitalClock.style.display = "block";
            digitalClock.classList.add("big");
        } else {
            analogClock.style.display = "block";
            digitalClock.style.display = "block";
            digitalClock.classList.remove("big");
        }
    }
    clockMode.addEventListener("change", updateClockMode);
    function update() {
        const now = new Date();
        let diff = Math.floor((targetDate - now) / 1000);
        const totalMinutes = Math.floor(diff / 60);
        const hoursLeft = Math.floor((diff % 86400) / 3600);
        const minutesLeft = Math.floor(totalMinutes % 60);
        const secondsLeft = diff % 60;
        digitalClock.textContent =
            `${hoursLeft.toString().padStart(2, "0")}H:` +
            `${minutesLeft.toString().padStart(2, "0")}M:` +
            `${secondsLeft.toString().padStart(2, "0")}S`;
        if (diff <= 58.5 && !audioStarted) {
            audio.play().catch(() => {});
            audioStarted = true;
        }
        if (diff <= 0) {
            clearInterval(timer);
            dateText.textContent = "Times Up!";
            localStorage.removeItem("countdownTarget");
            return;
        }
        let days = Math.floor(diff / 86400);
        let months = Math.floor(days / 30);
        let years = Math.floor(months / 12);
        dateText.textContent =
            `${years} Years • ${months % 12} Months • ${days % 30} Days`;
        const totalMinutesLeft = Math.floor(diff / 60);
        const minutesLeftAnalog = totalMinutesLeft % 60;
        const hoursLeftAnalog = Math.floor(totalMinutesLeft / 60) % 12;
        const smoothSeconds = secondsLeft;
        const smoothMinutes = minutesLeftAnalog + smoothSeconds / 60;
        const smoothHours = hoursLeftAnalog + smoothMinutes / 60;
        secondHand.style.transform = `rotate(${smoothSeconds * 6}deg) translateY(-1px)`;
        minuteHand.style.transform = `rotate(${smoothMinutes * 6}deg) translateY(0px)`;
        hourHand.style.transform   = `rotate(${smoothHours * 30}deg) translateY(-2px)`;
    }
    reset.addEventListener("click", () => {
        localStorage.removeItem("countdownTarget");
        location.reload();
    })
    window.addEventListener("load", () => {
        const saved = localStorage.getItem("countdownTarget");
        if (saved && new Date(parseInt(saved)) > new Date()) {
            targetDate = new Date(parseInt(saved));
            setupUI.style.display = "none";
            clockUI.style.display = "flex";
            timer = setInterval(update, 1000);
            update();
        }
    });
    updateClockMode();
} else if (x3tfypage === '/InfiniteDatas.html') {
    let overrideChecks = false;
    const thisSite = document.getElementById("thisSite");
    thisSite.value = window.location.origin;
    document.getElementById('overrideBtn').addEventListener('click', () => {
        overrideChecks = !overrideChecks;
        const btn = document.getElementById('overrideBtn');
        if (overrideChecks) {
            btn.textContent = "Override URL Checks: ON";
            btn.classList.remove('override-off');
            btn.classList.add('override-on');
            showSuccess("URL Checks Overridden");
        } else {
            btn.textContent = "Override URL Checks: OFF";
            btn.classList.remove('override-on');
            btn.classList.add('override-off');
            showSuccess("URL Checks Restored");
        }
    });
    function normalizeUrl(url) {
        url = url.trim();
        if (/^https?:\/\//i.test(url)) {
            return url;
        }
        url = url.replace(/^https?:\/\//i, '');
        return 'https://.' + url;
    }
    async function checkURLStatus(url) {
        url = normalizeUrl(url);
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                return { status: "cors-ok" };
            } else {
                return { status: "cors-ok-but-error", code: response.status };
            }
        } catch (error) {
            if (error.name === "TypeError") {
                try {
                    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                    return { status: "cors-blocked" };
                } catch {
                    return { status: "network-blocked" };
                }
            }
            return { status: "network-blocked" };
        }
    }
    function asciiEncode(str) {
        return [...str].map(c => {
            const code = c.charCodeAt(0);
            if (
                (code >= 65 && code <= 90) ||
                (code >= 97 && code <= 122) ||
                (code >= 48 && code <= 57) ||
                c === '-' || c === '_' || c === '.' || c === '~'
            ) {
                return c;
            }
            if (code === 10) return '%0A';
            if (code === 13) return '';
            if (code === 9) return '%09';
            if (code === 32) return '%20';
            return '%' + code.toString(16).toUpperCase().padStart(2, '0');
        }).join('');
    }
    function generateBase64(url) {
        if (!url) {
            showError("Please Enter A URL.");
            return '';
        }
        url = normalizeUrl(url);
        let template = `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" style="width:100vw !important; height:100vh !important;"><title>Infinite Campus</title><foreignObject x="0" y="0" style="width:100vw !important; height:100vh !important;"><embed xmlns="http://www.w3.org/1999/xhtml" src="${url}" type="text/plain" style="height:100vh !important; width:100vw !important;" /></foreignObject></svg>`;
        const base64 = btoa(unescape(encodeURIComponent(template)));
        return `data:image/svg+xml;base64,${base64}`;
    }
    function generateAsciiEncodedHtml(url) {
        if (!url) {
            showError("Please Enter A URL.");
            return '';
        }
        url = normalizeUrl(url);
        let htmlCode = `<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Infinite Campus</title><style>body {margin:0px;}svg, foreignobject, embed {height:100vh;width:100vw;}</style></head><body><svg style="height:100vh; width:100vw;"><foreignobject><embed src="${url}"></foreignobject></svg></body></html>`;
        const encoded = asciiEncode(htmlCode);
        return 'data:text/html;charset=utf-8,' + encoded;
    }
    async function generateDataUrl() {
        let urlInput = document.getElementById('urlInput').value.trim();
        const preset = document.getElementById('presetSelect').value;
        const type = document.getElementById('typeSelect').value;
        if (!urlInput && preset) urlInput = preset;
        if (!urlInput) {
            showError("Please Select Or Enter A URL.");
            return;
        }
        if (overrideChecks) {
            let result = '';
            if (type === 'image') {
                result = generateBase64(urlInput);
            } else {
                result = generateAsciiEncodedHtml(urlInput);
            }
            document.getElementById('output').value = result;
            showSuccess("Generated With Override");
            return;
        }
        const check = await checkURLStatus(urlInput);
        if (
            check.status === "cors-ok" ||
            check.status === "cors-ok-but-error" ||
            check.status === "cors-blocked"
        ) {
            let result = '';
            if (type === 'image') {
                result = generateBase64(urlInput);
            } else {
                result = generateAsciiEncodedHtml(urlInput);
            }
            document.getElementById('output').value = result;
            if (check.status === "cors-blocked") {
                showError("Website Does Not Allow CORS So Link May Not Work");
            } else {
                showSuccess("done");
            }
        }
        else if (check.status === "not-exist") {
            showError("Error: Website Does Not Exist");
            document.getElementById('output').value = '';
        }
        else if (check.status === "network-blocked") {
            showError("Website Blocked For Your Internet Or Website Does Not Exist");
            document.getElementById('output').value = '';
        }
    }
    document.getElementById('presetSelect').addEventListener('change', () => {
        const presetVal = document.getElementById('presetSelect').value;
        if (presetVal) {
            document.getElementById('urlInput').value = presetVal;
        }
    });
    document.getElementById('generateBtn').addEventListener('click', generateDataUrl);
    document.getElementById('urlInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            generateDataUrl();
        }
    });
    document.getElementById('copyBtn').addEventListener('click', () => {
        const output = document.getElementById('output').value;
        if (!output) {
            showError("Nothing To Copy. Generate A URL First.");
            return;
        }
        navigator.clipboard.writeText(output)
        .then(() => showSuccess("Copied To Clipboard!"))
        .catch(() => showError("Error: Failed To Copy."));
    });
} else if (x3tfypage === '/InfiniteDownloads.html') {
    const games = document.getElementById('downloadGames');
    const website = document.getElementById('downloadWebsite');
    const webParams = x3tfyparams.get("website");
    if (webParams) {
        games.style.display = 'none';
        website.style.display = 'block';
    }
} else if (x3tfypage === '/InfiniteEmbeds.html') {
    const choice = x3tfyparams.get("choice");
    const iframe = document.getElementById('embFrame');
    const tptxt = document.getElementById('rpbgtxt');
    const hr = document.getElementById('rphr');
    const cEmbBtn = document.getElementById('cEmbBtn');
    if (choice == 1) {
        iframe.src = 'https://padlet.com/newsomr95/chat-room-br2tjbusbebezr2n';
        cEmbBtn.style.display = 'block';
    }else if (choice == 2) {
        iframe.src = 'https://nettleweb.com';
    } else if (choice == 3) {
        iframe.src = 'https://sigmasigmatoiletedge.github.io';
    } else if (choice == 4) {
        iframe.src = 'https://dfs3rzq44v6as.cloudfront.net/place/';
    } else if(choice == 5) {
        iframe.src = 'https://docs.google.com/forms/d/e/1FAIpQLSfcgIrELDOk41dsNC_CmCBfT8dLCidiYC_ZBB9F1kfO_cuNKg/viewform?embedded=true';
        iframe.width = '640';
        iframe.height = '852';
        iframe.style.height = "calc(100vh - ((var(--headerHeight) * 2) + var(--footerHeight)))";
        iframe.frameborder = '0';
        iframe.marginheight = '0';
        iframe.marginwidth = '0';
        tptxt.style.display = 'block';
        hr.style.display = 'block';
    } else if(choice == 6) {
        iframe.src = 'https://calc-one-ruby.vercel.app/';
    } else if (choice == 7) {
        showError('WARNING: Use At Your Own Risk. We Are NOT Responsible If You Get Caught Or Get In Trouble For Using This.');
        iframe.src = 'https://proxyman15.github.io/';
    } else {
        iframe.style.display = 'none';
        showError('You Must Select An Embed First');
    }
} else if (x3tfypage === '/InfiniteMirrors.html') {
    const byod = x3tfyparams.get("byod");
    const byodSection = document.getElementById('byod');
    const mirrorSection = document.getElementById('mirror');
    if (byod) {
        mirrorSection.style.display = 'none';
        byodSection.style.display = 'block';
    }
} else if (x3tfypage === '/InfinitePlayers.html') {
    const FALLBACK_ART = "/res/icon.png";
    const PREV_RESTART_THRESHOLD = 10;
    const DB_NAME = "dryPlayerDB";
    const DB_VERSION = 2;
    let db;
    let tracks = [];
    let currentIndex = 0;
    let isLooping = false;
    let isLoadedFromDB = false;
    const els = {
        fileInput: document.getElementById('fileInput'),
        playlist: document.getElementById('playlist'),
        nowTitle: document.getElementById('nowTitle'),
        artImg: document.getElementById('artImg'),
        audio: document.getElementById('audio'),
        seek: document.getElementById('seek'),
        curTime: document.getElementById('curTime'),
        durTime: document.getElementById('durTime'),
        btnPrev: document.getElementById('btnPrev'),
        btnPlay: document.getElementById('btnPlay'),
        btnNext: document.getElementById('btnNext'),
        btnLoop: document.getElementById('btnLoop'),
        countInfo: document.getElementById('countInfo'),
        saveStatus: document.getElementById('saveStatus'),
    };
    function fmtTime(s) {
        s = Math.max(0, Math.floor(s || 0));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return m + ":" + String(r).padStart(2, '0');
    }
    function stripExt(name) {
        const dot = name.lastIndexOf('.');
        return dot > 0 ? name.slice(0, dot) : name;
    }
    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                db = e.target.result;
                let store;
                if (!db.objectStoreNames.contains('songs')) {
                    store = db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
                } else {
                    store = e.target.transaction.objectStore('songs');
                }
                if (!store.indexNames.contains('position')) {
                    store.createIndex('position', 'position', { unique: false });
                }
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state', { keyPath: 'key' });
                }
            };
            req.onsuccess = (e) => { db = e.target.result; resolve(db); };
            req.onerror = (e) => reject(e);
        });
    }
    function saveAll() {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['songs','state'], 'readwrite');
            const songsStore = tx.objectStore('songs');
            const stateStore = tx.objectStore('state');
            const clearReq = songsStore.clear();
            clearReq.onsuccess = () => {
                let pending = tracks.length;
                if (pending === 0) {
                    stateStore.put({ key:'currentIndex', value: currentIndex });
                    stateStore.put({ key:'isLooping', value: isLooping });
                    resolve();
                    return;
                }
                tracks.forEach(t => {
                    const putReq = songsStore.put({
                        id: t.id ?? undefined,
                        title: t.title,
                        blob: t.blob,
                        artworkDataUrl: t.artworkDataUrl,
                        position: t.position
                    });
                    putReq.onsuccess = () => { if (--pending === 0) {
                        stateStore.put({ key:'currentIndex', value: currentIndex });
                        stateStore.put({ key:'isLooping', value: isLooping });
                        resolve();
                    }};
                    putReq.onerror = (e) => reject(e);
                });
            };
            clearReq.onerror = (e) => reject(e);
        }).then(() => showSaved('Saved')).catch(()=> showSaved('Save Failed', true));
    }
    function loadAll() {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['songs','state'], 'readonly');
            const songsStore = tx.objectStore('songs');
            const idx = songsStore.index('position');
            const tracksOut = [];
            idx.openCursor(null, 'next').onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const v = cursor.value;
                    tracksOut.push({ id: v.id, title: v.title, blob: v.blob, artworkDataUrl: v.artworkDataUrl, position: v.position });
                    cursor.continue();
                } else {
                    const stateStore = tx.objectStore('state');
                    const getCur = stateStore.get('currentIndex');
                    const getLoop = stateStore.get('isLooping');
                    getCur.onsuccess = () => {
                        getLoop.onsuccess = () => {
                            resolve({
                                tracks: tracksOut,
                                currentIndex: getCur.result?.value ?? 0,
                                isLooping: !!(getLoop.result?.value)
                            });
                        };
                    };
                }
            };
            idx.openCursor().onerror = reject;
        });
    }
    function showSaved(msg, error=false) {
        els.saveStatus.textContent = msg;
        els.saveStatus.style.color = error ? 'red' : 'white';
        setTimeout(() => { els.saveStatus.textContent = " "; }, 1800);
    }
    async function extractArtworkDataUrl(file) {
        try {
            const head = await file.slice(0, 262144).arrayBuffer();
            const view = new DataView(head);
            if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2)) !== 'ID3') {
                return FALLBACK_ART;
            }
            const version = view.getUint8(3);
            const flags = view.getUint8(5);
            const size = ((view.getUint8(6) & 0x7f) << 21) | ((view.getUint8(7) & 0x7f) << 14) |
                        ((view.getUint8(8) & 0x7f) << 7)  |  (view.getUint8(9) & 0x7f);
            let offset = 10;
            if (flags & 0x40) {
                const extSize = version === 4
                ? ((view.getUint8(offset) & 0x7f) << 21) | ((view.getUint8(offset+1) & 0x7f) << 14) |
                ((view.getUint8(offset+2) & 0x7f) << 7) | (view.getUint8(offset+3) & 0x7f)
                : view.getUint32(offset);
                offset += extSize + 4;
            }
            while (offset + 10 <= head.byteLength) {
                const fid = String.fromCharCode(
                    view.getUint8(offset+0),
                    view.getUint8(offset+1),
                    view.getUint8(offset+2),
                    view.getUint8(offset+3)
                );
                let fsize = version === 4
                    ? ((view.getUint8(offset+4) & 0x7f) << 21) | ((view.getUint8(offset+5) & 0x7f) << 14) |
                    ((view.getUint8(offset+6) & 0x7f) << 7)  |  (view.getUint8(offset+7) & 0x7f)
                    : view.getUint32(offset+4);
                const fflags = view.getUint16(offset+8);
                offset += 10;
                if (!fid.trim() || fsize <= 0) break;
                if (fid === 'APIC' && offset + fsize <= head.byteLength) {
                    const apic = new Uint8Array(head, offset, fsize);
                    let p = 0;
                    const textEnc = apic[p++];
                    let mimeEnd = p;
                    while (mimeEnd < apic.length && apic[mimeEnd] !== 0) mimeEnd++;
                    const mime = new TextDecoder('iso-8859-1').decode(apic.subarray(p, mimeEnd)) || 'image/jpeg';
                    p = mimeEnd + 1;
                    p += 1;
                    if (textEnc === 1) {
                        while (p+1 < apic.length && !(apic[p]===0 && apic[p+1]===0)) p+=2;
                        p+=2;
                    } else {
                        while (p < apic.length && apic[p] !== 0) p++;
                        p++;
                    }
                    const imgBytes = apic.subarray(p);
                    const blob = new Blob([imgBytes], { type: mime || 'image/jpeg' });
                    const dataUrl = await blobToDataURL(blob);
                    return dataUrl || FALLBACK_ART;
                }
                offset += fsize;
            }
        } catch {}
            return FALLBACK_ART;
    }
    function blobToDataURL(blob) {
        return new Promise((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = () => resolve(null);
            fr.readAsDataURL(blob);
        });
    }
    function refreshListUI() {
        els.playlist.innerHTML = '';
        tracks.sort((a,b) => a.position - b.position);
        tracks.forEach((t, i) => {
            const li = document.createElement('li');
            li.className = 'track' + (i === currentIndex ? ' active' : '');
            li.draggable = true;
            li.dataset.id = t.id;
            li.innerHTML = `
                <span class="drag-handle" title="Drag">
                    <i class="bi bi-grip-vertical">
                    </i>
                </span>
                <span class="index">
                    ${i+1}
                </span>
                <span class="track-title" title="${t.title}">
                    ${t.title}
                </span>
            `;
            li.addEventListener('click', () => {
                if (currentIndex !== i) {
                    currentIndex = i;
                    loadCurrentTrack(true);
                }
            });
            addDragHandlers(li);
            els.playlist.appendChild(li);
        });
        els.countInfo.textContent = `${tracks.length} track${tracks.length===1?'':'s'}`;
    }
    function setNowPlayingUI() {
        const t = tracks[currentIndex];
        if (!t) {
            els.nowTitle.innerHTML = '<i class="bi bi-dash"></i>';
            els.artImg.src = FALLBACK_ART;
            return;
        }
        els.nowTitle.textContent = t.title || 'Untitled';
        els.artImg.src = t.artworkDataUrl || FALLBACK_ART;
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: t.title || 'Untitled',
                artist: '',
                album: 'Playlist',
                artwork: [
                    { src: t.artworkDataUrl || FALLBACK_ART, sizes: '512x512', type: 'image/png' }
                ]
            });
        }
    }
    function setLoopUI() {
        els.btnLoop.classList.toggle('toggled', isLooping);
    }
    let objectUrlCache = new Map();
    function getObjectURLForTrack(t) {
        if (objectUrlCache.has(t.id)) return objectUrlCache.get(t.id);
        const url = URL.createObjectURL(t.blob);
        objectUrlCache.set(t.id, url);
        return url;
    }
    function revokeAllObjectURLs() {
        for (const url of objectUrlCache.values()) URL.revokeObjectURL(url);
        objectUrlCache.clear();
    }
    function loadCurrentTrack(autoplay=false, keepTime=false) {
        const t = tracks[currentIndex];
        if (!t) return;
        [...els.playlist.children].forEach((li, i) => li.classList.toggle('active', i === currentIndex));
        setNowPlayingUI();
        const url = getObjectURLForTrack(t);
        const wasPlaying = !els.audio.paused;
        const prevTime = els.audio.currentTime || 0;
        els.audio.src = url;
        if (keepTime) els.audio.currentTime = prevTime;
        if (autoplay || wasPlaying) {
            els.audio.play().catch(()=>{});
            setPlayButtons(true);
        } else {
            setPlayButtons(false);
        }
        saveAll();
    }
    function setPlayButtons(playing) {
        els.btnPlay.innerHTML = playing ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
    }
    function nextTrack(autoplay=true) {
        if (tracks.length === 0) return;
        if (currentIndex < tracks.length - 1) {
            currentIndex++;
            loadCurrentTrack(autoplay);
        } else {
            if (isLooping) {
                currentIndex = 0;
                loadCurrentTrack(true);
            } else {
                els.audio.pause();
                els.audio.currentTime = 0;
                setPlayButtons(false);
            }
        }
    }
    function prevTrackSmart() {
        if (tracks.length === 0) return;
        if (els.audio.currentTime > PREV_RESTART_THRESHOLD) {
            els.audio.currentTime = 0;
        } else {
            if (currentIndex > 0) {
                currentIndex--;
                loadCurrentTrack(true);
            } else {
                if (isLooping) {
                    currentIndex = tracks.length - 1;
                    loadCurrentTrack(true);
                } else {
                    els.audio.currentTime = 0;
                }
            }
        }
    }
    let dragSrcEl = null;
    function addDragHandlers(li) {
        li.addEventListener('dragstart', (e) => {
            dragSrcEl = li;
            li.classList.add('ghost');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', li.dataset.id);
        });
        li.addEventListener('dragend', () => {
            dragSrcEl = null;
            li.classList.remove('ghost');
        });
        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        li.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromId = e.dataTransfer.getData('text/plain');
            const toId = li.dataset.id;
            if (fromId === toId) return;
            const fromIdx = tracks.findIndex(t => String(t.id) === String(fromId));
            const toIdx = tracks.findIndex(t => String(t.id) === String(toId));
            if (fromIdx === -1 || toIdx === -1) return;
            const [moved] = tracks.splice(fromIdx, 1);
            tracks.splice(toIdx, 0, moved);
            tracks.forEach((t,i)=> t.position = i);
            if (currentIndex === fromIdx) currentIndex = toIdx;
            else if (fromIdx < currentIndex && toIdx >= currentIndex) currentIndex--;
            else if (fromIdx > currentIndex && toIdx <= currentIndex) currentIndex++;
            refreshListUI();
            saveAll();
        });
    }
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', async () => { await els.audio.play().catch(()=>{}); setPlayButtons(true); });
        navigator.mediaSession.setActionHandler('pause', () => { els.audio.pause(); setPlayButtons(false); });
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrackSmart());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack(true));
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.fastSeek && 'fastSeek' in els.audio) {
                els.audio.fastSeek(details.seekTime);
            } else {
                els.audio.currentTime = details.seekTime ?? els.audio.currentTime;
            }
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const step = details.seekOffset || 10;
            els.audio.currentTime = Math.max(0, els.audio.currentTime - step);
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const step = details.seekOffset || 10;
            els.audio.currentTime = Math.min(els.audio.duration || Infinity, els.audio.currentTime + step);
        });
    }
    function makeUUID() {
        if (crypto && crypto.getRandomValues) {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }
        return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    els.fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('audio/'));
        if (files.length === 0) return;
        const toAdd = files;
        for (let i = 0; i < toAdd.length; i++) {
            const f = toAdd[i];
            const artworkDataUrl = await extractArtworkDataUrl(f);
            const blob = new Blob([await f.arrayBuffer()], { type: f.type || 'audio/mpeg' });
            const title = stripExt(f.name);
            const position = tracks.length + i;
            tracks.push({ id: makeUUID(), title, blob, artworkDataUrl, position });
        }
        refreshListUI();
        if (tracks.length > 0) {
            if (tracks.length === toAdd.length) currentIndex = 0;
            loadCurrentTrack(false);
        }
        await saveAll();
        e.target.value = '';
    });

    els.btnPlay.addEventListener('click', async () => {
        if (els.audio.paused) { await els.audio.play().catch(()=>{}); setPlayButtons(true); }
        else { els.audio.pause(); setPlayButtons(false); }
    });
    els.btnNext.addEventListener('click', () => nextTrack(true));
    els.btnPrev.addEventListener('click', () => prevTrackSmart());
    els.btnLoop.addEventListener('click', () => { isLooping = !isLooping; setLoopUI(); saveAll(); });
    function syncSeekers() {
        const cur = els.audio.currentTime || 0;
        const dur = isFinite(els.audio.duration) ? (els.audio.duration || 0) : 0;
        const ratio = dur ? (cur / dur) : 0;
        const val = Math.round(ratio * 1000);
        els.seek.value = String(val);
        els.curTime.textContent = fmtTime(cur);
        els.durTime.textContent = fmtTime(dur);
    }
    els.seek.addEventListener('input', () => {
        const dur = els.audio.duration || 0;
        els.audio.currentTime = +els.seek.value / 1000 * dur;
    });
    els.audio.addEventListener('timeupdate', syncSeekers);
    els.audio.addEventListener('loadedmetadata', syncSeekers);
    els.audio.addEventListener('durationchange', syncSeekers);
    els.audio.addEventListener('ended', () => nextTrack(true));
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
            e.preventDefault();
            if (els.audio.paused) els.audio.play().then(()=> setPlayButtons(true));
            else { els.audio.pause(); setPlayButtons(false); }
        }
    });
    async function clearPlaylistAndDB() {
        tracks = [];
        currentIndex = 0;
        isLooping = false;
        revokeAllObjectURLs();
        refreshListUI();
        setNowPlayingUI();
        setLoopUI();
        els.audio.pause();
        els.audio.src = '';
        setPlayButtons(false);
        return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(DB_NAME);
            deleteReq.onsuccess = () => {
                showSaved("Playlist Cleared");
                resolve();
            };
            deleteReq.onerror = (e) => {
                showSaved("Failed To Clear", true);
                reject(e);
            };
        }).then(() => openDB());
    }
    els.btnClear = document.getElementById('btnClear');
    els.btnClear.addEventListener('click', () => {
        showConfirm("Are You Sure You Want To Clear The Playlist?", function(result) {
            if (result) {
                clearPlaylistAndDB();
            } else {
                showSuccess("Canceled");
            }
        })
    });
    (async function init() {
        await openDB();
        const data = await loadAll();
        tracks = (data.tracks || []).map((t,i)=>({
            ...t,
            position: Number.isFinite(t.position) ? t.position : i
        }));
        currentIndex = Math.min(Math.max(0, data.currentIndex || 0), Math.max(0, tracks.length-1));
        isLooping = !!data.isLooping;
        isLoadedFromDB = tracks.length > 0;
        refreshListUI();
        setLoopUI();
        if (tracks.length > 0) {
            loadCurrentTrack(false);
        } else {
            els.artImg.src = FALLBACK_ART;
        }
    })();
    window.addEventListener('beforeunload', () => {
        revokeAllObjectURLs();
    });
} else if (x3tfypage === '/InfiniteQrs.html') {
    const fieldsEl=document.getElementById('fields');
    const fnTypeEl=document.getElementById('fnType');
    const qrSizeEl=document.getElementById('qrSize');
    const qrECEl=document.getElementById('qrEC');
    const moduleColorEl=document.getElementById('moduleColor');
    const bgColorEl=document.getElementById('bgColor');
    const logoInputEl=document.getElementById('logoInput');
    const logoScaleEl=document.getElementById('logoScale');
    const logoRadiusEl=document.getElementById('logoRadius');
    const logoBorderEl=document.getElementById('logoBorderSize');
    const logoPreviewImg=document.getElementById('logoPreviewImg');
    const logoEmpty=document.getElementById('logoEmpty');
    const clearLogoBtn=document.getElementById('clearLogo');
    const downloadBtn=document.getElementById('downloadBtn');
    const previewCanvas=document.getElementById('qrPreview');
    const previewCtx=previewCanvas.getContext('2d');
    let logoImage=null;
    let latestExportCanvas=null;
    function html(s,...v){return s.map((s,i)=>s+(v[i]??'')).join('');}
    const templates={
        text:()=>html`<label for="textValue" class="btxt">URL or Text</label><br><textarea class="button" id="textValue" placeholder="https://example.com"></textarea>`,
        wifi:()=>html`<div class="row"><div><label for="wifiSsid">SSID:</label><br><input id="wifiSsid" type="text" placeholder="Enter SSID Here" class="button"/></div><div><label for="wifiAuth">Security:</label><br><select id="wifiAuth" class="button"><option value="WPA">WPA</option><option value="WEP">WEP</option><option value="nopass">None</option></select></div></div><div><label for="wifiPass">Password:</label><br><input placeholder="Enter Password Here" class="button" id="wifiPass" type="text" /></div>`,
        email:()=>html`<label for="emailTo">To:</label><br><input id="emailTo" type="email" class="button" placeholder="Enter Email Address Here"/><br><label for="emailSubject">Subject: </label><br><input class="button" id="emailSubject" type="text" placeholder="Enter Subject Here" /><br><label for="emailBody">Body: </label><br><textarea id="emailBody" class="button" placeholder="Enter Email Body Here"></textarea>`,
        phone:()=>html`<label for="telNumber">Phone Number: </label><br><input id="telNumber" class="button" placeholder="Enter Phone Number" type="text" />`,
        sms:()=>html`<label for="smsNumber">Number: </label><br><input id="smsNumber" type="text" class="button" placeholder="Enter Phone Number" /><br><label for="smsBody">Message:</label><br><input class="button" placeholder="Enter Message Here" id="smsBody" type="text" />`,
        geo:()=>html`<label for="geoLat">Latitude:</label><br><input id="geoLat" class="button" placeholder="Enter Lat Here" type="text" /><br><label for="geoLng">Longitude:</label><br><input class="button" placeholder="Enter Long Here" id="geoLng" type="text" />`
    };
    function renderFields(){
        fieldsEl.innerHTML=templates[fnTypeEl.value]();
        fieldsEl.querySelectorAll('input,textarea,select').forEach(el=>{
            el.addEventListener('input',scheduleRender);
            el.addEventListener('change',scheduleRender);
        });
        scheduleRender();
    }
    function buildPayload(){
        const type=fnTypeEl.value;
        const g=(id)=>fieldsEl.querySelector('#'+id);
        switch(type){
            case 'text': return (g('textValue')?.value||'').trim();
            case 'wifi': {const ssid=g('wifiSsid')?.value||''; const auth=g('wifiAuth')?.value||'WPA'; const pass=g('wifiPass')?.value||''; return `WIFI:T:${auth};S:${ssid};${auth!=='nopass'?`P:${pass};`:''};`;}
            case 'email': {const to=g('emailTo')?.value||''; const sub=g('emailSubject')?.value||''; const body=g('emailBody')?.value||''; return `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;}
            case 'phone': return 'tel:'+((g('telNumber')?.value||'').replace(/\s+/g,'')); 
            case 'sms': {const num=(g('smsNumber')?.value||'').replace(/\s+/g,''); const body=g('smsBody')?.value||''; return `SMSTO:${num}:${body}`;}
            case 'geo': return `geo:${g('geoLat')?.value||''},${g('geoLng')?.value||''}`;
        }
    }
    let renderTimer=null;
    function scheduleRender(){ clearTimeout(renderTimer); renderTimer=setTimeout(()=>{generateAndPreview();},50); }
    function generateQRCodeCanvas(data,size,ecLevel,moduleColor,bg){
        const tempDiv=document.createElement('div'); tempDiv.style.position='absolute'; tempDiv.style.left='-9999px'; document.body.appendChild(tempDiv);
        const qr=new QRCode(tempDiv,{text:data,width:size,height:size,colorDark:moduleColor,colorLight:bg,correctLevel:QRCode.CorrectLevel[ecLevel]});
        const cnv=tempDiv.querySelector('canvas'); document.body.removeChild(tempDiv); return cnv;
    }
    function drawRoundedImage(ctx,img,x,y,w,h,r){ ctx.save(); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.clip(); ctx.drawImage(img,x,y,w,h); ctx.restore(); }
    function composeFinalCanvas(qrCanvas, options){
        const size=qrCanvas.width;
        const out=document.createElement('canvas');
        out.width=size;
        out.height=size;
        const ctx=out.getContext('2d');
        ctx.drawImage(qrCanvas,0,0);
        if(options.logoImage){
            const pct=Math.max(8,Math.min(40,Number(logoScaleEl.value)||22))/100;
            const logoSize=Math.round(size*pct);
            const cx=size/2,cy=size/2;
            const x=Math.round(cx-logoSize/2), y=Math.round(cy-logoSize/2);
            const logoBorder=Math.max(0,Number(logoBorderEl.value)||8);
            const bgX=x-logoBorder,bgY=y-logoBorder,bgW=logoSize+logoBorder*2,bgH=logoSize+logoBorder*2;
            const rad=Math.max(0,Math.min(Number(logoRadiusEl.value)||16,80));
            ctx.save();
            ctx.beginPath();
            const r=Math.min(rad+logoBorder,Math.min(bgW,bgH)/2);
            ctx.moveTo(bgX+r,bgY); ctx.arcTo(bgX+bgW,bgY,bgX+bgW,bgY+bgH,r); ctx.arcTo(bgX+bgW,bgY+bgH,bgX,bgY+bgH,r); ctx.arcTo(bgX,bgY+bgH,bgX,bgY,r); ctx.arcTo(bgX,bgY,bgX+bgW,bgY,r); ctx.closePath();
            ctx.fillStyle='#ffffff'; ctx.fill(); ctx.restore();
            drawRoundedImage(ctx,options.logoImage,x,y,logoSize,logoSize,Math.min(rad,logoSize/2));
        }
        return out;
    }
    async function generateAndPreview(){
        const payload=buildPayload();
        if(!payload){ previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height); return; }
        const size=Math.max(128,Math.min(2048,Number(qrSizeEl.value)||420));
        const ec=qrECEl.value;
        const mColor=moduleColorEl.value||'#000';
        const bg=bgColorEl.value||'#fff';
        const qrCanvas=generateQRCodeCanvas(payload,size,ec,mColor,bg);
        latestExportCanvas=composeFinalCanvas(qrCanvas,{logoImage});
        previewCanvas.width=latestExportCanvas.width;
        previewCanvas.height=latestExportCanvas.height;
        previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
        previewCtx.drawImage(latestExportCanvas,0,0);
    }
    fnTypeEl.addEventListener('change',renderFields);
    qrSizeEl.addEventListener('input',scheduleRender);
    qrECEl.addEventListener('change',scheduleRender);
    moduleColorEl.addEventListener('input',scheduleRender);
    bgColorEl.addEventListener('input',scheduleRender);
    logoScaleEl.addEventListener('input',scheduleRender);
    logoRadiusEl.addEventListener('input',scheduleRender);
    logoBorderEl.addEventListener('input',scheduleRender);
    logoInputEl.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) {
            logoImage = null;
            if (logoPreviewImg) logoPreviewImg.style.display = 'none';
            if (logoEmpty) logoEmpty.style.display = 'inline';
            scheduleRender();
            return;
        }
        const img = new Image();
        img.onload = () => {
            logoImage = img;
            if (logoPreviewImg) {
                logoPreviewImg.src = img.src;
                logoPreviewImg.style.display = 'block';
            }
            if (logoEmpty) {
                logoEmpty.style.display = 'none';
            }
            scheduleRender();
        };
        img.src = URL.createObjectURL(file);
    });
    clearLogoBtn.addEventListener('click', () => {
        logoImage = null;
        logoInputEl.value = '';
        if (logoPreviewImg) {
            logoPreviewImg.style.display = 'none';
            logoPreviewImg.src = '';
        }
        if (logoEmpty) {
            logoEmpty.style.display = 'inline';
        }
        scheduleRender();
    });
    downloadBtn.addEventListener('click',()=>{
        if(!latestExportCanvas) return;
        latestExportCanvas.toBlob(blob=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='qr-code.png'; a.click(); });
    });
    renderFields();
} else if (x3tfypage === '/InfiniteStats.html') {
    async function showLocationAndIp() {
        let infoEl = document.getElementById("ligma");
        try {
            const res = await fetch("https://ipapi.co/json/");
            if (!res.ok) throw new Error("Fetch Failed");
            const data = await res.json();
            if (!infoEl) {
                infoEl = document.createElement("div");
                infoEl.id = "ligma";
                document.body.appendChild(infoEl);
            }
            const nav = navigator;
            const browserInfo = `
                Browser Info:
                User Agent: ${nav.userAgent}
                Platform: ${nav.platform}
                Language: ${nav.language}
                Cookies Enabled: ${nav.cookieEnabled}
                Online Status: ${nav.onLine}
                Hardware Threads (CPU cores): ${nav.hardwareConcurrency ?? "Unknown"}
                Device Memory (GB): ${nav.deviceMemory ?? "Unknown"}
            `;
            const screenInfo = `
                Screen Info:
                Resolution: ${screen.width} x ${screen.height}
                Available Screen Size: ${screen.availWidth} x ${screen.availHeight}
                Color Depth: ${screen.colorDepth}
                Pixel Ratio: ${window.devicePixelRatio}
            `;
            let gpuInfo = "Unavailable";
            try {
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                if (gl) {
                    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                    if (debugInfo) {
                        gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    }
                }
            } catch (e) {
                gpuInfo = "Unavailable";
            }
            let batteryInfo = "Unavailable";
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                batteryInfo = `
                    Battery Level: ${Math.round(battery.level * 100)}%
                    Charging: ${battery.charging}
                `;
            }
            const locationInfo = `
                Location Info:
                Current State: ${data.region ?? "Unknown"}
                City: ${data.city ?? "Unknown"}
                IPv4 Address: ${data.ip ?? "Unknown"}
                Org: ${data.org ?? "Unknown"}
                Zip Code: ${data.postal ?? "Unknown"}
                Latitude: ${data.latitude ?? "0"}
                Longitude: ${data.longitude ?? "0"}
            `;
            infoEl.innerText =
                locationInfo +
                browserInfo +
                screenInfo +
                `
                    GPU: ${gpuInfo}
                ` +
                batteryInfo;
            infoEl.classList.add("show");
        } catch (err) {
            console.error("Error Fetching Location:", err);
            if (!infoEl) {
                infoEl = document.createElement("div");
                infoEl.id = "ligma";
                document.body.appendChild(infoEl);
            }
            infoEl.innerText = "Error Fetching Data.";
        }
    }
    function init() {
        showLocationAndIp();
    }
    document.addEventListener("DOMContentLoaded", init);
}