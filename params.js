const x3tfypage = window.location.pathname;
const x3tfyparams = new URLSearchParams(window.location.search);
if (x3tfypage == '/InfiniteAbouts.html') {
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
} else if (x3tfypage == '/InfiniteAis.html') {
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
            button.innerHTML = "<i class='ic ic-copy'></i>";
            button.className = "aicopy-btn";
            const code = pre.querySelector("code");
            button.onclick = () => {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    button.textContent = "Copied!";
                    setTimeout(() => button.innerHTML = "<i class='ic ic-copy'></i>", 1200);
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
} else if (x3tfypage == '/InfiniteApps.html') {
    const playerParams = x3tfyparams.get("player");
    const listenParams = x3tfyparams.get("listen");
    const themeParams = x3tfyparams.get("theme");
    const timerParams = x3tfyparams.get("timer");
    const statParams = x3tfyparams.get("stats");
    const qrParams = x3tfyparams.get("qr");
    const ytParams = x3tfyparams.get("youtube");
    const navParams = x3tfyparams.get("nav");
    const mirrorParams = x3tfyparams.get("mirror");
    const byodParams = x3tfyparams.get("byod");
    const gameParams = x3tfyparams.get("games");
    const websiteParams = x3tfyparams.get("website");
    const questionParams = x3tfyparams.get("question");
    const chromeParams = x3tfyparams.get("chrome");
    const dataParams = x3tfyparams.get("data");
    const blankParams = x3tfyparams.get("blank");
    const youtube = document.getElementById("youtube");
    const blankSection = document.getElementById("blank");
    const dataSection = document.getElementById("data");
    const navPage = document.getElementById("navPage");
    const mirror = document.getElementById("mirror");
    const byod = document.getElementById("byod");
    const downloadGames = document.getElementById("downloadGames");
    const downloadWebsite = document.getElementById("downloadWebsite");
    const questions = document.getElementById("questions");
    const cUrls = document.getElementById("cUrls");
    const qrPage = document.getElementById("qrPage");
    const statsPage = document.getElementById("statsPage");
    const timerPage = document.getElementById("timerPage");
    const themePage = document.getElementById("themePage");
    const playerPage = document.getElementById("playerPage");
    const appsPage = document.getElementById("appsPage");
    const listenPage = document.getElementById("listenPage");
    if (themeParams) {
        themePage.style.display = "block";
        appsPage.style.display = "none";
    } else if (timerParams) {
        timerPage.style.display = "block";
        appsPage.style.display = "none";
        let timer;
        let targetDate;
        let audioStarted = false;
        let lastLoggedAt = 0;
        const audio = new Audio("/res/outro.mp3");
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
    } else if (statParams) {
        statsPage.style.display = "block";
        appsPage.style.display = "none";
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
    } else if (qrParams) {
        qrPage.style.display = "block";
        appsPage.style.display = "none";
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
    } else if (ytParams) {
        youtube.style.display = "block";
        appsPage.style.display = "none";
    } else if (navParams) {
        navPage.style.display = "block";
        appsPage.style.display = "none";
    } else if (mirrorParams) {
        mirror.style.display = "block";
        appsPage.style.display = "none";
    } else if (byodParams) {
        byod.style.display = "block";
        appsPage.style.display = "none";
    } else if (gameParams) {
        downloadGames.style.display = "block";
        appsPage.style.display = "none";
    } else if (websiteParams) {
        downloadWebsite.style.display = "block";
        appsPage.style.display = "none";
    } else if (questionParams) {
        questions.style.display = "block";
        appsPage.style.display = "none";
    } else if (chromeParams) {
        cUrls.style.display = "block";
        appsPage.style.display = "none";
    } else if (dataParams) {
        appsPage.style.display = "none";
        dataSection.style.display = "block";
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
            return 'https://' + url;
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
    } else if (blankParams) {
        blankSection.style.display = "block";
        appsPage.style.display = "none";
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
            return 'https://' + url;
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
    } else if (playerParams || listenParams) {
        appsPage.style.display  = 'none';
        listenPage  && (listenPage.style.display  = 'none');
        const hidePopupStyle = document.createElement("style");
        hidePopupStyle.innerHTML = `
            .settings-button.themed {
                display:none;
            }
        `;
        document.head.appendChild(hidePopupStyle);
        const musicPage = document.getElementById('musicPage');
        musicPage.style.display = 'block';
        const FALLBACK_ART = '/res/icon.png';
        const DB_NAME = 'dryPlayerDB';
        const DB_VERSION = 3;
        const PREV_RESTART_THRESHOLD = 10;
        let db;
        let localTracks = [];
        let localIndex = 0;
        let isLooping = false;
        let isLoadedFromDB = false;
        let currentTrack = null;
        let isPlaying = false;
        let streamNavStack = [];
        const scCache = {};
        let playerMode = 'local';
        let playlists = [];
        let openPlaylistId = null;
        let pendingAddTrack = null;
        let playlistQueue = null;
        const audio = document.getElementById('audio');
        const $ = id => document.getElementById(id);
        const el = {
            fileInput: $('spFileInput'),
            playlist: $('spPlaylist'),
            nowTitle: $('spNowTitle'),
            nowArt: $('spNowArt'),
            saveStatus: $('spSaveStatus'),
            countInfo: $('spCountInfo'),
            playerThumb: $('spPlayerThumb'),
            playerTitle: $('spPlayerTitle'),
            playerArtist: $('spPlayerArtist'),
            playBtn: $('spPlayBtn'),
            playIcon: $('spPlayIcon'),
            prevBtn: $('spPrevBtn'),
            nextBtn: $('spNextBtn'),
            loopBtn: $('spLoopBtn'),
            downloadBtn: $('spDownloadBtn'),
            seekBar: $('spSeekBar'),
            timeCur: $('spTimeCur'),
            timeDur: $('spTimeDur'),
            volBar: $('spVolBar'),
            sideArtImg: $('spSideArtImg'),
            sideTitle: $('spSideTitle'),
            sideArtist: $('spSideArtist'),
            searchInput: $('spSearchInput'),
            searchBtn: $('spSearchBtn'),
            streamMain: $('spStreamMain'),
            detailPage: $('spDetailPage'),
            results: $('spResults'),
            clearBtn: $('spClearBtn'),
            downloadLibBtn: $('spDownloadLibBtn'),
            playlistGrid: $('spPlaylistGrid'),
            playlistsHome: $('spPlaylistsHome'),
            playlistDetail: $('spPlaylistDetail'),
            plName: $('spPlName'),
            plCount: $('spPlCount'),
            plTrackList: $('spPlTrackList'),
            newPlaylistBtn: $('spNewPlaylistBtn'),
            plBackBtn: $('spPlBackBtn'),
            plPlayBtn: $('spPlPlayBtn'),
            plShuffleBtn: $('spPlShuffleBtn'),
            plDownloadBtn: $('spPlDownloadBtn'),
            plDeleteBtn: $('spPlDeleteBtn'),
            plCacheOfflineBtn: $('spPlCacheOfflineBtn'),
            plModal: $('spPlModal'),
            plModalClose: $('spPlModalClose'),
            plModalList: $('spPlModalList'),
            plModalNew: $('spPlModalNew'),
        };
        function fmtTime(s) {
            s = Math.max(0, Math.floor(s || 0));
            return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
        }
        function stripExt(name) {
            const dot = name.lastIndexOf('.');
            return dot > 0 ? name.slice(0, dot) : name;
        }
        function esc(str) {
            if (!str) return '';
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;')
                      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }
        function makeUUID() {
            if (crypto?.getRandomValues) {
                return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        }
        function showSaved(msg, error = false) {
            el.saveStatus.textContent = msg;
            el.saveStatus.style.color = error ? '#f55' : '#aaa';
            setTimeout(() => { el.saveStatus.textContent = ''; }, 1800);
        }
        function openDB() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = e => {
                    db = e.target.result;
                    let store;
                    if (!db.objectStoreNames.contains('songs')) {
                        store = db.createObjectStore('songs', { keyPath: 'id' });
                    } else {
                        store = e.target.transaction.objectStore('songs');
                    }
                    if (!store.indexNames.contains('position'))
                        store.createIndex('position', 'position', { unique: false });
                    if (!db.objectStoreNames.contains('state'))
                        db.createObjectStore('state', { keyPath: 'key' });
                    if (!db.objectStoreNames.contains('playlists'))
                        db.createObjectStore('playlists', { keyPath: 'id' });
                };
                req.onsuccess = e => { db = e.target.result; resolve(db); };
                req.onerror   = e => reject(e);
            });
        }
        function saveAll() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['songs','state'], 'readwrite');
                const songsStore = tx.objectStore('songs');
                const stateStore = tx.objectStore('state');
                songsStore.clear().onsuccess = () => {
                    let pending = localTracks.length;
                    const finish = () => {
                        stateStore.put({ key:'currentIndex', value: localIndex });
                        stateStore.put({ key:'isLooping',    value: isLooping });
                        resolve();
                    };
                    if (pending === 0) { finish(); return; }
                    localTracks.forEach(t => {
                        const r = songsStore.put({
                            id: t.id, title: t.title, artist: t.artist||'', blob: t.blob,
                            artworkDataUrl: t.artworkDataUrl, position: t.position,
                            _sourceStreamId: t._sourceStreamId || null
                        });
                        r.onsuccess = () => { if (--pending === 0) finish(); };
                        r.onerror   = e => reject(e);
                    });
                };
            }).then(() => showSaved('Saved')).catch(() => showSaved('Save Failed', true));
        }
        function loadAll() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['songs','state'], 'readonly');
                const songsStore = tx.objectStore('songs');
                const idx = songsStore.index('position');
                const out = [];
                idx.openCursor(null, 'next').onsuccess = e => {
                    const cursor = e.target.result;
                    if (cursor) {
                        out.push(cursor.value);
                        cursor.continue();
                    } else {
                        const ss = tx.objectStore('state');
                        const gC = ss.get('currentIndex');
                        const gL = ss.get('isLooping');
                        gC.onsuccess = () => gL.onsuccess = () => resolve({
                            tracks: out,
                            currentIndex: gC.result?.value ?? 0,
                            isLooping:    !!(gL.result?.value)
                        });
                    }
                };
                idx.openCursor().onerror = reject;
            });
        }
        async function extractID3Tags(file) {
            const result = { artworkDataUrl: FALLBACK_ART, artist: '', title: '' };
            try {
                const head = await file.slice(0, 524288).arrayBuffer();
                const view = new DataView(head);
                if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2)) !== 'ID3')
                    return result;
                const version = view.getUint8(3);
                const flags   = view.getUint8(5);
                let offset = 10;
                if (flags & 0x40) {
                    const extSize = version === 4
                        ? ((view.getUint8(offset)&0x7f)<<21)|((view.getUint8(offset+1)&0x7f)<<14)|
                          ((view.getUint8(offset+2)&0x7f)<<7)|(view.getUint8(offset+3)&0x7f)
                        : view.getUint32(offset);
                    offset += extSize + 4;
                }
                function readTextFrame(buf, enc) {
                    try {
                        if (enc === 0) return new TextDecoder('iso-8859-1').decode(buf).replace(/\0/g,'').trim();
                        if (enc === 3) return new TextDecoder('utf-8').decode(buf).replace(/\0/g,'').trim();
                        if (enc === 1 || enc === 2) {
                            let b = buf;
                            if (b[0]===0xFF && b[1]===0xFE) b = b.slice(2);
                            else if (b[0]===0xFE && b[1]===0xFF) b = b.slice(2);
                            return new TextDecoder('utf-16le').decode(b).replace(/\0/g,'').trim();
                        }
                    } catch {}
                    return '';
                }
                while (offset + 10 <= head.byteLength) {
                    const fid = String.fromCharCode(
                        view.getUint8(offset),view.getUint8(offset+1),
                        view.getUint8(offset+2),view.getUint8(offset+3));
                    const fsize = version === 4
                        ? ((view.getUint8(offset+4)&0x7f)<<21)|((view.getUint8(offset+5)&0x7f)<<14)|
                          ((view.getUint8(offset+6)&0x7f)<<7) |(view.getUint8(offset+7)&0x7f)
                        : view.getUint32(offset+4);
                    offset += 10;
                    if (!fid.trim() || fsize <= 0) break;
                    if (offset + fsize > head.byteLength) break;
                    if (fid === 'TIT2' || fid === 'TPE1') {
                        const enc  = view.getUint8(offset);
                        const data = new Uint8Array(head, offset + 1, fsize - 1);
                        const text = readTextFrame(data, enc);
                        if (fid === 'TIT2' && text) result.title  = text;
                        if (fid === 'TPE1' && text) result.artist = text;
                    }
                    if (fid === 'APIC' && !result._gotArt) {
                        const apic = new Uint8Array(head, offset, fsize);
                        let p = 0;
                        const textEnc = apic[p++];
                        let mimeEnd = p;
                        while (mimeEnd < apic.length && apic[mimeEnd] !== 0) mimeEnd++;
                        const mime = new TextDecoder('iso-8859-1').decode(apic.subarray(p, mimeEnd)) || 'image/jpeg';
                        p = mimeEnd + 1 + 1;
                        if (textEnc === 1 || textEnc === 2) {
                            while (p+1 < apic.length && !(apic[p]===0 && apic[p+1]===0)) p+=2;
                            p+=2;
                        } else {
                            while (p < apic.length && apic[p] !== 0) p++;
                            p++;
                        }
                        const blob = new Blob([apic.subarray(p)], { type: mime || 'image/jpeg' });
                        result.artworkDataUrl = await new Promise(res => {
                            const fr = new FileReader();
                            fr.onload  = () => res(fr.result || FALLBACK_ART);
                            fr.onerror = () => res(FALLBACK_ART);
                            fr.readAsDataURL(blob);
                        });
                        result._gotArt = true;
                    }
                    offset += fsize;
                }
            } catch {}
            return result;
        }
        async function extractArtworkDataUrl(file) {
            return (await extractID3Tags(file)).artworkDataUrl;
        }
        let objectUrlCache = new Map();
        function getObjectURL(t) {
            if (objectUrlCache.has(t.id)) return objectUrlCache.get(t.id);
            const url = URL.createObjectURL(t.blob);
            objectUrlCache.set(t.id, url);
            return url;
        }
        function revokeAllObjectURLs() {
            for (const url of objectUrlCache.values()) URL.revokeObjectURL(url);
            objectUrlCache.clear();
        }
        function refreshLibraryUI() {
            el.playlist.innerHTML = '';
            localTracks.sort((a,b) => (a.position||0) - (b.position||0));
            localTracks.forEach((t, i) => {
                const li = document.createElement('li');
                li.className = 'sp-playlist-item' + (i === localIndex && playerMode === 'local' ? ' active' : '');
                li.draggable = true;
                li.dataset.id = t.id;
                const art = t.artworkDataUrl && t.artworkDataUrl !== FALLBACK_ART
                    ? t.artworkDataUrl : FALLBACK_ART;
                li.innerHTML = `
                    <span class="sp-li-drag" title="Drag"><i class="ic ic-grip-vertical"></i></span>
                    <img class="sp-li-art" src="${art}" alt="">
                    <span class="sp-li-num">${i+1}</span>
                    <span class="sp-li-title" title="${esc(t.title)}">${esc(t.title)}</span>
                    <button class="sp-pl-add-btn" title="Add to playlist"><i class="ic ic-plus"></i></button>
                    <span class="sp-li-play"><i class="ic ${i===localIndex&&playerMode==='local'?'ic-pause-fill':'ic-play-fill'}"></i></span>
                `;
                li.querySelector('.sp-pl-add-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    openAddToPlaylistModal({ title: t.title||'Untitled', artUrl: t.artworkDataUrl||FALLBACK_ART, source: 'local', localId: t.id });
                });
                li.addEventListener('click', () => {
                    localIndex = i;
                    playerMode = 'local';
                    loadLocalTrack(true);
                });
                addLibraryDrag(li);
                el.playlist.appendChild(li);
            });
            el.countInfo.textContent = `${localTracks.length} track${localTracks.length===1?'':'s'}`;
        }
        function setLocalNowPlayingUI() {
            const t = localTracks[localIndex];
            if (!t) {
                el.nowTitle.textContent = 'Nothing Playing';
                el.nowArt.src = FALLBACK_ART;
                return;
            }
            el.nowTitle.textContent = t.title || 'Untitled';
            el.nowArt.src = t.artworkDataUrl || FALLBACK_ART;
        }
        function loadLocalTrack(autoplay = false) {
            const t = localTracks[localIndex];
            if (!t) return;
            playerMode = 'local';
            currentTrack = null;
            [...el.playlist.children].forEach((li, i) => {
                li.classList.toggle('active', i === localIndex);
                const icon = li.querySelector('.sp-li-play i');
                if (icon) icon.className = 'ic ' + (i === localIndex ? 'ic-pause-fill' : 'ic-play-fill');
            });
            setLocalNowPlayingUI();
            const url = getObjectURL(t);
            audio.src = url;
            updateSidebarMeta(t.title || 'Untitled', t.artist || '', t.artworkDataUrl || FALLBACK_ART);
            updatePlayerBar(t.title || 'Untitled', t.artist || '', t.artworkDataUrl || FALLBACK_ART, true);
            if (autoplay || !audio.paused) {
                audio.play().catch(()=>{});
            }
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: t.title || 'Untitled',
                    artist: t.artist || '',
                    album: 'Library',
                    artwork: [{ src: t.artworkDataUrl || FALLBACK_ART, sizes:'512x512', type:'image/png' }]
                });
            }
            saveAll();
        }
        function nextLocalTrack() {
            if (!localTracks.length) return;
            if (localIndex < localTracks.length - 1) {
                localIndex++;
                loadLocalTrack(true);
            } else if (isLooping) {
                localIndex = 0;
                loadLocalTrack(true);
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        }
        function prevLocalTrack() {
            if (!localTracks.length) return;
            if (audio.currentTime > PREV_RESTART_THRESHOLD) {
                audio.currentTime = 0;
            } else if (localIndex > 0) {
                localIndex--;
                loadLocalTrack(true);
            } else if (isLooping) {
                localIndex = localTracks.length - 1;
                loadLocalTrack(true);
            } else {
                audio.currentTime = 0;
            }
        }
        let dragSrc = null;
        function addLibraryDrag(li) {
            li.addEventListener('dragstart', e => {
                dragSrc = li;
                li.classList.add('sp-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', li.dataset.id);
            });
            li.addEventListener('dragend', () => {
                dragSrc = null;
                li.classList.remove('sp-dragging');
            });
            li.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
            li.addEventListener('drop', e => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData('text/plain');
                const toId   = li.dataset.id;
                if (fromId === toId) return;
                const fi = localTracks.findIndex(t => String(t.id) === String(fromId));
                const ti = localTracks.findIndex(t => String(t.id) === String(toId));
                if (fi === -1 || ti === -1) return;
                const [moved] = localTracks.splice(fi, 1);
                localTracks.splice(ti, 0, moved);
                localTracks.forEach((t, i) => t.position = i);
                if (localIndex === fi) localIndex = ti;
                else if (fi < localIndex && ti >= localIndex) localIndex--;
                else if (fi > localIndex && ti <= localIndex) localIndex++;
                refreshLibraryUI();
                saveAll();
            });
        }
        async function clearLibrary() {
            localTracks = [];
            localIndex  = 0;
            revokeAllObjectURLs();
            refreshLibraryUI();
            setLocalNowPlayingUI();
            audio.pause();
            audio.src = '';
            return new Promise((resolve, reject) => {
                const r = indexedDB.deleteDatabase(DB_NAME);
                r.onsuccess = () => { showSaved('Playlist Cleared'); resolve(); };
                r.onerror = e  => { showSaved('Failed To Clear', true); reject(e); };
            }).then(() => openDB());
        }
        function savePlaylists() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('playlists', 'readwrite');
                const store = tx.objectStore('playlists');
                store.clear().onsuccess = () => {
                    let pending = playlists.length;
                    if (pending === 0) { tx.oncomplete = resolve; return; }
                    playlists.forEach(pl => {
                        const r = store.put(pl);
                        r.onerror = e => reject(e);
                        if (--pending === 0) tx.oncomplete = resolve;
                    });
                };
                tx.onerror = e => reject(e);
            });
        }
        function loadPlaylists() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('playlists', 'readonly');
                const req = tx.objectStore('playlists').getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror   = e => reject(e);
            });
        }
        function refreshPlaylistsHome() {
            el.playlistGrid.innerHTML = '';
            if (!playlists.length) {
                el.playlistGrid.innerHTML = '<div class="sp-loading-state" style="padding:40px 0">No playlists yet. Create one!</div>';
                return;
            }
            playlists.forEach(pl => {
                const card = document.createElement('div');
                card.className = 'sp-pl-card';
                const art = pl.tracks[0]?.artUrl || FALLBACK_ART;
                card.innerHTML = `
                    <div class="sp-pl-card-art" style="background-image:url('${art.replace(/'/g,"\\'")}')">
                        <button class="sp-pl-card-play-btn" title="Play playlist"><i class="ic ic-play-fill"></i></button>
                    </div>
                    <div class="sp-pl-card-info">
                        <div class="sp-pl-card-name">${esc(pl.name)}</div>
                        <div class="sp-pl-card-count">${pl.tracks.length} track${pl.tracks.length===1?'':'s'}</div>
                    </div>
                `;
                card.querySelector('.sp-pl-card-play-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    if (!pl.tracks.length) { showError('Playlist is empty'); return; }
                    playlistQueue = { plId: pl.id, tracks: pl.tracks.slice(), idx: 0 };
                    playerMode = 'playlist';
                    _loadPlaylistQueueEntry(true);
                    showSaved(`Playing "${pl.name}"`);
                });
                card.onclick = () => openPlaylist(pl.id);
                el.playlistGrid.appendChild(card);
            });
        }
        function openPlaylist(id) {
            openPlaylistId = id;
            const pl = playlists.find(p => p.id === id);
            if (!pl) return;
            el.playlistsHome.style.display = 'none';
            el.playlistDetail.style.display = '';
            el.plName.textContent = pl.name;
            renderPlaylistTracks(pl);
        }
        function renderPlaylistTracks(pl) {
            el.plCount.textContent = `${pl.tracks.length} track${pl.tracks.length===1?'':'s'}`;
            el.plTrackList.innerHTML = '';
            pl.tracks.forEach((t, i) => {
                const li = document.createElement('li');
                li.className = 'sp-playlist-item';
                li.draggable = true;
                li.dataset.idx = i;
                const isCached = t.source === 'stream' && t.streamData
                    ? localTracks.some(lt => lt._sourceStreamId === String(t.streamData.id))
                    : false;
                const sourceIcon = t.source === 'local'
                    ? '<i class="ic ic-hdd" title="Local file"></i>'
                    : isCached
                        ? '<i class="ic ic-cloud-check" title="Cached offline" style="color:#6c6"></i>'
                        : '<i class="ic ic-broadcast" title="Stream only"></i>';
                li.innerHTML = `
                    <span class="sp-li-drag" title="Drag"><i class="ic ic-grip-vertical"></i></span>
                    <img class="sp-li-art" src="${t.artUrl||FALLBACK_ART}" alt="">
                    <span class="sp-li-num">${i+1}</span>
                    <span class="sp-li-title" title="${esc(t.title)}">${esc(t.title)}</span>
                    <span class="sp-li-source" style="font-size:11px;color:#8888aa;margin-left:auto;margin-right:6px">${sourceIcon}</span>
                    <button class="sp-pl-remove-btn" title="Remove"><i class="ic ic-x-circle"></i></button>
                    <span class="sp-li-play"><i class="ic ic-play-fill"></i></span>
                `;
                li.querySelector('.sp-pl-remove-btn').onclick = e => {
                    e.stopPropagation();
                    pl.tracks.splice(i, 1);
                    savePlaylists();
                    renderPlaylistTracks(pl);
                };
                li.addEventListener('click', e => {
                    if (e.target.closest('.sp-pl-remove-btn') || e.target.closest('.sp-li-drag')) return;
                    playPlaylistTrack(pl, i);
                });
                addPlaylistDrag(li, pl);
                el.plTrackList.appendChild(li);
            });
        }
        async function playPlaylistTrack(pl, idx) {
            playlistQueue = { plId: pl.id, tracks: pl.tracks.slice(), idx };
            playerMode = 'playlist';
            await _loadPlaylistQueueEntry(true);
            el.plTrackList.querySelectorAll('.sp-playlist-item').forEach((li,i) => {
                li.classList.toggle('active', i === idx);
            });
        }
        async function _loadPlaylistQueueEntry(autoplay = true) {
            if (!playlistQueue) return;
            const t = playlistQueue.tracks[playlistQueue.idx];
            if (!t) return;
            if (t.source === 'local') {
                const local = localTracks.find(lt => lt.id === t.localId);
                if (local) {
                    currentTrack = null;
                    audio.src = getObjectURL(local);
                    updatePlayerBar(local.title || 'Untitled', local.artist || '', local.artworkDataUrl || FALLBACK_ART, true);
                    updateSidebarMeta(local.title || 'Untitled', local.artist || '', local.artworkDataUrl || FALLBACK_ART);
                    if (autoplay) audio.play().catch(()=>{});
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title:  local.title || 'Untitled',
                            artist: local.artist || '',
                            album:  'Playlist',
                            artwork:[{ src: local.artworkDataUrl || FALLBACK_ART, sizes:'512x512', type:'image/png' }]
                        });
                    }
                    refreshLibraryUI();
                } else { showError('Local file not found in library'); }
            } else {
                const sd = t.streamData;
                if (sd) {
                    const cached = localTracks.find(lt => lt._sourceStreamId === String(sd.id));
                    if (cached) {
                        currentTrack = null;
                        audio.src = getObjectURL(cached);
                        updatePlayerBar(cached.title || t.title, cached.artist || sd.artistName || '', cached.artworkDataUrl || t.artUrl || FALLBACK_ART, true);
                        updateSidebarMeta(cached.title || t.title, cached.artist || sd.artistName || '', cached.artworkDataUrl || t.artUrl || FALLBACK_ART);
                        if (autoplay) audio.play().catch(()=>{});
                    } else {
                        await resolveAndPlay(sd.id, sd.artistName, sd.title, sd.artUrl, sd.artistId, sd.albumId);
                    }
                }
            }
        }
        function nextPlaylistTrack() {
            if (!playlistQueue) return;
            if (playlistQueue.idx < playlistQueue.tracks.length - 1) {
                playlistQueue.idx++;
                _loadPlaylistQueueEntry(true);
            } else if (isLooping) {
                playlistQueue.idx = 0;
                _loadPlaylistQueueEntry(true);
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        }
        function prevPlaylistTrack() {
            if (!playlistQueue) return;
            if (audio.currentTime > PREV_RESTART_THRESHOLD) {
                audio.currentTime = 0;
            } else if (playlistQueue.idx > 0) {
                playlistQueue.idx--;
                _loadPlaylistQueueEntry(true);
            } else if (isLooping) {
                playlistQueue.idx = playlistQueue.tracks.length - 1;
                _loadPlaylistQueueEntry(true);
            } else {
                audio.currentTime = 0;
            }
        }
        let plDragSrc = null;
        function addPlaylistDrag(li, pl) {
            li.addEventListener('dragstart', e => {
                plDragSrc = li;
                li.classList.add('sp-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', li.dataset.idx);
            });
            li.addEventListener('dragend', () => { plDragSrc = null; li.classList.remove('sp-dragging'); });
            li.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
            li.addEventListener('drop', e => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx   = parseInt(li.dataset.idx);
                if (fromIdx === toIdx || isNaN(fromIdx) || isNaN(toIdx)) return;
                const [moved] = pl.tracks.splice(fromIdx, 1);
                pl.tracks.splice(toIdx, 0, moved);
                savePlaylists();
                renderPlaylistTracks(pl);
            });
        }
        function openAddToPlaylistModal(trackObj) {
            pendingAddTrack = trackObj;
            el.plModalList.innerHTML = '';
            if (!playlists.length) {
                el.plModalList.innerHTML = '<div style="color:#8888aa;padding:8px 0">No playlists yet.</div>';
            } else {
                playlists.forEach(pl => {
                    const btn = document.createElement('button');
                    btn.className = 'sp-pl-modal-item button';
                    btn.innerHTML = `<i class="ic ic-music-note-list"></i> ${esc(pl.name)} <span style="color:#8888aa;margin-left:auto">${pl.tracks.length}</span>`;
                    btn.onclick = () => { addTrackToPlaylist(pl.id, pendingAddTrack); closeModal(); };
                    el.plModalList.appendChild(btn);
                });
            }
            el.plModal.style.display = 'flex';
        }
        function closeModal() { el.plModal.style.display = 'none'; pendingAddTrack = null; }
        el.plModalClose.addEventListener('click', closeModal);
        el.plModal.addEventListener('click', e => { if (e.target === el.plModal) closeModal(); });
        el.plModalNew.addEventListener('click', () => {
            closeModal();
            promptCreatePlaylist(pendingAddTrack || null);
        });
        function addTrackToPlaylist(plId, trackObj) {
            const pl = playlists.find(p => p.id === plId);
            if (!pl) return;
            const dup = pl.tracks.find(t =>
                t.source === trackObj.source &&
                (trackObj.source === 'local'
                    ? t.localId === trackObj.localId
                    : t.streamData?.id === trackObj.streamData?.id)
            );
            if (dup) { showSaved('Already in playlist'); return; }
            pl.tracks.push(trackObj);
            savePlaylists();
            showSaved(`Added to "${pl.name}"`);
            if (openPlaylistId === plId) renderPlaylistTracks(pl);
            refreshPlaylistsHome();
            if (trackObj.source === 'stream' && trackObj.streamData) {
                const sd = trackObj.streamData;
                const alreadyCached = localTracks.find(lt => lt._sourceStreamId === String(sd.id));
                if (!alreadyCached) {
                    cacheStreamTrackOffline(sd).catch(()=>{});
                }
            }
        }
        async function cacheStreamTrackOffline(sd) {
            try {
                showSaved('Caching for offline');
                const sc = await resolveSCPermalinks(sd.artistName, sd.title);
                if (!sc?.downloadUrl && !sc?.streamUrl) return;
                const fetchUrl = sc.downloadUrl || sc.streamUrl;
                const res = await fetch(fetchUrl);
                if (!res.ok) return;
                const arrayBuf = await res.arrayBuffer();
                const blob = new Blob([arrayBuf], { type: 'audio/mpeg' });
                let artworkDataUrl = sd.artUrl || FALLBACK_ART;
                if (sd.artUrl && !sd.artUrl.startsWith('data:')) {
                    try {
                        const artRes = await fetch(sd.artUrl);
                        if (artRes.ok) {
                            const artBuf = await artRes.arrayBuffer();
                            const artBlob = new Blob([artBuf], { type: 'image/jpeg' });
                            artworkDataUrl = await new Promise(r => {
                                const fr = new FileReader();
                                fr.onload = () => r(fr.result);
                                fr.onerror = () => r(sd.artUrl);
                                fr.readAsDataURL(artBlob);
                            });
                        }
                    } catch {}
                }
                const id = makeUUID();
                const track = {
                    id, title: sd.title || 'Untitled', artist: sd.artistName || '',
                    blob, artworkDataUrl, position: localTracks.length,
                    _sourceStreamId: String(sd.id)
                };
                localTracks.push(track);
                await saveAll();
                refreshLibraryUI();
                showSaved(`"${sd.title}" cached offline`);
            } catch (e) {
                console.warn('Offline cache failed:', e);
            }
        }
        async function promptCreatePlaylist(trackToAdd = null) {
            const name = await customPrompt('Playlist Name', false, '');
            if (!name?.trim()) return;
            const pl = { id: makeUUID(), name: name.trim(), tracks: [] };
            if (trackToAdd) pl.tracks.push(trackToAdd);
            playlists.push(pl);
            savePlaylists();
            refreshPlaylistsHome();
            showSaved(`Created "${pl.name}"`);
        }
        el.newPlaylistBtn.addEventListener('click', () => promptCreatePlaylist());
        el.plPlayBtn.addEventListener('click', () => {
            const pl = playlists.find(p => p.id === openPlaylistId);
            if (!pl || !pl.tracks.length) return;
            playlistQueue = { plId: pl.id, tracks: pl.tracks.slice(), idx: 0 };
            playerMode = 'playlist';
            _loadPlaylistQueueEntry(true);
            showSaved(`Playing "${pl.name}"`);
        });
        el.plBackBtn.addEventListener('click', () => {
            openPlaylistId = null;
            el.playlistDetail.style.display = 'none';
            el.playlistsHome.style.display = '';
            refreshPlaylistsHome();
        });
        el.plDeleteBtn.addEventListener('click', () => {
            const pl = playlists.find(p => p.id === openPlaylistId);
            if (!pl) return;
            showConfirm(`Delete playlist "${pl.name}"?`, result => {
                if (!result) return;
                playlists = playlists.filter(p => p.id !== openPlaylistId);
                savePlaylists();
                el.plBackBtn.click();
            });
        });
        el.plShuffleBtn.addEventListener('click', () => {
            const pl = playlists.find(p => p.id === openPlaylistId);
            if (!pl) return;
            for (let i = pl.tracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pl.tracks[i], pl.tracks[j]] = [pl.tracks[j], pl.tracks[i]];
            }
            savePlaylists();
            renderPlaylistTracks(pl);
            showSaved('Shuffled');
        });
        el.plDownloadBtn.addEventListener('click', () => downloadPlaylistAsZip(openPlaylistId));
        el.plCacheOfflineBtn && el.plCacheOfflineBtn.addEventListener('click', async () => {
            const pl = playlists.find(p => p.id === openPlaylistId);
            if (!pl) return;
            const streamTracks = pl.tracks.filter(t =>
                t.source === 'stream' && t.streamData &&
                !localTracks.some(lt => lt._sourceStreamId === String(t.streamData.id))
            );
            if (!streamTracks.length) { showSaved('All stream tracks already cached ✓'); return; }
            showSaved(`Caching ${streamTracks.length} track(s)…`);
            let done = 0;
            for (const t of streamTracks) {
                try { await cacheStreamTrackOffline(t.streamData); } catch {}
                done++;
                showSaved(`Cached ${done}/${streamTracks.length}…`);
            }
            showSaved('All tracks cached offline ✓');
            const plNow = playlists.find(p => p.id === openPlaylistId);
            if (plNow) renderPlaylistTracks(plNow);
        });
        el.downloadLibBtn.addEventListener('click', () => downloadLibraryAsZip());
        async function loadJSZip() {
            if (window.JSZip) return window.JSZip;
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                s.onload = () => resolve(window.JSZip);
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        async function downloadLibraryAsZip() {
            if (!localTracks.length) { showError('Library is empty'); return; }
            showSaved('Preparing download…');
            try {
                const JSZip = await loadJSZip();
                const zip = new JSZip();
                for (const t of localTracks) {
                    const buf = await t.blob.arrayBuffer();
                    const ext = t.blob.type.includes('ogg') ? 'ogg' : t.blob.type.includes('wav') ? 'wav' : t.blob.type.includes('flac') ? 'flac' : 'mp3';
                    zip.file(`${sanitizeFilename(t.title||'track')}.${ext}`, buf);
                }
                const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
                triggerDownload(blob, 'My Library.zip');
                showSaved('Download started');
            } catch(e) {
                showSaved('Download failed', true);
                console.error(e);
            }
        }
        async function downloadPlaylistAsZip(plId) {
            const pl = playlists.find(p => p.id === plId);
            if (!pl || !pl.tracks.length) { showError('Playlist is empty'); return; }
            showSaved('Preparing download');
            try {
                const JSZip = await loadJSZip();
                const zip = new JSZip();
                let idx = 1;
                for (const t of pl.tracks) {
                    let buf, ext = 'mp3';
                    if (t.source === 'local') {
                        const local = localTracks.find(lt => lt.id === t.localId);
                        if (!local) continue;
                        buf = await local.blob.arrayBuffer();
                        ext = local.blob.type.includes('ogg') ? 'ogg' : local.blob.type.includes('wav') ? 'wav' : local.blob.type.includes('flac') ? 'flac' : 'mp3';
                    } else {
                        const sd = t.streamData;
                        if (!sd?.downloadUrl) continue;
                        try {
                            const res = await fetch(sd.downloadUrl);
                            if (!res.ok) continue;
                            buf = await res.arrayBuffer();
                        } catch { continue; }
                    }
                    zip.file(`${String(idx).padStart(2,'0')} - ${sanitizeFilename(t.title||'track')}.${ext}`, buf);
                    idx++;
                }
                const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
                triggerDownload(blob, `${sanitizeFilename(pl.name)}.zip`);
                showSaved('Download started');
            } catch(e) {
                showSaved('Download failed', true);
                console.error(e);
            }
        }
        function sanitizeFilename(name) {
            return name.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80);
        }
        function triggerDownload(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
        }
        async function resolveSCPermalinks(artistName, title) {
            const key = `${artistName}||${title}`;
            if (scCache[key]) return scCache[key];
            try {
                const res  = await fetch(`${a}/music/resolve?artist=${encodeURIComponent(artistName)}&title=${encodeURIComponent(title)}`);
                if (!res.ok) return null;
                const data = await res.json();
                scCache[key] = data;
                return data;
            } catch { return null; }
        }
        async function resolveAndPlay(deezerTrackId, artistName, title, artUrl, artistId, albumId) {
            document.querySelectorAll(`[data-track-id="${deezerTrackId}"]`)
                    .forEach(el => el.classList.add('sp-loading'));
            const sc = await resolveSCPermalinks(artistName, title);
            document.querySelectorAll(`[data-track-id="${deezerTrackId}"]`)
                    .forEach(el => el.classList.remove('sp-loading'));
            if (!sc) {
                showError(`Couldn't find "${title}" on SoundCloud`);
                return;
            }
            const track = {
                id: deezerTrackId,
                title, artistName, artistId, albumId,
                artUrl: sc.artUrl || artUrl,
                streamUrl: sc.streamUrl,
                downloadUrl: sc.downloadUrl,
                source: 'hybrid'
            };
            playerMode = 'stream';
            currentTrack = track;
            audio.src = track.streamUrl;
            audio.play();
            updatePlayerBar(track.title, track.artistName, track.artUrl);
            updateSidebarMeta(track.title, track.artistName, track.artUrl);
            syncStreamIcons();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title,
                    artist: track.artistName,
                    artwork:[{ src: track.artUrl, sizes:'512x512', type:'image/jpeg' }]
                });
            }
        }
        async function searchSongs() {
            const query = el.searchInput.value.trim();
            if (!query) return;
            showStreamMain();
            el.results.innerHTML = `<div class="sp-loading-state"><div class="sp-spinner"></div>Searching…</div>`;
            try {
                const res  = await fetch(`${a}/music/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                el.results.innerHTML = '';
                if (!data.data?.length) {
                    el.results.innerHTML = '<div class="sp-loading-state">No results.</div>';
                    return;
                }
                data.data.forEach(t => renderDeezerCard(t, el.results));
            } catch {
                el.results.innerHTML = '<div class="sp-loading-state">Error loading results.</div>';
            }
        }
        function renderDeezerCard(t, container) {
            const card = document.createElement('div');
            card.className = 'sp-song-card' + (currentTrack?.id === t.id ? ' playing' : '');
            card.dataset.trackId = t.id;
            card.innerHTML = `
                <img class="sp-card-cover" src="${t.album.cover_medium}" loading="lazy">
                <div class="sp-card-overlay">
                    <i class="ic ${currentTrack?.id===t.id&&isPlaying?'ic-pause-fill':'ic-play-fill'}"></i>
                </div>
                <div class="sp-card-title">${esc(t.title)}</div>
                <div class="sp-card-album">${esc(t.album.title||'Single')}</div>
                <span class="sp-card-artist">${esc(t.artist.name)}</span>
                <button class="sp-pl-add-btn sp-card-add-btn" title="Add to playlist"><i class="ic ic-plus"></i></button>
            `;
            card.querySelector('.sp-card-add-btn').addEventListener('click', e => {
                e.stopPropagation();
                openAddToPlaylistModal({
                    title: t.title,
                    artUrl: t.album.cover_medium,
                    source: 'stream',
                    streamData: { id: t.id, artistName: t.artist.name, title: t.title, artUrl: t.album.cover_medium, artistId: t.artist.id, albumId: t.album.id }
                });
            });
            card.onclick = () => {
                if (currentTrack?.id === t.id) { togglePlay(); return; }
                resolveAndPlay(t.id, t.artist.name, t.title, t.album.cover_medium, t.artist.id, t.album.id);
            };
            card.querySelector('.sp-card-artist').onclick = e => {
                e.stopPropagation();
                pushDetail(() => renderArtistPage(t.artist.id));
            };
            container.appendChild(card);
        }
        function syncStreamIcons() {
            document.querySelectorAll('.sp-song-card, .sp-stream-track').forEach(el => {
                el.classList.toggle('playing', el.dataset.trackId === String(currentTrack?.id));
            });
            document.querySelectorAll('.sp-song-card').forEach(card => {
                const ov = card.querySelector('.sp-card-overlay i');
                if (!ov) return;
                const active = card.dataset.trackId === String(currentTrack?.id);
                ov.className = (active && isPlaying) ? 'ic ic-pause-fill' : 'ic ic-play-fill';
            });
        }
        function showStreamMain() {
            el.streamMain.style.display = '';
            el.detailPage.style.display = 'none';
            el.detailPage.innerHTML = '';
            streamNavStack = [];
        }
        function pushDetail(renderFn) {
            streamNavStack.push(renderFn);
            el.streamMain.style.display = 'none';
            el.detailPage.style.display = '';
            renderFn();
        }
        function goBack() {
            streamNavStack.pop();
            if (streamNavStack.length === 0) showStreamMain();
            else { const prev = streamNavStack[streamNavStack.length-1]; streamNavStack.pop(); pushDetail(prev); }
        }
        async function renderArtistPage(id) {
            const page = el.detailPage;
            page.innerHTML = `<div class="sp-loading-state"><div class="sp-spinner"></div>Loading Artist</div>`;
            try {
                const [aRes, albRes, trRes] = await Promise.all([
                    fetch(`${a}/music/artist/${id}`),
                    fetch(`${a}/music/artist/${id}/albums`),
                    fetch(`${a}/music/artist/${id}/top`)
                ]);
                const artist = await aRes.json();
                const albums = await albRes.json();
                const tracks = await trRes.json();
                page.innerHTML = `
                    <button class="button sp-back-btn" onclick="goBack()">
                        <i class="ic ic-arrow-left"></i> Back
                    </button>
                    <div class="sp-detail-hero">
                        <img class="sp-detail-banner" src="${artist.picture_xl||artist.picture_big}" loading="lazy">
                        <div class="sp-detail-overlay">
                            <img class="sp-detail-avatar" src="${artist.picture_big}" loading="lazy">
                            <div class="sp-detail-info">
                                <h2 class="btxt">${esc(artist.name)}</h2>
                                <p style="color:#8888aa;font-size:14px">${(artist.nb_fan||0).toLocaleString()} Followers</p>
                            </div>
                        </div>
                    </div>
                    <h3 class="sp-section-title">Popular</h3>
                    <div id="spArtistTracks" class="btxt"></div>
                    <h3 class="sp-section-title">Albums</h3>
                    <div class="sp-album-grid" id="spArtistAlbums"></div>
                `;
                const tList = document.getElementById('spArtistTracks');
                (tracks.data||[]).forEach((t,i) => {
                    const div = document.createElement('div');
                    div.className = 'sp-stream-track' + (currentTrack?.id===t.id?' playing':'');
                    div.dataset.trackId = t.id;
                    div.innerHTML = `<span class="sp-li-num">${i+1}</span><span>${esc(t.title)}</span><button class="sp-pl-add-btn" style="margin-left:auto" title="Add to playlist"><i class="ic ic-plus"></i></button>`;
                    div.onclick = () => resolveAndPlay(t.id, artist.name, t.title, t.album?.cover_medium, id, t.album?.id);
                    div.querySelector('.sp-pl-add-btn').addEventListener('click', e => {
                        e.stopPropagation();
                        openAddToPlaylistModal({ title: t.title, artUrl: t.album?.cover_medium||FALLBACK_ART, source: 'stream', streamData: { id: t.id, artistName: artist.name, title: t.title, artUrl: t.album?.cover_medium||FALLBACK_ART, artistId: id, albumId: t.album?.id } });
                    });
                    tList.appendChild(div);
                });
                const aGrid = document.getElementById('spArtistAlbums');
                (albums.data||[]).slice(0,12).forEach(album => {
                    const div = document.createElement('div');
                    div.className = 'sp-album-card';
                    div.innerHTML = `
                        <img src="${album.cover_medium}" loading="lazy">
                        <div class="sp-album-title">${esc(album.title)}</div>
                        <div style="font-size:12px;color:#8888aa">${album.release_date?.slice(0,4)||''}</div>
                    `;
                    div.onclick = () => pushDetail(() => renderAlbumPage(album.id));
                    aGrid.appendChild(div);
                });
            } catch {
                page.innerHTML = '<div class="sp-loading-state">Error loading artist.</div>';
            }
        }
        async function renderAlbumPage(id) {
            const page = el.detailPage;
            page.innerHTML = `<div class="sp-loading-state"><div class="sp-spinner"></div>Loading Album</div>`;
            try {
                const res = await fetch(`${a}/music/album/${id}`);
                const album = await res.json();
                page.innerHTML = `
                    <button class="button sp-back-btn" onclick="goBack()">
                        <i class="ic ic-arrow-left"></i> Back
                    </button>
                    <div class="sp-detail-hero">
                        <img class="sp-detail-banner" src="${album.cover_xl||album.cover_big}" loading="lazy">
                        <div class="sp-detail-overlay">
                            <img class="sp-detail-avatar" style="border-radius:12px" src="${album.cover_big}" loading="lazy">
                            <div class="sp-detail-info">
                                <h2 class="btxt">${esc(album.title)}</h2>
                                <p style="cursor:pointer;color:var(--accent,#108028)" onclick="pushDetail(()=>renderArtistPage(${album.artist.id}))">${esc(album.artist.name)}</p>
                                <p style="color:#8888aa;font-size:13px">${album.nb_tracks} Songs</p>
                            </div>
                        </div>
                    </div>
                    <h3 class="sp-section-title btxt">Tracks</h3>
                    <div id="spAlbumTracks" class="btxt"></div>
                `;
                const list = document.getElementById('spAlbumTracks');
                (album.tracks?.data||[]).forEach((t,i) => {
                    const div = document.createElement('div');
                    div.className = 'sp-stream-track' + (currentTrack?.id===t.id?' playing':'');
                    div.dataset.trackId = t.id;
                    div.innerHTML = `<span class="sp-li-num">${i+1}</span><span>${esc(t.title)}</span><button class="sp-pl-add-btn" style="margin-left:auto" title="Add to playlist"><i class="ic ic-plus"></i></button>`;
                    div.onclick = () => resolveAndPlay(t.id, album.artist.name, t.title, album.cover_medium, album.artist.id, id);
                    div.querySelector('.sp-pl-add-btn').addEventListener('click', e => {
                        e.stopPropagation();
                        openAddToPlaylistModal({ title: t.title, artUrl: album.cover_medium||FALLBACK_ART, source: 'stream', streamData: { id: t.id, artistName: album.artist.name, title: t.title, artUrl: album.cover_medium||FALLBACK_ART, artistId: album.artist.id, albumId: id } });
                    });
                    list.appendChild(div);
                });
            } catch {
                page.innerHTML = '<div class="sp-loading-state">Error loading album.</div>';
            }
        }
        window.goBack = goBack;
        window.pushDetail = pushDetail;
        window.renderArtistPage = renderArtistPage;
        window.renderAlbumPage = renderAlbumPage;
        window.searchSongs = searchSongs;
        window.togglePlay = togglePlay;
        function updatePlayerBar(title, artist, artUrl, hideDownload = false) {
            el.playerTitle.textContent  = title  || 'No Track Selected';
            el.playerArtist.textContent = artist || '—';
            el.playerThumb.innerHTML    = artUrl
                ? `<img src="${artUrl}" alt="">`
                : `<i class="ic ic-music"></i>`;
            $('spPlayer').classList.add('visible');
            el.downloadBtn.style.display = hideDownload ? 'none' : '';
        }
        function updateSidebarMeta(title, artist, artUrl) {
            el.sideTitle.textContent = title  || 'Nothing Playing';
            el.sideArtist.textContent = artist || '-';
            el.sideArtImg.src = artUrl || FALLBACK_ART;
        }
        function syncPlayIcon() {
            el.playIcon.className = isPlaying ? 'ic ic-pause-fill' : 'ic ic-play-fill';
            if (playerMode === 'stream') syncStreamIcons();
        }
        function togglePlay() {
            if (!audio.src) return;
            isPlaying ? audio.pause() : audio.play();
        }
        audio.addEventListener('play',  () => { isPlaying = true;  syncPlayIcon(); });
        audio.addEventListener('pause', () => { isPlaying = false; syncPlayIcon(); });
        audio.addEventListener('timeupdate', () => {
            const cur = audio.currentTime || 0;
            const dur = isFinite(audio.duration) ? (audio.duration || 0) : 0;
            el.seekBar.value = dur ? Math.round(cur / dur * 1000) : 0;
            el.timeCur.textContent = fmtTime(cur);
            el.timeDur.textContent = fmtTime(dur);
        });
        audio.addEventListener('loadedmetadata', () => {
            el.timeDur.textContent = fmtTime(audio.duration || 0);
        });
        audio.addEventListener('ended', () => {
            if (playerMode === 'playlist') {
                nextPlaylistTrack();
            } else if (playerMode === 'local') {
                nextLocalTrack();
            } else {
                if (isLooping) { audio.currentTime = 0; audio.play(); }
                else { isPlaying = false; syncPlayIcon(); }
            }
        });
        el.seekBar.addEventListener('input', () => {
            const dur = audio.duration || 0;
            audio.currentTime = el.seekBar.value / 1000 * dur;
        });
        el.volBar.addEventListener('input', () => {
            audio.volume = el.volBar.value / 100;
            el.volBar.style.setProperty('--pct', el.volBar.value + '%');
        });
        el.playBtn.addEventListener('click', togglePlay);
        el.nextBtn.addEventListener('click', () => {
            if (playerMode === 'playlist') nextPlaylistTrack();
            else if (playerMode === 'local') nextLocalTrack();
        });
        el.prevBtn.addEventListener('click', () => {
            if (playerMode === 'playlist') prevPlaylistTrack();
            else if (playerMode === 'local') prevLocalTrack();
        });
        el.loopBtn.addEventListener('click', () => {
            isLooping = !isLooping;
            audio.loop = isLooping && playerMode === 'stream';
            el.loopBtn.classList.toggle('sp-ctrl-active', isLooping);
            if (playerMode === 'local') saveAll();
        });
        el.downloadBtn.addEventListener('click', () => {
            if (currentTrack?.downloadUrl) window.open(currentTrack.downloadUrl, '_blank');
        });
        el.playerArtist.addEventListener('click', () => {
            if (currentTrack?.artistId && playerMode === 'stream') {
                switchTab('streaming');
                pushDetail(() => renderArtistPage(currentTrack.artistId));
            }
        });
        document.addEventListener('keydown', e => {
            if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
                e.preventDefault();
                togglePlay();
            }
        });
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', async () => { await audio.play().catch(()=>{}); });
            navigator.mediaSession.setActionHandler('pause', () => audio.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => { if (playerMode==='playlist') prevPlaylistTrack(); else if (playerMode==='local') prevLocalTrack(); });
            navigator.mediaSession.setActionHandler('nexttrack', () => { if (playerMode==='playlist') nextPlaylistTrack(); else if (playerMode==='local') nextLocalTrack(); });
            navigator.mediaSession.setActionHandler('seekto', details => {
                audio.currentTime = details.seekTime ?? audio.currentTime;
            });
        }
         function switchTab(tab) {
            ['streaming','library','playlists'].forEach(t => {
                $('tab'+(t.charAt(0).toUpperCase()+t.slice(1))).style.display = t === tab ? '' : 'none';
                const navEl = $('nav'+(t.charAt(0).toUpperCase()+t.slice(1)));
                if (navEl) navEl.classList.toggle('active', t === tab);
            });
            if (tab === 'playlists') refreshPlaylistsHome();
        }
        document.querySelectorAll('.sp-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        el.fileInput.addEventListener('change', async e => {
            const files = Array.from(e.target.files||[]).filter(f => f.type.startsWith('audio/'));
            if (!files.length) return;
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const tags = await extractID3Tags(f);
                const blob = new Blob([await f.arrayBuffer()], { type: f.type || 'audio/mpeg' });
                const title = tags.title  || stripExt(f.name);
                const artist = tags.artist || '';
                const art = tags.artworkDataUrl;
                localTracks.push({ id: makeUUID(), title, artist, blob, artworkDataUrl: art, position: localTracks.length });
            }
            refreshLibraryUI();
            if (localTracks.length === files.length) localIndex = 0;
            loadLocalTrack(false);
            await saveAll();
            e.target.value = '';
            switchTab('library');
        });
        el.clearBtn.addEventListener('click', () => {
            showConfirm('Clear your entire library?', result => {
                if (result) clearLibrary();
                else showSuccess('Cancelled');
            });
        });
        el.searchBtn.addEventListener('click', searchSongs);
        el.searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchSongs(); });
        (async function init() {
            await openDB();
            const data = await loadAll();
            localTracks  = (data.tracks||[]).map((t,i)=>({
                ...t, position: Number.isFinite(t.position) ? t.position : i
            }));
            localIndex = Math.min(Math.max(0, data.currentIndex||0), Math.max(0, localTracks.length-1));
            isLooping = !!data.isLooping;
            isLoadedFromDB = localTracks.length > 0;
            playlists = await loadPlaylists();
            refreshLibraryUI();
            el.loopBtn.classList.toggle('sp-ctrl-active', isLooping);
            if (localTracks.length > 0) {
                loadLocalTrack(false);
            }
            if (listenParams && !playerParams) {
                switchTab('streaming');
            } else if (localTracks.length > 0) {
                switchTab('library');
            } else {
                switchTab('streaming');
            }
            el.searchInput.value = 'trending';
            searchSongs();
        })();
        window.addEventListener('beforeunload', revokeAllObjectURLs);
    }
} else if (x3tfypage == '/InfiniteArchives.html') {
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
} else if (x3tfypage == '/InfiniteEmbeds.html') {
    const choice = x3tfyparams.get("choice");
    const iframe = document.getElementById('embFrame');
    const tptxt = document.getElementById('rpbgtxt');
    const hr = document.getElementById('rphr');
    if (choice == 2) {
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
}