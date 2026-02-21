import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
const backendUrl = `${a}`;
const apiMessagesUrl = `${backendUrl}/api/messages`;
const widgetUrl = 'https://discord.com/api/guilds/1002698920809463808/widget.json';
let widgetData = null;
let displayedMessageIds = new Set();
let currentChannelId = getSelectedChannelId();
let currentChannelToken = Symbol();
let currentReactMessageId = null;
let ADMIN_PASS = localStorage.getItem("a_pass") || null;
async function checkPermissions() {
    if (!isAuthInitialized) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (isAuthInitialized) {
                    clearInterval(interval);
                    resolve(checkPermissions());
                }
            }, 100);
        });
    }
    if (!currentUser) {
        showError("You Must Be Logged In To Access This Page.");
        return false;
    }
    const uid = currentUser.uid;
    const userRef = ref(db, `users/${uid}/profile`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
        showError("Profile Data Not Found.");
        return false;
    }
    const userData = snapshot.val();
    const { isOwner, isTester, isCoOwner, isDev } = userData;
    if (isOwner || isTester || isCoOwner || isDev ) {
        return true;
    } else {
        showError("You Do Not Have The Necessary Permissions To Access This Page.");
        return false;
    }
}
async function verifyAdminPassword() {
    while (true) {
        if (ADMIN_PASS) {
            try {
                const res = await fetch(BACKEND + "/check_pass", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify({ password: ADMIN_PASS })
                });
                const data = await res.json().catch(() => null);
                if (data && data.res || data.ok) {
                    return true;
                }
            } catch (e) {}
            localStorage.removeItem("a_pass");
            ADMIN_PASS = null;
        }
        const entered = prompt("Enter Admin Password:");
        if (!entered) continue;
        ADMIN_PASS = entered.trim();
        try {
            const res = await fetch(BACKEND + "/check_pass", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ password: ADMIN_PASS })
            });
            const data = await res.json().catch(() => null);
            if (data && data.res || data.ok) {
                localStorage.setItem("a_pass", ADMIN_PASS);
                return true;
            }
        } catch (e) {}
        showError("Incorrect Password.");
        ADMIN_PASS = null;
    }
}
async function adminFetch(url, options = {}) {
    options.headers = Object.assign({}, options.headers, {
        "x-admin-password": ADMIN_PASS,
        "ngrok-skip-browser-warning": "true"
    });
    return fetch(url, options);
}
const requestQueue = [];
let isProcessingQueue = false;
const RATE_LIMIT_DELAY = 3000;
const messageCache = new Map();
const MESSAGE_CACHE_TTL = 10_000;
const nameInput = document.getElementById('nameInput');
onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
        const displayNameRef = ref(db, `users/${user.uid}/profile/displayName`);
        const snapshot = await get(displayNameRef);
        if (snapshot.exists()) {
            nameInput.value = snapshot.val();
        } else {
            if (user.displayName) {
                nameInput.value = user.displayName;
            }
        }
    } catch (error) {
        console.error("Error Fetching Display Name:", error);
    }
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
function getSelectedChannelId(){ return document.getElementById('channelSelector').value; }
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
async function renderMessage(msg, list){
    if(displayedMessageIds.has(msg.id)) return updateReactions(msg);
    const li = document.createElement('li');
    list.prepend(li);
    const avatarImg = document.createElement('img');
    avatarImg.classList.add('avatar');
    avatarImg.src = msg.author.avatar
        ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
        : `/res/default.png`;
    li.appendChild(avatarImg);
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    li.appendChild(contentDiv);
    const serverTag = msg.author.clan?.tag || '';
    const displayName = msg.author.global_name || msg.author.username;
    const statusColor = getStatusFromWidget(displayName);
    const statusTitle = getStatusTitle(statusColor);
    const timestamp = new Date(msg.timestamp).toLocaleString();
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
        <div>${contentWithMentions}</div>
    `;
    if(msg.attachments?.length){
        msg.attachments.forEach(att=>{
            const url = att.url, name = att.filename.toLowerCase();
            if(/\.(png|jpg|jpeg|gif|webp)$/.test(name)) contentHTML += `<br><img src="${url}" style="max-width:300px;">`;
            else contentHTML += `<br><video style="max-height:300px; height:fit-content;" src="${url}" controls>${att.filename}</video>`;
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
    const channelId = currentChannelId;
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
            throw new Error("ERR#13 Failed To Fetch Data: " + response.status);
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
        presenceCountEl.textContent = "ERR#13 Error Fetching Presence Count.";
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