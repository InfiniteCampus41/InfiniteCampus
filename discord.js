import { auth, db, onAuthStateChanged, ref, get } from "./imports.js";
const backendUrl = `${a}`;
const apiMessagesUrl = `${backendUrl}/api/messages`;
const widgetUrl = 'https://discord.com/api/guilds/1002698920809463808/widget.json';
let widgetData = null;
let displayedMessageIds = new Set();
let currentChannelId = getSelectedChannelId();
let currentChannelToken = Symbol();
let currentReactMessageId = null;
let currentUser = null;
let hasRoleAccess = false;
let hasAdminPassword = false;
let userRoles = {};
let isOwner = false;
let isTester = false;
let isCoOwner = false;
let isHeadAdmin = false;
let isDev = false;
const requestQueue = [];
let isProcessingQueue = false;
const RATE_LIMIT_DELAY = 3000;
const messageCache = new Map();
const MESSAGE_CACHE_TTL = 10_000;
const nameInput = document.getElementById('nameInput');
const urlParams = new URLSearchParams(window.location.search);
const channelParams = urlParams.get('channel');
if (channelParams) {
    document.getElementById('channelSelector').value = channelParams; 
}
const CHANNELS = [
    { id: "1309160050904006696", name: "General", requiresAdmin: false },
    { id: "1460410323369721868", name: "Site Logs", requiresAdmin: true },
    { id: "1334585912088330311", name: "Mod Chat", requiresAdmin: true },
    { id: "1395540104042250250", name: "Stuff", requiresAdmin: true },
    { id: "1389738046739452015", name: "Github Chat", requiresAdmin: true },
    { id: "1334376148087603294", name: "Rules", requiresAdmin: false },
    { id: "1334376903179767860", name: "Information", requiresAdmin: false },
    { id: "1334377094876237918", name: "Announcements", requiresAdmin: false },
    { id: "1334377158789042226", name: "Suggestions", requiresAdmin: false },
    { id: "1464689808717774970", name: "Request Movies", requiresAdmin: false },
    { id: "1334377258609147967", name: "Events", requiresAdmin: false },
    { id: "1389334335114580229", name: "Website Support", requiresAdmin: false },
    { id: "1389703415810101308", name: "Site Updates", requiresAdmin: false },
    { id: "1309164699417448550", name: "Memes", requiresAdmin: false },
    { id: "1007051892821594183", name: "Advertisements", requiresAdmin: false },
    { id: "1086362556203028540", name: "Gaming", requiresAdmin: false },
    { id: "1334945403912720586", name: "Report A Bug", requiresAdmin: false },
    { id: "1390991482650886215", name: "Bot Commands", requiresAdmin: false }
];
let ADMIN_PASS = localStorage.getItem("a_pass") || null;
async function adminFetch(url, options = {}) {
    options.headers = Object.assign({}, options.headers, {
        "x-admin-password": ADMIN_PASS,
        "ngrok-skip-browser-warning": "true"
    });
    return fetch(url, options);
}
async function checkAdminPasswordSilently() {
    hasAdminPassword = false;
    if (!ADMIN_PASS) return;
    try {
        const res = await fetch(backendUrl + "/check_pass", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({ password: ADMIN_PASS })
        });
        const data = await res.json().catch(() => null);
        if (data && (data.res || data.ok)) {
            hasAdminPassword = true;
        }
    } catch (e) {
        console.error(e);
    }
}
function populateChannelSelector() {
    const selector = document.getElementById("channelSelector");
    selector.innerHTML = "";
    const isFullyAuthorized = currentUser && (hasRoleAccess || hasAdminPassword);
    CHANNELS.forEach(channel => {
        if (channel.requiresAdmin && !isFullyAuthorized) return;
        const option = document.createElement("option");
        option.value = channel.id;
        option.textContent = `# ${channel.name}`;
        selector.appendChild(option);
    });
    if (selector.options.length > 0) {
        currentChannelId = selector.value;
    }
}
function renderAdminPasswordForm() {
    const existing = document.getElementById("adminPassContainer");
    if (existing) existing.remove();
    const canSeeForm = currentUser && (
        isOwner || isTester || isCoOwner || isHeadAdmin || isDev
    );
    if (!canSeeForm) return;
    const container = document.createElement("div");
    container.id = "adminPassContainer";
    container.style.marginBottom = "15px";
    container.innerHTML = `
        <form id="adminPassForm" style="gap:10px;align-items:center;">
            <input type="password" id="adminPassInput" class="button" placeholder="Enter Admin Password">
            <button type="submit" class="button">
                Submit
            </button>
        </form>
        <span id="adminPassStatus" style="font-size:12px;"></span>
    `;
    const chatContainer = document.getElementById("messages").parentElement;
    chatContainer.prepend(container);
    document.getElementById("adminPassForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const pass = document.getElementById("adminPassInput").value.trim();
        if (!pass) return;
        try {
            const res = await fetch(backendUrl + "/check_pass", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ password: pass })
            });
            const data = await res.json().catch(() => null);
            if (data && (data.res || data.ok)) {
                ADMIN_PASS = pass;
                localStorage.setItem("a_pass", pass);
                hasAdminPassword = true;
                document.getElementById("adminPassStatus").textContent = "Password Accepted";
                document.getElementById("adminPassStatus").style.color = "lime";
                populateChannelSelector();
            } else {
                document.getElementById("adminPassStatus").textContent = "Invalid Password";
                document.getElementById("adminPassStatus").style.color = "red";
            }
        } catch (err) {
            console.error(err);
        }
    });
}
onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;
    const nameInput = document.getElementById("nameInput");
    if (user) {
        try {
            const displayNameRef = ref(db, `users/${user.uid}/profile/displayName`);
            const snapshot = await get(displayNameRef);
            let finalName = "";
            if (snapshot.exists()) {
                finalName = snapshot.val();
            } else if (user.displayName) {
                finalName = user.displayName;
            } else {
                finalName = user.email || "User";
            }
            nameInput.value = finalName;
            nameInput.disabled = true;
            nameInput.style.opacity = "0.7";
            nameInput.style.cursor = "not-allowed";
        } catch (error) {
            console.error("Error Fetching Display Name:", error);
        }
        try {
            const rolesRef = ref(db, `users/${user.uid}/profile`);
            const roleSnap = await get(rolesRef);
            if (roleSnap.exists()) {
                const data = roleSnap.val();
                userRoles = data || {};
                isOwner = data.isOwner === true;
                isTester = data.isTester === true;
                isCoOwner = data.isCoOwner === true;
                isHeadAdmin = data.isHeadAdmin === true;
                isDev = data.isDev === true;
                hasRoleAccess = isOwner || isTester || isCoOwner || isHeadAdmin || isDev;
            }
        } catch (err) {
            console.error("Error Fetching Roles:", err);
        }
    } else {
        nameInput.disabled = false;
        nameInput.style.opacity = "1";
        nameInput.style.cursor = "text";
        nameInput.value = "";
    }
    await checkAdminPasswordSilently?.();
    populateChannelSelector?.();
    renderAdminPasswordForm();
});
async function processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) return;
    isProcessingQueue = true;
    while (requestQueue.length > 0) {
        const fn = requestQueue.shift();
        try { await fn(); } catch(err){ console.error(err); }
        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
    }
    isProcessingQueue = false;
}
function enqueueRequest(fn){ requestQueue.push(fn); processQueue(); }
async function fetchWidget() {
    try { widgetData = await (await fetch(widgetUrl)).json(); } catch { widgetData = null; }
}
fetchWidget();
setInterval(fetchWidget, 30000);
function getSelectedChannelId(){ 
    return document.getElementById('channelSelector').value; 
}
function getStatusImage(status){
    switch(status){
        case 'online': return '/res/online.png';
        case 'idle': return '/res/idle.png';
        case 'dnd': return '/res/dnd.png';
        default: return '/res/offline.png';
    }
}
function getStatusTitle(status){
    switch(status){
        case 'online': return 'Online';
        case 'idle': return 'Idle';
        case 'dnd': return 'Do Not Disturb';
        default: return 'Offline';
    }
}
function getStatusFromWidget(globalName){
    if(globalName==='Dad Bot') return 'online';
    if(!widgetData?.members) return 'offline';
    const member = widgetData.members.find(m=>m.username===globalName||m.nick===globalName);
    return member?.status||'offline';
}
function renderTempMessage(content, type='text'){
    const list = document.getElementById('messages');
    const li = document.createElement('li');
    li.classList.add('temp-message');
    li.textContent = type==='text'?`Sending: ${content}...`:`Uploading: ${content}...`;
    list.prepend(li);
    return li;
}
function getChannelCache(channelId) {
    if (!messageCache.has(channelId)) {
        messageCache.set(channelId, {
            messages: new Map(),
            lastFetch: 0
        });
    }
    return messageCache.get(channelId);
}
function parseDiscordMarkdown(text){
    if(!text) return "";
    let html = text
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/```([\s\S]*?)```/g,
        '<pre class="codeblock">$1</pre>'
    )
    .replace(/`([^`]+)`/g,
        '<code>$1</code>'
    )
    .replace(/^### (.*$)/gim,'<h3>$1</h3>')
    .replace(/^## (.*$)/gim,'<h2>$1</h2>')
    .replace(/^# (.*$)/gim,'<h1>$1</h1>')
    .replace(/^-# (.*$)/gim,
        '<span style="font-size:12px;color:#aaa">$1</span>'
    )
    .replace(/^>>> ([\s\S]*)/gim,
        '<blockquote>$1</blockquote>'
    )
    .replace(/^> (.*$)/gim,
        '<blockquote>$1</blockquote>'
    )
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/__(.*?)__/g,'<u>$1</u>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/~~(.*?)~~/g,'<s>$1</s>')
    .replace(/\|\|(.*?)\|\|/g,
        '<span class="spoiler" onclick="this.classList.toggle(\'reveal\')">$1</span>'
    )
    .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank">$1</a>'
    )
    .replace(/\n/g,"<br>");
    return html;
}
function generateEmbeds(text){
    if(!text) return "";
    let embedHTML = "";
    const urls = text.match(/https?:\/\/[^\s]+/g);
    if(!urls) return "";
    urls.forEach(url=>{
        const yt = url.match(
            /(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
        );
        if(yt){
            embedHTML += `
            <div class="embed">
                <iframe
                width="350"
                height="200"
                src="https://www.youtube.com/embed/${yt[2]}"
                frameborder="0"
                allowfullscreen>
                </iframe>
            </div>
            `;
            return;
        }
        if(/\.(png|jpg|jpeg|gif|webp)$/i.test(url)){
            embedHTML += `
            <div class="embed">
                <img src="${url}" style="max-width:350px;border-radius:6px;">
            </div>
            `;
            return;
        }
    });
    return embedHTML;
}
function formatDiscordTimestamp(ts) {
    const date = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today - messageDay) / (1000 * 60 * 60 * 24));
    const timeString = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    if (diffDays === 0) {
        return timeString;
    }
    if (diffDays === 1) {
        return `Yesterday at ${timeString}`;
    }
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
async function renderMessage(msg, list){
    if(displayedMessageIds.has(msg.id)) return updateReactions(msg);
    const li = document.createElement('li');
    list.prepend(li);
    const avatarImg = document.createElement('img');
    avatarImg.classList.add('avatar');
    avatarImg.src = msg.author.avatar ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png` : `/res/discord.png`;
    li.appendChild(avatarImg);
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    li.appendChild(contentDiv);
    const serverTag = msg.author.clan?.tag || '';
    const displayName = msg.author.global_name || msg.author.username;
    const statusColor = getStatusFromWidget(displayName);
    const statusTitle = getStatusTitle(statusColor);
    const timestamp = formatDiscordTimestamp(msg.timestamp);
    let contentWithMentions = msg.content || '';
    if(msg.mentions?.length){
        msg.mentions.forEach(u=>{
            const name = u.global_name || u.username;
            contentWithMentions = contentWithMentions.replace(new RegExp(`<@!?${u.id}>`,'g'),`@${name}`);
        });
    }
    let replyHTML = '';
    if(msg.referenced_message){
        const replyAuthor = msg.referenced_message.author;
        const replyDisplayName = replyAuthor.global_name || replyAuthor.username;
        const replyContent = msg.referenced_message.content || 'Attachment';
        replyHTML = `<div class="reply-box" 
                        style="font-size:90%; color:grey; margin:2px 0;">
                        | Replying To <strong>${replyDisplayName}</strong>: ${replyContent}
                     </div>`;
    }
    let contentHTML = `
        <strong>${displayName}</strong>
        <span style="margin-left:5px;color:#888;${serverTag?'border:1px solid white;border-radius:5px;padding:0 4px;':''}">${serverTag}</span>
        <img src="${getStatusImage(statusColor)}" title="${statusTitle}" style="width:16px;height:16px;margin-left:5px;vertical-align:middle;">
        ${replyHTML}
        <div>
            ${parseDiscordMarkdown(contentWithMentions)}
            ${generateEmbeds(contentWithMentions)}
        </div>    
    `;
    if(msg.attachments?.length){
        msg.attachments.forEach(att=>{
            const url = att.url, name = att.filename.toLowerCase();
            if(/\.(png|jpg|jpeg|gif|webp)$/.test(name)) contentHTML += `<br><img src="${url}" style="max-width:50vw;">`;
            else contentHTML += `<br><video style="max-height:300px; height:fit-content; max-width:50vw;" src="${url}" controls>${att.filename}</video>`;
        });
    }
    if(msg.reactions?.length){
        contentHTML += `<div class="reactions" style="margin-top:5px;">`;
        msg.reactions.forEach(r=>{
            contentHTML += `<span class="reaction-btn" data-id="${msg.id}" data-emoji="${r.emoji.name}">${r.emoji.name} ${r.count}</span>`;
        });
        contentHTML += `</div>`;
    }
    contentHTML += `<div class="timestamp">${timestamp}</div>
                    <br><span class="reaction-trigger" data-id="${msg.id}"></span>`;
    contentDiv.innerHTML = contentHTML;
    displayedMessageIds.add(msg.id);
}
function updateReactions(msg){
    const li = document.querySelector(`.reaction-trigger[data-id="${msg.id}"]`)?.closest('li');
    if(!li) return;
    let reactionsHTML = '';
    if(msg.reactions?.length){
        reactionsHTML = `<div class="reactions" style="margin-top:5px;">`;
        msg.reactions.forEach(r => {
            reactionsHTML += `<span class="reaction-btn" data-id="${msg.id}" data-emoji="${r.emoji.name}">${r.emoji.name} ${r.count}</span>`;
        });
        reactionsHTML += `</div>`;
    }
    const oldReactions = li.querySelector('.reactions');
    if(oldReactions) oldReactions.replaceWith(new DOMParser().parseFromString(reactionsHTML,'text/html').body.firstChild);
    else li.querySelector('.content').insertAdjacentHTML('beforeend', reactionsHTML);
}
async function fetchMessages(token = currentChannelToken) {
    let channelId = currentChannelId;
    if (channelParams) {
        channelId = channelParams;
    }
    const messagesList = document.getElementById('messages');
    const cache = getChannelCache(channelId);
    if (Date.now() - cache.lastFetch < MESSAGE_CACHE_TTL) {
        const sortedCached = Array.from(cache.messages.values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (const msg of sortedCached) {
            if (token !== currentChannelToken) return;
            await renderMessage(msg, messagesList);
        }
        return;
    }
    try {
        const res = await adminFetch(`${apiMessagesUrl}?channelId=${channelId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (!res.ok) {
            let errorText = '';
            try {
                const errJson = await res.json();
                errorText = errJson?.error || '';
            } catch {}
            if (errorText === 'Discord integration disabled') {
                throw new Error('DISCORD_LOCKDOWN');
            }
            throw new Error('Backend Unreachable');
        }
        const data = await res.json();
        for (const msg of data) {
            cache.messages.set(msg.id, msg);
        }
        cache.lastFetch = Date.now();
        const sorted = Array.from(cache.messages.values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (const msg of sorted) {
            if (token !== currentChannelToken) return;
            await renderMessage(msg, messagesList);
        }
    } catch (err) {
        console.error(err);
        messagesList.innerHTML = '';
        const li = document.createElement('li');
        li.style.color = 'red';
        li.style.fontWeight = 'bold';
        li.textContent =
            err.message === 'DISCORD_LOCKDOWN'
                ? 'Live Discord Chat Is Currently Locked Down'
                : 'Live Discord Chat Is Currently Down, Please Come Back Later';
        messagesList.appendChild(li);
    }
}
setInterval(()=>enqueueRequest(()=>fetchMessages(currentChannelToken)),5000);
document.getElementById('channelSelector').addEventListener('change', () => {
    currentChannelId = getSelectedChannelId();
    currentChannelToken = Symbol();
    displayedMessageIds.clear();
    document.getElementById('messages').innerHTML = '';
    const cache = getChannelCache(currentChannelId);
    cache.lastFetch = 0;
    enqueueRequest(() => fetchMessages(currentChannelToken));
});
document.getElementById('sendForm').addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('nameInput').value.trim();
    const message = document.getElementById('msgInput').value.trim();
    if(!name || !message) return;
    const tempLi = renderTempMessage(`${name}: ${message}`);
    document.getElementById('msgInput').value='';
    adminFetch(`${backendUrl}/send`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:`${name}: ${message}`, channelId:currentChannelId})
    }).then(()=>tempLi.remove())
      .catch(err=>{ tempLi.remove(); console.error(err); });
});
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileLabel = document.getElementById('fileLabel');
fileInput.addEventListener('change',()=>{ 
    fileLabel.textContent = fileInput.files.length>0 ? fileInput.files[0].name : 'Select A File'; 
});
const presenceCountEl = document.getElementById("presenceCount");
async function fetchDiscordPresence() {
    presenceCountEl.textContent = "Loading Presence Count...";
    try {
        const response = await fetch(m);
        if (!response.ok) {
            throw new Error("Error: Failed To Fetch Data: " + response.status);
        }
        const data = await response.json();
        if (Array.isArray(data.members) && data.members.length > 0) {
            const filteredMembers = data.members.filter(
                (member) => !o.includes(member.username)
            );
            presenceCountEl.textContent = `Online Members: ${filteredMembers.length}`;
        } else {
            presenceCountEl.textContent = "No Members Online.";
        }
    } catch (error) {
        presenceCountEl.textContent = "Error: Error Fetching Presence Count.";
        console.error(error);
    }
}
fetchDiscordPresence();
setInterval(fetchDiscordPresence, 10000);
uploadForm.addEventListener('submit', e=>{
    e.preventDefault();
    if(!fileInput.files.length) return showError('No File Selected');
    const tempLi = renderTempMessage(fileInput.files[0].name, 'file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('channelId', currentChannelId);
    adminFetch(`${backendUrl}/upload`, {
        method:'POST',
        body:formData
    }).then(res=>{
        tempLi.remove();
        if(!res.ok) res.text().then(text=>showError('Upload Failed:'+text));
        fileInput.value=''; fileLabel.textContent='Select A File';
    }).catch(err=>{ tempLi.remove(); console.error(err); });
});
enqueueRequest(()=>fetchMessages(currentChannelToken));