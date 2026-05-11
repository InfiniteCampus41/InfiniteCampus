import { auth, onAuthStateChanged } from "/imports.js";
const addChannelBtn = document.getElementById("addChannelBtn");
const adminControls = document.getElementById("adminControls");
const bioSpan = document.getElementById("bio");
const channelList = document.getElementById("channels");
const channelMentionSet = new Set();
const chatInput = document.getElementById("chatInput");
const chatLog = document.getElementById("chatLog");
const downloadBtn = document.createElement("a");
const imgViewer = document.createElement("div");
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const mentionHint = document.getElementById("mentionHint");
const mentionMenu = document.getElementById("mentionMenu");
const mentionNotif = document.getElementById("mentionNotif");
const mentionToggle = document.getElementById("mentionToggle");
const mentionToggleLabel = document.getElementById("mentionToggleLabel");
const MESSAGE_COOLDOWN = 3000;
const PAGE_SIZE = 50;
const privateList = document.getElementById("privateList");
const privateListeners = new Set();
const reply = document.getElementById("reply");
const roleSpan = document.getElementById("role");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.createElement("div");
const userMetaCache = {};
const usernameSpan = document.getElementById("username");
const verifiedMessage = document.createElement("div");
const verifiedOverlay = document.createElement("div");
const viewerImg = document.createElement("img");
let activeListenersCount = 0;
let allUsernames = [];
let authReady = false;
let autoScrollEnabled = true;
let currentColor = "#ffffff";
let currentListeners = {};
let currentMsgRef = null;
let currentName = "User";
let currentPath = null;
let currentPrivateName = null;
let currentPrivateUid = null;
let currentUser = null;
let hasMoreMessages = true;
let isAdmin = false;
let isBlocksi = false;
let isCoOwner = false;
let isDev = false;
let isGuardian = false;
let isHAdmin = false;
let isLanschool = false;
let isLinewize = false;
let isLinker = false;
let isOwner = false;
let isPartner = false;
let isPre1 = false;
let isPre2 = false;
let isPre3 = false;
let isReplyActive = false;
let isSecure = false;
let isSus = false;
let isTester = false;
let isVerified = false;
let lastMessageTimestamp = 0;
let loadingOlderMessages = false;
let mentionActive = false;
let metadataListenerRef = null;
let oldestLoadedTimestamp = null;
let pfpDomain = "/pfps";
let renderingChannels = false;
let replyMsgId = null;
let replyMsgName = null;
let replyMsgText = null;
let triggerIndex = -1;
let typingRef = null;
let typingTimeout = null;
let zoomed = false;
const MAX_LISTENERS = 500;
const REACTION_EMOJIS = ["👍","👎","❤️","😂","🔥","😮","😢","🎉","👀","💯","🙏","😍","😎","🤔","🥰","😅","✅","⭐","💀","🤯"];
const MAX_REACTIONS_PER_MESSAGE = 5;
const MAX_REACTIONS_PER_USER = 20;
(function injectReactionStyles() {
    if (document.getElementById("__reaction-styles")) return;
    const style = document.createElement("style");
    style.id = "__reaction-styles";
    style.textContent = `
        .reactions-row {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-left: 40px;
            margin-top: 4px;
            min-height: 0;
        }
        .reaction-chip {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 2px 8px;
            cursor: pointer;
            font-size: 0.82em;
            color: white;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: background 0.15s, border-color 0.15s;
            line-height: 1.6;
        }
        .reaction-chip:hover { background: rgba(255,255,255,0.13); }
        .reaction-chip.reacted {
            background: rgba(79,163,255,0.18);
            border-color: rgba(79,163,255,0.5);
        }
        .reaction-chip.reacted:hover { background: rgba(79,163,255,0.26); }
        .emoji-picker-popup {
            position: fixed;
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 10px;
            padding: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            max-width: 220px;
            z-index: 99999;
            box-shadow: 0 4px 24px rgba(0,0,0,0.55);
        }
        .emoji-picker-popup button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.25em;
            padding: 3px;
            border-radius: 5px;
            transition: background 0.1s;
            line-height: 1;
        }
        .emoji-picker-popup button:hover { background: #333; }
        .msg .react-btn { opacity: 0; transition: opacity 0.15s; }
        .msg:hover .react-btn { opacity: 1; }
        #msgBadges {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            vertical-align: middle;
        }
        .badge-extra-chip {
            font-size: 0.7em;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            padding: 0px 5px;
            cursor: default;
            color: #ccc;
            line-height: 1.6;
            user-select: none;
        }
        .badge-popover {
            display: none;
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 6px 8px;
            z-index: 9999;
            white-space: nowrap;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            gap: 6px;
            flex-direction: column;
            min-width: 140px;
        }
        .badge-popover-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.82em;
            color: #ddd;
        }
        #msgBadges:hover .badge-popover,
        .badge-extra-chip:hover + .badge-popover,
        .badge-popover:hover {
            display: flex;
        }
    `;
    document.head.appendChild(style);
})();
function renderReactionsInRow(reactionsRow, reactions) {
    if (!reactionsRow) return;
    reactionsRow.innerHTML = "";
    if (!reactions || typeof reactions !== "object") return;
    for (const [emoji, users] of Object.entries(reactions)) {
        if (!users || typeof users !== "object") continue;
        const count = Object.keys(users).length;
        if (count === 0) continue;
        const reacted = !!(currentUser && users[currentUser.uid]);
        const chip = document.createElement("button");
        chip.className = "reaction-chip" + (reacted ? " reacted" : "");
        chip.textContent = `${emoji} ${count}`;
        const msgId = reactionsRow.dataset.msgid;
        chip.onclick = () => toggleReaction(msgId, emoji);
        reactionsRow.appendChild(chip);
    }
}
function showEmojiPicker(event, msgId) {
    const existing = document.querySelector(".emoji-picker-popup");
    if (existing) { existing.remove(); return; }
    const picker = document.createElement("div");
    picker.className = "emoji-picker-popup";
    REACTION_EMOJIS.forEach(emoji => {
        const btn = document.createElement("button");
        btn.textContent = emoji;
        btn.onclick = (e) => {
            e.stopPropagation();
            toggleReaction(msgId, emoji);
            picker.remove();
        };
        picker.appendChild(btn);
    });
    const rect = event.currentTarget.getBoundingClientRect();
    picker.style.top  = Math.min(rect.bottom + 4, window.innerHeight - 160) + "px";
    picker.style.left = Math.min(rect.left,  window.innerWidth  - 230) + "px";
    document.body.appendChild(picker);
    setTimeout(() => {
        document.addEventListener("click", function close(e) {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener("click", close);
            }
        });
    }, 0);
}
async function toggleReaction(msgId, emoji) {
    if (!currentUser || !currentPath) return;
    const pathParts = pathToArray(currentPath + "/" + msgId);
    try {
        const token = await getAuthToken();
        const channel = currentPath.split("/")[1] || null;
        const res = await fetch(`${a}/react`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ path: pathParts, emoji, channel })
        });
        const json = await res.json();
        if (!res.ok) showError(json?.error || "Could Not React To Message");
    } catch (e) {
        showError("Reaction failed: " + (e?.message || e));
    }
}
const activeListeners = {
    typing: null,
    messages: null,
    privateChats: null,
    others: new Set()
}
const authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
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
    const res = await fetch(`${a}/${endpoint}`, {
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
async function dbUpdate(path, updates) {
    for (const key in updates) {
        await dbSet(path + "/" + key, updates[key]);
    }
}
async function dbPush(path, value) {
    const key = Date.now().toString();
    await dbSet(path + "/" + key, value);
    return key;
}
async function dbDelete(path) {
    return await fetchAPI("delete", { path: pathToArray(path) });
}
function dbListen(path, callback, type = "others") {
    if (activeListenersCount >= MAX_LISTENERS) {
        return Promise.reject("Listener limit reached");
    }
    if (type !== "others" && activeListeners[type]) {
        activeListeners[type].close();
        activeListenersCount--;
    }
    return getAuthToken().then(token => {
        const pathArray = path.split("/");
        const wsUrl = `${h}/?token=${token}&path=${encodeURIComponent(JSON.stringify(pathArray))}`;
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            if (!event.data) return;
            if (event.data instanceof Blob) {
                event.data.text().then(text => {
                    if (!text || text.trim() === "" || text === "undefined") return;
                    try {
                        callback(JSON.parse(text));
                    } catch (e) {
                        console.warn("Invalid JSON from Blob:", text, e);
                    }
                });
                return;
            }
            const raw = String(event.data).trim();
            if (!raw || raw === "undefined") return;
            try {
                callback(JSON.parse(raw));
            } catch (e) {
                console.warn("Invalid JSON:", raw, e);
            }
        };
        ws.onerror = () => {
            ws.close();
            activeListenersCount--;
            if (type !== "others") activeListeners[type] = null;
        };
        ws.onclose = () => {
            activeListenersCount--;
            if (type !== "others") activeListeners[type] = null;
        };
        activeListenersCount++;
        if (type !== "others") activeListeners[type] = ws;
        else activeListeners.others.add(ws);
        return ws;
    });
}
verifiedOverlay.style.position = "fixed";
verifiedOverlay.style.top = "0";
verifiedOverlay.style.left = "0";
verifiedOverlay.style.width = "100%";
verifiedOverlay.style.height = "100%";
verifiedOverlay.style.background = "rgba(0,0,0,0.95)";
verifiedOverlay.style.display = "none";
verifiedOverlay.style.alignItems = "center";
verifiedOverlay.style.justifyContent = "center";
verifiedMessage.style.borderRadius = "12px";
verifiedMessage.style.padding = "20px";
verifiedMessage.style.background = "#222";
verifiedMessage.style.height = "400px";
verifiedMessage.style.width = "300px";
verifiedMessage.innerHTML = `<h2 style=color:white;text-align:center;">You Are Not Verified</h2><hr><p class="btxt" style="text-align:center;">Your Account Needs To Be Verified Before You Can Send Messages To The Chat.<br><br>To Verify, Just Wait And A Staff Member Will Verify Your Account.<br><br>To View More Information On Verifying, Click<a href="InfiniteArticles.html?slug=2">Here</a>`;
imgViewer.style.position = "fixed";
imgViewer.style.top = "0";
imgViewer.style.left = "0";
imgViewer.style.width = "100%";
imgViewer.style.height = "100%";
imgViewer.style.background = "rgba(0,0,0,0.9)";
imgViewer.style.display = "none";
imgViewer.style.alignItems = "center";
imgViewer.style.justifyContent = "center";
imgViewer.style.flexDirection = "column";
imgViewer.style.zIndex = "10000";
viewerImg.style.maxWidth = "90%";
viewerImg.style.maxHeight = "80%";
viewerImg.style.cursor = "zoom-in";
viewerImg.style.transition = "transform 0.2s";
downloadBtn.textContent = "Download Image";
downloadBtn.style.marginTop = "15px";
downloadBtn.style.color = "white";
downloadBtn.style.textDecoration = "underline";
downloadBtn.style.cursor = "pointer";
imgViewer.appendChild(viewerImg);
imgViewer.appendChild(downloadBtn);
document.body.appendChild(imgViewer);
if (!(e.includes(window.location.host))) {
    pfpDomain = "https://raw.githubusercontent.com/InfiniteCampus41/InfiniteCampus/refs/heads/main/pfps"; 
}
viewerImg.addEventListener("click", () => {
    zoomed = !zoomed;
    viewerImg.style.transform = zoomed ? "scale(2)" : "scale(1)";
});
imgViewer.addEventListener("click", (e) => {
    if (e.target === imgViewer) {
        imgViewer.style.display = "none";
        viewerImg.style.transform = "scale(1)";
        zoomed = false;
    }
});
typingIndicator.id = "typingIndicator";
typingIndicator.style.fontSize = "0.8em";
typingIndicator.style.color = "#aaa";
typingIndicator.style.marginTop = "4px";
typingIndicator.style.display = "none";
reply.insertAdjacentElement("beforebegin", typingIndicator);
chatLog.addEventListener("scroll", () => {
    const distanceFromBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight;
    autoScrollEnabled = distanceFromBottom < 40;
    if (chatLog.scrollTop < 50) {
        loadOlderMessages();
    }
});
async function loadOlderMessages() {
    if (loadingOlderMessages || !hasMoreMessages || !oldestLoadedTimestamp) return;
    loadingOlderMessages = true;
    try {
        const res = await fetchAPI("load-more-messages", {
            path: pathToArray(currentPath),
            before: oldestLoadedTimestamp,
            limit: 25
        });
        const msgs = res.data;
        if (!msgs || (Array.isArray(msgs) && msgs.length === 0)) {
            hasMoreMessages = false;
            loadingOlderMessages = false;
            return;
        }
        const entries = (Array.isArray(msgs) ? msgs : Object.entries(msgs).map(([id, v]) => ({ id, ...v })))
            .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        if (entries.length === 0) {
            hasMoreMessages = false;
            loadingOlderMessages = false;
            return;
        }
        const container = document.getElementById("chatLog");
        const oldHeight = container.scrollHeight;
        for (let i = entries.length - 1; i >= 0; i--) {
            const msg = entries[i];
            const id = msg.id;
            const div = await renderMessageInstant(id, msg);
            if (div) {
                container.prepend(div);
            }
        }
        oldestLoadedTimestamp = Number(entries[0].timestamp) - 1;
        const newHeight = container.scrollHeight;
        container.scrollTop += (newHeight - oldHeight);
    } catch (e) {
        console.error("Load Older Messages Failed:", e);
    }
    loadingOlderMessages = false;
}
function scrollToBottom(smooth = false) {
    requestAnimationFrame(() => {
        chatLog.scrollTop = chatLog.scrollHeight;
        setTimeout(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
            if (smooth) {
                chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: "smooth" });
            }
        }, 50);
    });
}
function scrollToMessage(msgId, attempts = 0) {
    const el = document.getElementById("msg-" + msgId);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("msg-highlight");
        setTimeout(() => el.classList.remove("msg-highlight"), 2500);
        if (!document.getElementById("__msg-highlight-style")) {
            const s = document.createElement("style");
            s.id = "__msg-highlight-style";
            s.textContent = `
                @keyframes msgHighlight {
                    0%   { background: rgba(79,163,255,0.25); }
                    70%  { background: rgba(79,163,255,0.15); }
                    100% { background: transparent; }
                }
                .msg-highlight {
                    animation: msgHighlight 2.5s ease forwards;
                    border-radius: 6px;
                }
            `;
            document.head.appendChild(s);
        }
    } else if (attempts < 12) {
        setTimeout(() => scrollToMessage(msgId, attempts + 1), 300);
    }
}
async function unmuteUser(uid) {
    await fetchAPI("delete", { path: ["mutedUsers", uid] });
    delete userMetaCache[uid];
    showSuccess("User Unmuted.");
}
window.getUserMeta = getUserMeta;
async function getUserMeta(uid) {
    if (userMetaCache[uid]) return userMetaCache[uid];
    const [profile, settings, muteData] = await Promise.all([
        dbGet(`users/${uid}/profile`),
        dbGet(`users/${uid}/settings`)
    ]);
    const p = profile || {};
    const s = settings || {};
    let muted = false;
    const data = {
        displayName: p.displayName || "User",
        color: s.color || "#4fa3ff",
        pic: p.pic ?? 0,
        owner: !!p.isOwner,
        tester: !!p.isTester,
        coOwner: !!p.isCoOwner,
        hAdmin: !!p.isHAdmin,
        admin: !!p.isAdmin,
        dev: !!p.isDev,
        premium1: !!p.premium1,
        premium2: !!p.premium2,
        premium3: !!p.premium3,
        milestone: !!p.mileStone,
        sus: !!p.isSus,
        partner: !!p.isPartner,
        discord: p.dUsername || "",
        donor: !!p.isDonater,
        uploader: !!p.isUploader,
        guesser: !!p.isGuesser,
        linker: !!p.isLink,
        muted: false,
        secure: !!p.secure,
        guardian: !!p.guardian,
        lanschool: !!p.lanschool,
        linewize: !!p.linewize,
        blocksi: !!p.blocksi,
        online: !!p.online
    };
    userMetaCache[uid] = data;
    return data;
}
async function isUserMuted(uid) {
    const data = dbGet(`mutedUsers/${uid}`);
    if (data == null || data == undefined) return false;
    if (data.expires && Date.now() > data.expires) {
        await dbDelete(`mutedUsers/${uid}`);
        return false;
    }
    if (data.expires && Date.now() < data.expires) {
        return true;
    }
}
function detachCurrentMessageListeners() {
    if (!currentMsgRef) return;
    try {
        if (currentListeners.added && currentListeners.added.close) currentListeners.added.close();
        if (currentListeners.removed && currentListeners.removed.close) currentListeners.removed.close();
        if (currentListeners.changed && currentListeners.changed.close) currentListeners.changed.close();
    } catch (e) {}
    currentMsgRef = null;
    currentListeners = {};
}
async function ensureDisplayName(user) {
    const existingName = await dbGet(`users/${user.uid}/profile/displayName`);
    if (!existingName) {
        const name = (user.email === "infinitecodehs@gmail.com") ? "Hacker41 💎" : "User";
        await dbSet(`users/${user.uid}/profile/displayName`, name);
        currentName = name;
    } else {
        currentName = existingName;
        localStorage.setItem("displayName", currentName);
    }
    const color = await dbGet(`users/${user.uid}/settings/color`);
    if (color) {
        currentColor = color;
        localStorage.setItem("color", currentColor);
    } else {
        currentColor = "#ffffff";
    }
}
mentionToggle.addEventListener("click", (e) => {
    e.stopPropagation();
});
mentionToggleLabel.addEventListener("click", (e) => {
    e.stopPropagation();
});
mentionToggle.addEventListener("change", async () => {
    if (!currentUser) return;
    const newValue = mentionToggle.checked;
    try {
        await dbSet(`users/${currentUser.uid}/settings/showMentions`, newValue);
        mentionToggleLabel.style.color = newValue ? "gold" : "#888";
    } catch (err) {
        showError("Failed To Save Mention Setting:", err);
    }
});
async function loadMentionSetting(user) {
    try {
        const val = await dbGet(`users/${user.uid}/settings/showMentions`);
        if (val !== null && val !== undefined) {
            mentionToggle.checked = val;
        } else {
            mentionToggle.checked = true;
            await dbSet(`users/${user.uid}/settings/showMentions`, true);
        }
        mentionToggleLabel.style.color = mentionToggle.checked ? "gold" : "#888";
    } catch (err) {
        showError("Failed To Load Mention Setting:", err);
        mentionToggle.checked = true;
    }
}
async function getDisplayName(uid) {
    let dn = await dbGet(`users/${uid}/profile/displayName`);
    if (!dn || dn.trim() === "") dn = "Spam Account";
    return dn;
}
mentionNotif.addEventListener("click", () => {
    const msgId = mentionNotif.dataset.msgid;
    if (msgId) {
        dbSet(`metadata/${currentUser.uid}/mentions/${msgId}/seen`, true);
    }
    mentionNotif.style.display = "none";
});
function messageMentionsYou(text) {
    if (!text || !currentName) return false;
    const lowerMsg = text.toLowerCase();
    const plain = currentName.toLowerCase().replace(" 💎","");
    const normalMention =
        lowerMsg.includes(`@${plain}`) ||
        lowerMsg.includes(`@${plain} 💎`);
    const supportMention =
        lowerMsg.includes("@support") &&
        currentPath &&
        currentPath.startsWith("messages/") &&
        (isDev || isOwner || isTester);
    return normalMention || supportMention;
}
async function processChannelMentions(htmlText) {
    const channelRegex = /#([A-Za-z0-9_\-]+)/g;
    const channels = await dbGet("channels");
    const allChannels = channels ? Object.keys(channels) : [];
    return htmlText.replace(channelRegex, (match, chName) => {
        if (allChannels.includes(chName)) {
            return `<span class="channel-mention" data-channel="${chName}" title="Go To The ${chName} Channel">#${chName}</span>`;
        } else {
            return `#${chName}`;
        }
    });
}
function clearChannelMention(channelName) {
    channelMentionSet.delete(channelName);
    const lis = channelList.querySelectorAll("li");
    lis.forEach(li => {
        if (li.textContent && li.textContent.trim().startsWith(channelName)) {
            const dot = li.querySelector(".mentionDot");
            if (dot) dot.remove();
        }
    });
}
function formatTimestamp(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeString = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    if (isToday) return timeString;
    else if (isYesterday) return `Yesterday At ${timeString}`;
    else return `${d.toLocaleDateString()} ${timeString}`;
}
function isRestrictedChannel(ch) {
    return (ch === "Admin-Chat" || ch === "Premium-Chat");
}
async function getUidByDisplayName(name) {
    const users = await dbGet("users");
    if (!users) return null;
    const clean = name.replace(/ 💎/g, "").toLowerCase();
    for (const [uid, data] of Object.entries(users)) {
        const dn = data?.profile?.displayName;
        if (dn && dn.replace(/ 💎/g, "").toLowerCase() === clean) {
            return uid;
        }
    }
    return null;
}
function toggleReply(id = null, name = null, text = null) {
    if (!id) {
        reply.style.display = "none";
        reply.innerHTML = "";
        isReplyActive = false;
        replyMsgId = null;
        replyMsgName = null;
        replyMsgText = null;
        return;
    }
    replyMsgId = id;
    replyMsgName = name;
    replyMsgText = text;
    reply.innerHTML = "";
    reply.style.display = "flex";
    const lReply = document.createElement("span");
    lReply.textContent = `Replying To: @${name}`;
    const rReply = document.createElement("button");
    rReply.id = "exitReply";
    rReply.innerHTML = `<i class="bi bi-x-circle"></i>`;
    rReply.onclick = () => toggleReply();
    reply.appendChild(lReply);
    reply.appendChild(rReply);
    isReplyActive = true;
}
async function renderMessageInstant(id, msg) {
    const meta = await getUserMeta(msg.sender);
    if (document.getElementById("msg-" + id)) return null;
    if (id === "sender" || id === "text" || id === "timestamp") return null;
    const div = document.createElement("div");
    div.className = "msg";
    div.id = "msg-" + id;
    if (!msg) return null;
    div.dataset.timestamp = msg.timestamp || Date.now();
    const msgBtns = document.createElement("div");
    msgBtns.id = 'msgBtns';
    const topRow = document.createElement("div");
    topRow.id = "topRow";
    const nameSpan = document.createElement("span");
    nameSpan.id = "msgName";
    nameSpan.className = "highlight";
    nameSpan.style.color = "#aaa";
    nameSpan.style.cursor = "pointer";
    nameSpan.textContent = "Loading";
    const leftWrapper = document.createElement("span");
    leftWrapper.style.display = "flex";
    leftWrapper.style.gap = "6px";
    const profilePic = document.createElement("img");
    profilePic.style.width = "32px";
    profilePic.style.height = "32px";
    profilePic.style.borderRadius = "50%";
    profilePic.style.border = `2px solid ${meta.color}`;
    profilePic.style.objectFit = "cover";
    profilePic.style.cursor = "pointer";
    profilePic.src = `${pfpDomain}/1.jpeg`;
    let profilePics = [];
    async function loadProfilePics() {
        const pfpDate = Date.now();
        try {
            const res = await fetch(`${pfpDomain}/index.json?t=${pfpDate}`);
            const files = await res.json();
            profilePics = files.map(file => `${pfpDomain}/${file}`);
        } catch (e) {
            console.error("Failed To Load Profile Pics:", e);
            profilePics = [`${pfpDomain}/1.jpeg?t=${pfpDate}`];
        }
    }
    await loadProfilePics();
    leftWrapper.appendChild(profilePic);
    leftWrapper.appendChild(nameSpan);
    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp";
    timeSpan.textContent = msg.timestamp ? formatTimestamp(msg.timestamp) : "";
    topRow.appendChild(leftWrapper);
    topRow.appendChild(timeSpan);
    const textDiv = document.createElement("div");
    textDiv.className = "msg-text";
    textDiv.style.whiteSpace = "pre-wrap";
    textDiv.style.overflowWrap = "anywhere";
    textDiv.style.marginLeft = "40px";
    textDiv.style.marginTop = "-11px";
    let safeText = (msg.text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    safeText = safeText.replace(
        /&lt;i\s+class="([^"]*(?:fa|bi)[^"]+)"(?:\s+style="([^"]*)")?(?:\s+title="([^"]*)")?\s*&gt;&lt;\/i&gt;/g,
        (match, cls, style, title) => {
            let attrs = `class="${cls}"`;
            if (style) attrs += ` style="${style}"`;
            if (title) attrs += ` title="${title}"`;
            return `<i ${attrs}></i>`;
        }
    );
    safeText = safeText.replace(
        /&lt;p\s+style="color:\s*([^";]+)\s*;"\s*&gt;([\s\S]*?)&lt;\/p&gt;/gi,
        (match, color, content) => {
            const safeColor = color.replace(/[^a-zA-Z0-9#(),.%\s]/g, "");
            return `<p style="color:${safeColor}; margin-bottom:0px;">${content}</p>`;
        }
    );
    safeText = safeText.replace(
        /&lt;img\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+style="([^"]*)")?\s*&gt;/gi,
        (match, src, alt, style) => {
            const safeSrc = src.replace(/"/g, "");
            const safeAlt = alt ? alt.replace(/"/g, "") : "";
            let width = null;
            let height = null;
            let radius = null;
            if (style) {
                const w = style.match(/width\s*:\s*([0-9]+)px/i);
                const h = style.match(/height\s*:\s*([0-9]+)px/i);
                const r = style.match(/border-radius\s*:\s*([0-9]+)px/i);
                if (w) width = Math.min(parseInt(w[1]), 100);
                if (h) height = Math.min(parseInt(h[1]), 100);
                if (r) radius = parseInt(r[1]);
            }
            let finalStyle = "margin-top:6px;cursor:pointer;";
            if (width) finalStyle += `width:${width}px;`;
            if (height) finalStyle += `height:${height}px;`;
            if (radius !== null) finalStyle += `border-radius:${radius}px;`;
            return `<img src="${safeSrc}" alt="${safeAlt}" class="chat-img" style="${finalStyle}">`;
        }
    );
    safeText = safeText.replace(
        /&lt;video\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+style="([^"]*)")?\s*&gt;/gi,
        (match, src, alt, style) => {
            const safeSrc = src.replace(/"/g, "");
            const safeAlt = alt ? alt.replace(/"/g, "") : "";
            let width = null;
            let height = null;
            let radius = null;
            if (style) {
                const w = style.match(/width\s*:\s*([0-9]+)px/i);
                const h = style.match(/height\s*:\s*([0-9]+)px/i);
                const r = style.match(/border-radius\s*:\s*([0-9]+)px/i);
                if (w) width = Math.min(parseInt(w[1]), 100);
                if (h) height = Math.min(parseInt(h[1]), 100);
                if (r) radius = parseInt(r[1]);
            }
            let finalStyle = "margin-top:6px;cursor:pointer;";
            if (width) finalStyle += `width:${width}px;`;
            if (height) finalStyle += `height:${height}px;`;
            if (radius !== null) finalStyle += `border-radius:${radius}px;`;
            return `<video src="${safeSrc}" class="chat-vid" style="${finalStyle}" controls loop>`;
        }
    );
    safeText = safeText.replace(
        /&lt;audio\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+style="([^"]*)")?\s*&gt;/gi,
        (match, src) => {
            const safeSrc = src.replace(/"/g, "");
            let finalStyle = "margin-top:6px;cursor:pointer;";
            return `<audio src="${safeSrc}" class="chat-aud" style="${finalStyle}" controls>`;
        }
    );
    safeText = safeText.replace(/\n/g, "<br>");
    const mentionRegex = /@([^\s<]+)/g;
    safeText = safeText.replace(mentionRegex, (match, name) => {
        const lower = name.toLowerCase();
        if (
            lower === "support" &&
            currentPath &&
            currentPath.startsWith("messages/") &&
            (isDev || isOwner || isTester)
        ) {
            return `<span class="mention-self">@support</span>`;
        }
        const isSelfMention =
            currentName &&
            (
                currentName.toLowerCase() === lower ||
                currentName.toLowerCase() === lower.replace(" 💎","")
            );
        const cls = isSelfMention ? "mention-self" : "mention";
        return `<span class="${cls} mention-user" data-name="${name}">@${name}</span>`;
    });
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    safeText = safeText.replace(markdownLinkRegex, (match, text, url) => {
        const cleanText = text.trim();
        const cleanUrl = url.trim();
        if (cleanText === cleanUrl) {
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:#4fa3ff;text-decoration:underline;">${cleanText}</a>`;
        } else if (cleanText.includes(".")) {
            return `${cleanText} (${cleanUrl})`;
        }
        const looksLikeUrl = /^https?:\/\//i.test(cleanText);
        if (looksLikeUrl && cleanText !== cleanUrl) {
            return `${cleanText} (${cleanUrl})`;
        }
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:#4fa3ff;text-decoration:underline;">${cleanText}</a>`;
    });
    const urlRegex = /(^|[\s>])((https?:\/\/)[^\s<]+)/gi;
    safeText = safeText.replace(urlRegex, (match, prefix, url) => {
        let display = url;
        while (/[.,!?;:)\]\"]$/.test(display)) display = display.slice(0, -1);
        const trailing = url.slice(display.length);
        if (display.includes("tenor.com")) {
            const clean = display.split("?")[0];
            const finalUrl = clean.endsWith(".gif") ? display : display + ".gif";
            return `${prefix}
            <img 
                src="${finalUrl}" 
                class="chat-img tenor-gif"
                data-tenor="${display}"
                style="max-width:250px;margin-top:6px;border-radius:8px;">
            ${trailing}`;
        }
        if (
            display.includes("youtube.com/watch") ||
            display.includes("youtu.be/") ||
            display.includes("youtube.com/shorts/")
        ) {
            let videoId = "";
            if (display.includes("youtube.com/watch")) {
                const urlObj = new URL(display);
                videoId = urlObj.searchParams.get("v");
            }
            else if (display.includes("youtu.be/")) {
                videoId = display.split("youtu.be/")[1].split(/[?&]/)[0];
            }
            else if (display.includes("youtube.com/shorts/")) {
                videoId = display.split("/shorts/")[1].split(/[?&]/)[0];
            }
            const isShort = display.includes("/shorts/");
            return `${prefix}
            <div class="yt-embed ${isShort ? "short" : ""}">
                <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
            </div>
            ${trailing}`;
        }
        if (display.includes("tiktok.com")) {
            return `${prefix}
            <blockquote class="tiktok-embed" cite="${display}" data-video-id="">
                <a href="${display}"></a>
            </blockquote>
            ${trailing}`;
        }
        return `${prefix}<a href="${display}" target="_blank" rel="noopener noreferrer"style="color:#4fa3ff;text-decoration:underline;">${display}</a>${trailing}`;
    });
    safeText = await processChannelMentions(safeText);
    textDiv.innerHTML = safeText;
    try {
        const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        const script = document.createElement("script");
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        script.onload = () => {
            if (window.tiktokEmbedLoad) {
                try {
                    window.tiktokEmbedLoad();
                } catch (e) {
                    console.warn("TikTok embed init failed:", e);
                }
            }
        };
        script.onerror = () => {
            console.warn("TikTok embed script blocked or failed to load.");
        };
        document.body.appendChild(script);
    } catch (err) {
        console.warn("TikTok script handling failed:", err);
    }
    textDiv.querySelectorAll(".mention-user").forEach(span => {
        span.style.cursor = "pointer";
        span.addEventListener("click", async () => {
            const name = span.dataset.name;
            const uid = await getUidByDisplayName(name);
            if (!uid) {
                showError("User Profile Not Found.");
                return;
            }
            window.location.href = `InfiniteAccounts.html?user=${uid}`;
        });
    });
    textDiv.querySelectorAll(".channel-mention").forEach(span => {
        span.style.color = "#4fa3ff";
        span.style.cursor = "pointer";
        span.addEventListener("click", () => {
            const ch = span.dataset.channel;
            if (typeof switchChannel === "function") {
                switchChannel(ch);
            } else {
                showError("switchChannel() Not Defined, Cannot Change Channel:", ch);
            }
        });
    });
    let previewDiv = document.querySelector(".link-preview-global");
    if (!previewDiv) {
        previewDiv = document.createElement("div");
        previewDiv.className = "link-preview-global";
        Object.assign(previewDiv.style, {
            position: "absolute",
            zIndex: "9999",
            display: "none",
            width: "320px",
            background: "rgba(20,20,20,0.95)",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #333",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            color: "#fff",
            transition: "opacity 0.15s ease",
            opacity: "0",
            pointerEvents: "none"
        });
        document.body.appendChild(previewDiv);
    }
    const links = textDiv.querySelectorAll("a[href]");
    links.forEach(link => {
        const showLinkMenu = (x, y) => {
            const old = document.querySelector(".link-context-menu");
            if (old) old.remove();
            const menu = document.createElement("div");
            menu.className = "link-context-menu";
            menu.style.position = "absolute";
            menu.style.left = x + "px";
            menu.style.top = y + "px";
            menu.style.background = "#222";
            menu.style.border = "1px solid #555";
            menu.style.borderRadius = "6px";
            menu.style.padding = "8px";
            menu.style.color = "#fff";
            menu.style.zIndex = "9999";
            menu.style.maxWidth = "300px";
            menu.style.wordBreak = "break-all";
            menu.textContent = link.href;
            document.body.appendChild(menu);
            const close = () => {
                menu.remove();
                document.removeEventListener("click", close);
            };
            setTimeout(() => {
                document.addEventListener("click", close);
            }, 0);
        };
        link.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            showLinkMenu(e.pageX, e.pageY);
        });
        let pressTimer = null;
        link.addEventListener("touchstart", (e) => {
            pressTimer = setTimeout(() => {
                const touch = e.touches[0];
                showLinkMenu(touch.pageX, touch.pageY);
            }, 500);
        });
        link.addEventListener("touchend", () => {
            clearTimeout(pressTimer);
        });
        link.addEventListener("touchmove", () => {
            clearTimeout(pressTimer);
        });
    });
    const cache = {};
    links.forEach((link) => {
        const url = link.href;
        link.addEventListener("mouseenter", async (e) => {
            const rect = link.getBoundingClientRect();
            previewDiv.style.top = `${rect.bottom + 6}px`;
            previewDiv.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;
            previewDiv.style.display = "block";
            previewDiv.style.opacity = "1";
            previewDiv.innerHTML = "Loading Preview...";
            if (!cache[url]) {
                try {
                    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
                    const data = await res.json();
                    if (data.status === "success" && data.data) {
                        const { title, description, image } = data.data;
                        cache[url] = { title, description, image };
                    } else {
                        cache[url] = { error: "(No Preview Available)" };
                    }
                } catch {
                    cache[url] = { error: "(Preview Failed)" };
                }
            }
            const info = cache[url];
            if (info.error) {
                previewDiv.textContent = info.error;
            } else {
                previewDiv.innerHTML = "";
                const content = document.createElement("div");
                content.style.display = "flex";
                content.style.alignItems = "center";
                content.style.gap = "8px";
                if (info.image?.url) {
                    const img = document.createElement("img");
                    img.src = info.image.url;
                    img.style.width = "60px";
                    img.style.height = "60px";
                    img.style.border = "1px solid white";
                    img.style.objectFit = "cover";
                    img.style.borderRadius = "6px";
                    content.appendChild(img);
                }
                const details = document.createElement("div");
                details.style.flex = "1";
                if (info.title) {
                    const titleEl = document.createElement("div");
                    titleEl.textContent = info.title;
                    titleEl.style.fontWeight = "bold";
                    details.appendChild(titleEl);
                }
                if (info.description) {
                    const descEl = document.createElement("div");
                    descEl.textContent = info.description;
                    descEl.style.fontSize = "0.8em";
                    descEl.style.color = "#ccc";
                    descEl.style.lineHeight = "1.2em";
                    details.appendChild(descEl);
                }
                content.appendChild(details);
                previewDiv.appendChild(content);
            }
        });
        link.addEventListener("mouseleave", () => {
            previewDiv.style.opacity = "0";
            setTimeout(() => {
                previewDiv.style.display = "none";
            }, 150);
        });
    });
    const editedSpan = document.createElement("div");
    editedSpan.className = "edited-label";
    editedSpan.textContent = msg.edited ? "(Edited)" : "";
    div.appendChild(msgBtns);
    if (msg.reply) {
        (async () => {
            try {
                const rData = await dbGet(currentPath + "/" + msg.reply);
                if (rData) {
                    const rName = await getDisplayName(rData.sender);
                    const replyPreview = document.createElement("div");
                    replyPreview.style.display = "flex";
                    const arrow = document.createElement("span");
                    arrow.style.width = "30px";
                    arrow.style.marginLeft = "15px";
                    arrow.style.height = "8px";
                    arrow.style.marginTop = "-3px";
                    arrow.style.borderTop = "1px solid #aaa";
                    arrow.style.borderLeft = "1px solid #aaa";
                    arrow.style.borderTopLeftRadius = "10px";
                    const reply = document.createElement("span");
                    reply.style.fontSize = "0.8em";
                    reply.style.marginRight = "44px";
                    reply.style.color = "#aaa";
                    reply.style.paddingLeft = "6px";
                    reply.style.marginTop = "-11px";
                    reply.style.whiteSpace = "nowrap";
                    reply.style.overflow = "hidden";
                    reply.style.textOverflow = "ellipsis";
                    reply.style.maxWidth = "100%";
                    const previewText = (rData.text || "").substring(0, 80);
                    reply.textContent =
                        `Replying To: @${rName}: ${previewText}`;
                    replyPreview.appendChild(arrow);
                    replyPreview.appendChild(reply);
                    div.prepend(replyPreview);
                }
            } catch (e) {
                console.warn("Reply load failed:", e);
            }
        })();
    }
    const container = document.getElementById("chatLog");
    if (container) container.appendChild(div);
    div.appendChild(topRow);
    div.appendChild(textDiv);
    div.appendChild(editedSpan);
    const reactionsRow = document.createElement("div");
    reactionsRow.className = "reactions-row";
    reactionsRow.dataset.msgid = id;
    div.appendChild(reactionsRow);
    renderReactionsInRow(reactionsRow, msg.reactions);
    if (currentPath) {
        dbListen(`${currentPath}/${id}/reactions`, (reactionsData) => {
            const row = document.querySelector(`.reactions-row[data-msgid="${id}"]`);
            if (row) renderReactionsInRow(row, reactionsData);
        }).catch(() => {});
    }
    (async () => {
        try {
            let displayName = meta.displayName;
            if (!displayName || displayName.trim() === "") {
                displayName = "Spam Account";
            }
            const picVal = meta.pic;
            const picIndex = (picVal >= 0 && picVal < profilePics.length) ? picVal : 0;
            profilePic.src = profilePics[picIndex] + "?t=" + Date.now();
            nameSpan.textContent = displayName;
            nameSpan.style.color = meta.color;
            const openProfile = () => {
                window.location.href = `InfiniteAccounts.html?user=${msg.sender}`;
            };
            nameSpan.onclick = openProfile;
            profilePic.onclick = openProfile;
            nameSpan.textContent = displayName;
            nameSpan.style.color = meta.color;
            if (((isOwner || isTester) && !meta.owner) || (isCoOwner && !meta.owner && !meta.tester && !meta.coOwner) || (isHAdmin && !meta.owner && !meta.tester && !meta.coOwner && !meta.hAdmin) || (isAdmin && !meta.owner && !meta.tester && !meta.coOwner && !meta.hAdmin && !meta.admin)) {
                nameSpan.addEventListener("contextmenu", async (e) => {
                    e.preventDefault();
                    const freshMeta = await getUserMeta(msg.sender);
                    const alreadyMuted = freshMeta.muted;                    
                    const menu = document.createElement("div");
                    menu.style.position = "absolute";
                    menu.style.left = e.pageX + "px";
                    menu.style.top = e.pageY + "px";
                    menu.style.background = "#222";
                    menu.style.border = "1px solid #555";
                    menu.style.borderRadius = "6px";
                    menu.style.padding = "6px 10px";
                    menu.style.color = "#fff";
                    menu.style.cursor = "pointer";
                    menu.style.zIndex = 9999;
                    if (alreadyMuted) {
                        menu.textContent = "Unmute User";
                        menu.onclick = async () => {
                            await unmuteUser(msg.sender);
                            closeMenu();
                        };
                    } else {
                        menu.textContent = "Mute User";
                        const options = document.createElement("div");
                        options.style.display = "flex";
                        options.style.flexDirection = "column";
                        options.style.marginTop = "4px";
                        const muteToggle = document.createElement('div');
                        muteToggle.textContent = "Toggle";
                        muteToggle.style.cursor = "pointer";
                        muteToggle.onclick = async () => {
                            await dbSet(`mutedUsers/${msg.sender}`, { expires: "Never" });
                            delete userMetaCache[msg.sender];
                            showSuccess(`User Muted`);
                            closeMenu();
                        };
                        const muteMinutes = document.createElement("div");
                        muteMinutes.textContent = "Minutes";
                        muteMinutes.style.cursor = "pointer";
                        muteMinutes.onclick = async () => {
                            let minutes = await customPrompt("Mute For How Many Minutes?", false, "5");
                            minutes = parseInt(minutes);
                            if (!isNaN(minutes) && minutes > 0) {
                                await dbSet(`mutedUsers/${msg.sender}`, { expires: Date.now() + minutes * 60 * 1000 });
                                delete userMetaCache[msg.sender];
                                showSuccess(`User Muted For ${minutes} Minute(s).`);
                            } else {
                                showError("Invalid Duration Entered.");
                            }
                            closeMenu();
                        };
                        const muteHours = document.createElement("div");
                        muteHours.textContent = "Hours";
                        muteHours.style.cursor = "pointer";
                        muteHours.onclick = async () => {
                            let hours = await customPrompt("Mute For How Many Hours?", false, "1");
                            hours = parseInt(hours);
                            if (!isNaN(hours) && hours > 0) {
                                await dbSet(`mutedUsers/${msg.sender}`, { expires: Date.now() + hours * 60 * 60 * 1000 });
                                delete userMetaCache[msg.sender];
                                showSuccess(`User Muted For ${hours} Hour(s).`);
                            } else {
                                showError("Invalid Duration Entered.");
                            }
                            closeMenu();
                        };
                        const muteDays = document.createElement("div");
                        muteDays.textContent = "Days";
                        muteDays.style.cursor = "pointer";
                        muteDays.onclick = async () => {
                            let days = await customPrompt("Mute For How Many Days?", false, "1");
                            days = parseInt(days);
                            if (!isNaN(days) && days > 0) {
                                await dbSet(`mutedUsers/${msg.sender}`, { expires: Date.now() + days * 24 * 60 * 60 * 1000 });
                                delete userMetaCache[msg.sender];
                                showSuccess(`User Muted For ${days} Day(s).`);
                            } else {
                                showError("Invalid Duration Entered.");
                            }
                            closeMenu();
                        };
                        options.appendChild(muteToggle);
                        options.appendChild(muteMinutes);
                        options.appendChild(muteHours);
                        options.appendChild(muteDays);
                        menu.appendChild(options);
                    }
                    document.body.appendChild(menu);
                    const closeMenu = () => { menu.remove(); document.removeEventListener("click", closeMenu); };
                    document.addEventListener("click", closeMenu);
                });
            }
            const badgeContainer = document.createElement("span");
            badgeContainer.id = "msgBadges";
            const mutedBadge = document.createElement("span");
            mutedBadge.style.color = "red";
            mutedBadge.style.display = "none";
            mutedBadge.title = "This User Is Muted";
            mutedBadge.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
            dbListen(`mutedUsers/${msg.sender}`, async (data) => {
                if (!data) { mutedBadge.style.display = "none"; return; }
                if (data.expires === "Never") { mutedBadge.style.display = "inline"; return; }
                if (data.expires && Date.now() > data.expires) {
                    await dbDelete(`mutedUsers/${msg.sender}`);
                    mutedBadge.style.display = "none";
                    return;
                }
                mutedBadge.style.display = "inline";
            });
            const allPrimaryBadges = [];
            function mkPrimary(cls, color, title) {
                allPrimaryBadges.push({ cls, color, title });
            }
            if (meta.sus)      mkPrimary("bi bi-shield-exclamation","red","Under Investigation — Do Not Interact");
            if (meta.owner)    mkPrimary("bi bi-shield-plus","lime","Owner");
            if (meta.tester)   mkPrimary("fa-solid fa-cogs","darkGoldenRod","Tester");
            if (meta.coOwner)  mkPrimary("bi bi-shield-fill","lightblue","Co-Owner");
            if (meta.hAdmin)   mkPrimary("fa-solid fa-shield-halved","#00cc99","Head Admin");
            if (meta.admin)    mkPrimary("bi bi-shield","dodgerblue","Admin");
            if (meta.dev)      mkPrimary("bi bi-code-square","green","Developer");
            if (meta.premium3) mkPrimary("bi bi-hearts","red","Infinite Campus Premium T3");
            if (meta.premium2) mkPrimary("bi bi-heart-fill","orange","Infinite Campus Premium T2");
            if (meta.premium1) mkPrimary("bi bi-heart-half","yellow","Infinite Campus Premium T1");
            if (meta.donor)    mkPrimary("bi bi-balloon-heart","#00E5FF","Donated To Infinite Campus");
            const extraBadges = [];
            function mkExtra(cls, color, label, title) {
                extraBadges.push({ cls, color, label, title });
            }
            if (meta.partner)  mkExtra("fa fa-handshake","cornflowerblue","Partner","Partner Of Infinite Campus");
            if (meta.uploader) mkExtra("bi bi-film","grey","Uploader","Uploaded A Movie To Infinite Campus");
            if (meta.milestone) mkExtra("bi bi-award","yellow","Award","100th Signed Up User");
            if (meta.guesser)  mkExtra("bi bi-stopwatch","#ff0000","Guesser","This User Has A Lot Of Freetime");
            if (meta.discord && meta.discord.trim() !== "") mkExtra("bi bi-discord","#5865F2",`@${meta.discord}`,`Known As @${meta.discord} On The Infinite Campus Discord`);
            if (meta.linker)   mkExtra("bi bi-link","#4fa3ff","Linker","Sent Lots Of Links In The Links Channel");
            if (meta.secure)   mkExtra("bi ic ic-securely","dodgerblue","Securely","Has Securely At School");
            if (meta.guardian) mkExtra("bi ic ic-goguardian","grey","GoGuardian","Has GoGuardian At School");
            if (meta.lanschool) mkExtra("bi ic ic-lanschool","greenyellow","Lanschool","Has Lanschool At School");
            if (meta.linewize) mkExtra("bi ic ic-linewize","lightskyblue","Linewize","Has Linewize At School");
            if (meta.blocksi)  mkExtra("bi ic ic-blocksi","cadetblue","Blocksi","Has Blocksi At School");
            const totalRoles = allPrimaryBadges.length + extraBadges.length;
            let inlinePrimaries, overflowPrimaries, inlineExtras, popoverExtras;
            if (totalRoles <= 3) {
                inlinePrimaries = allPrimaryBadges;
                overflowPrimaries = [];
                inlineExtras = extraBadges;
                popoverExtras = [];
            } else {
                inlinePrimaries = allPrimaryBadges.slice(0, 3);
                overflowPrimaries = allPrimaryBadges.slice(3);
                inlineExtras = [];
                popoverExtras = extraBadges;
            }
            const onlineBadge = document.createElement("i");
            function setOnlineStatus(isOnline) {
                if (isOnline) {
                    onlineBadge.className = "bi ic ic-online";
                    onlineBadge.style.color = "#69a84f";
                    onlineBadge.title = "Online";
                } else {
                    onlineBadge.className = "bi ic ic-offline";
                    onlineBadge.style.color = "#999999";
                    onlineBadge.title = "Offline";
                }
            }
            setOnlineStatus(meta.online);
            dbListen(`users/${msg.sender}/profile/online`, (val) => setOnlineStatus(!!val));
            inlinePrimaries.forEach(({ cls, color, title }) => {
                const span = document.createElement("span");
                span.innerHTML = `<i class="${cls}" style="color:${color}" title="${title}"></i>`;
                badgeContainer.appendChild(span);
            });
            badgeContainer.appendChild(mutedBadge);
            inlineExtras.forEach(({ cls, color, label, title }) => {
                const span = document.createElement("span");
                span.innerHTML = `<i class="${cls}" style="color:${color}" title="${title}"></i>`;
                badgeContainer.appendChild(span);
            });
            const popoverBadges = [
                ...overflowPrimaries.map(({ cls, color, title }) => ({ cls, color, label: title.split(" — ")[0], title })),
                ...popoverExtras
            ];
            if (popoverBadges.length > 0) {
                const chip = document.createElement("span");
                chip.className = "badge-extra-chip";
                chip.textContent = `+${popoverBadges.length}`;
                const popover = document.createElement("div");
                popover.className = "badge-popover";
                popoverBadges.forEach(({ cls, color, label, title }) => {
                    const row = document.createElement("div");
                    row.className = "badge-popover-row";
                    row.title = title;
                    const icon = document.createElement("i");
                    icon.className = cls;
                    icon.style.color = color;
                    const lbl = document.createElement("span");
                    lbl.textContent = label;
                    row.appendChild(icon);
                    row.appendChild(lbl);
                    popover.appendChild(row);
                });
                badgeContainer.appendChild(chip);
                badgeContainer.appendChild(popover);
            }
            badgeContainer.appendChild(onlineBadge);
            leftWrapper.appendChild(badgeContainer);
            const isSelf = msg.sender === currentUser.uid;
            let canReply = true;
            if (isSelf) canReply = false;
            if (canReply) {
                const replyBtn = document.createElement("button");
                replyBtn.innerHTML = `<i class="bi bi-arrow-90deg-left"></i>`;
                replyBtn.title = "Reply";
                replyBtn.onclick = () => {
                    toggleReply(id, displayName, msg.text);
                }
                msgBtns.appendChild(replyBtn);
            }
            const reactBtn = document.createElement("button");
            reactBtn.className = "react-btn";
            reactBtn.innerHTML = `<i class="bi bi-emoji-smile"></i>`;
            reactBtn.title = "Add Reaction";
            reactBtn.onclick = (e) => {
                e.stopPropagation();
                showEmojiPicker(e, id);
            };
            msgBtns.appendChild(reactBtn);
            if (isSelf || isOwner || isAdmin || isCoOwner || isHAdmin || isTester) {
                let canDelete = false;
                if (isSelf) canDelete = true;
                else if (isOwner || isTester) canDelete = true;
                else if (isCoOwner && !meta.owner && !meta.tester && !meta.coOwner && !meta.owner) canDelete = true;
                else if (isHAdmin && !meta.owner && !meta.coOwner && !meta.tester && !meta.hAdmin) canDelete = true;
                else if (isAdmin && !meta.hAdmin && !meta.admin && !meta.coOwner && !meta.owner && meta.tester) canDelete = true;
                let canEdit = false;
                if (isSelf) canEdit = true;
                else if (isOwner || isTester) canEdit = true;
                else if (isCoOwner && !meta.owner && !meta.tester && !meta.coOwner && !meta.hAdmin) canEdit = true;
                if (canEdit) {
                    const editBtn = document.createElement("button");
                    editBtn.innerHTML = "<i class='bi bi-pencil-square'></i>";
                    editBtn.title = 'Edit Message';
                    editBtn.onclick = () => {
                        if (div.querySelector("textarea")) return;
                        const textarea = document.createElement("textarea");
                        textarea.value = msg.text.replace(/\n/g, "\n");
                        textarea.style.width = "100%";
                        textarea.style.boxSizing = "border-box";
                        textarea.style.resize = "vertical";
                        textarea.style.background = "#121212";
                        textarea.style.overflowY = "auto";
                        textarea.style.color = "white";
                        textarea.style.minHeight = "40px";
                        textarea.style.maxHeight = "400px";
                        textarea.style.height = "auto";
                        textDiv.style.display = "none";
                        div.insertBefore(textarea, textDiv.nextSibling);
                        textarea.focus();
                        requestAnimationFrame(() => {
                            textarea.style.height = "auto";
                            textarea.style.height = textarea.scrollHeight + "px";
                        });
                        textarea.addEventListener("input", () => {
                            textarea.style.height = "auto";
                            textarea.style.height = textarea.scrollHeight + "px";
                        });
                        textarea.addEventListener("keydown", async (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                const newText = textarea.value.trim();
                                if (newText.length > 1000 && !(isCoOwner || isOwner || isHAdmin || isTester)) {
                                    showError(`Your Edited Message Is Too Long (${newText.length} Characters). Please Keep It Under 1000.`);
                                    textarea.value = "";
                                    return;
                                }
                                if (newText !== "") {
                                    await dbUpdate(currentPath + "/" + id, {
                                        text: newText,
                                        edited: true
                                    });
                                }
                                textarea.remove();
                                textDiv.style.display = "block";
                                textDiv.innerHTML = newText;
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                textarea.remove();
                                textDiv.style.display = "block";
                            }
                        });
                    };
                    msgBtns.appendChild(editBtn);
                }
                if (canDelete) {
                    const delBtn = document.createElement("button");
                    delBtn.innerHTML = "<i class='bi bi-trash-fill'></i>";
                    delBtn.title = 'Delete Message';
                    delBtn.onclick = () => {
                        dbDelete(currentPath + "/" + id);
                        div.remove();
                    }
                    msgBtns.appendChild(delBtn);
                }
            }
        } catch (err) {
            console.error("Metadata Fetch Failed:", err);
            showError("Metadata Fetch Failed: " + (err?.message || err));
        }
    })();
    try {
        const mentionedYou = messageMentionsYou(msg.text);
        if (mentionedYou && msg.sender !== currentUser.uid && mentionToggle.checked) {
            const alreadyViewing =
                currentPath &&
                currentPath === `messages/${currentPath?.split("/")[1]}`;
            const mentionPath = `metadata/${currentUser.uid}/mentions/${id}`;
            dbGet(mentionPath).then((data) => {
                if (!data || data.seen === false) {
                    mentionNotif.style.display = "inline";
                    mentionNotif.dataset.msgid = id;
                    if (!data) {
                        dbSet(mentionPath, {
                            seen: false,
                            channel: currentPath?.split("/")[1] || null,
                        });
                    }
                    (async () => {
                        const nm = await getDisplayName(msg.sender);
                        mentionNotif.textContent =
                            `You Were Mentioned By ${nm}!`;
                        mentionNotif.animate(
                            [
                                { opacity: 0 },
                                { opacity: 1 },
                                { opacity: 0.5 },
                                { opacity: 1 }
                            ],
                            { duration: 1000 }
                        );
                        if (!alreadyViewing) {
                            playNotificationSound();
                        }
                    })();
                }
            });
        }
    } catch (e) {
        showError(e);
    }
    return div;
}
async function showChannelMentionMenu() {
    if (!mentionMenu) return;
    const channels = await dbGet("channels");
    mentionMenu.innerHTML = "";
    mentionMenu.style.display = "block";
    Object.entries(channels || {}).forEach(async ([ch, chData]) => {
        if (!(await hasPermission(chData, "read"))) return;
        if (isRestrictedChannel(ch) &&
            !(isOwner || isTester || isCoOwner || isHAdmin || isAdmin || isDev || isPre2 || isPre3)
        ) return;
        const item = document.createElement("div");
        item.className = "mention-item";
        item.style.padding = "5px 8px";
        item.style.cursor = "pointer";
        item.style.borderBottom = "1px solid rgb(51,51,51)";
        item.textContent = "#" + ch;
        item.onmouseenter = () => item.style.background = "#333";
        item.onmouseleave = () => item.style.background = "transparent";
        item.onclick = () => {
            const start = triggerIndex;
            const end = chatInput.selectionStart;
            const before = chatInput.value.substring(0, start);
            const after = chatInput.value.substring(end);
            const insert = "#" + ch + " ";
            chatInput.value = before + insert + after;
            const newPos = before.length + insert.length;
            chatInput.selectionStart = chatInput.selectionEnd = newPos;
            mentionMenu.style.display = "none";
            mentionActive = false;
        };
        mentionMenu.appendChild(item);
    });
}
dbListen("mutedUsers", async (allMutes) => {
    if (!allMutes) return;
    for (const uid in allMutes) {
        const data = allMutes[uid];
        if (data.expires && data.expires !== "Never" && Date.now() > data.expires) {
            await dbDelete(`mutedUsers/${uid}`);
            console.log(`Expired Mute For ${uid} Removed`);
        }
    }
}, "others");
async function attachMessageListeners(path) {
    detachCurrentMessageListeners();
    currentMsgRef = path;
    chatLog.innerHTML = "";
    oldestLoadedTimestamp = null;
    hasMoreMessages = true;
    const res = await fetchAPI("limit-to-last", { path: pathToArray(path), limit: PAGE_SIZE });
    const msgs = res?.data;
    if (!msgs) return;
    const entries = Object.entries(msgs).sort((a, b) => a[1].timestamp - b[1].timestamp);
    oldestLoadedTimestamp = entries[0]?.[1]?.timestamp ? Number(entries[0][1].timestamp) - 1 : null;
    const fragment = document.createDocumentFragment();
    for (const [id, msg] of entries) {
        const div = await renderMessageInstant(id, msg);
        if (div) fragment.appendChild(div);
    }
    chatLog.appendChild(fragment);
    scrollToBottom(false);
    let lastSnapshot = { ...msgs };
    const ws = await dbListen(path, async (newData) => {
        if (currentMsgRef !== path) return;
        if (!newData || typeof newData !== "object") return;
        const renderedMessages = new Set();
        for (const [key, val] of Object.entries(newData)) {
            const existing = document.getElementById("msg-" + key);
            if (!existing) {
                const newDiv = await renderMessageInstant(key, val);
                if (!newDiv) continue;
                const newTs = Number(val.timestamp);
                const msgsEls = Array.from(chatLog.querySelectorAll(".msg"));
                let inserted = false;
                for (const el of msgsEls) {
                    if (Number(el.dataset.timestamp || 0) > newTs) {
                        chatLog.insertBefore(newDiv, el);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) chatLog.appendChild(newDiv);
                if (autoScrollEnabled) scrollToBottom(true);
            } else if (lastSnapshot[key] && JSON.stringify(lastSnapshot[key]) !== JSON.stringify(val)) {
                const textDiv = existing.querySelector(".msg-text");
                const editedSpan = existing.querySelector(".edited-label");
                if (textDiv) {
                    let safeText = (val.text || "")
                        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    safeText = safeText.replace(
                        /&lt;i\s+class="([^"]*(?:fa|bi)[^"]+)"(?:\s+style="([^"]*)")?(?:\s+title="([^"]*)")?\s*&gt;&lt;\/i&gt;/g,
                        (match, cls, style, title) => {
                            let attrs = `class="${cls}"`;
                            if (style) attrs += ` style="${style}"`;
                            if (title) attrs += ` title="${title}"`;
                            return `<i ${attrs}></i>`;
                        }
                    );
                    safeText = safeText.replace(
                        /&lt;p\s+style="color:\s*([^";]+)\s*;"\s*&gt;([\s\S]*?)&lt;\/p&gt;/gi,
                        (match, color, content) => `<p style="color:${color.replace(/[^a-zA-Z0-9#(),.%\s]/g, "")}; margin-bottom:0px;">${content}</p>`
                    );
                    safeText = safeText.replace(/\n/g, "<br>");
                    const mentionRegex = /@([^\s<]+)/g;
                    safeText = safeText.replace(mentionRegex, (match, name) => {
                        const isSelfMention = currentName && (
                            currentName.toLowerCase() === name.toLowerCase() ||
                            currentName.toLowerCase() === name.toLowerCase().replace(" 💎", "")
                        );
                        return `<span class="${isSelfMention ? "mention-self" : "mention"}">@${name}</span>`;
                    });
                    textDiv.innerHTML = safeText;
                    if (editedSpan) editedSpan.textContent = val.edited ? "(Edited)" : "";
                }
                const reactRow = existing.querySelector(".reactions-row");
                if (reactRow) renderReactionsInRow(reactRow, val.reactions);
            }
        }
        for (const key of Object.keys(lastSnapshot)) {
            if (!newData[key]) {
                const el = document.getElementById("msg-" + key);
                if (el) el.remove();
            }
        }
        lastSnapshot = { ...newData };
    }, "messages");
    currentListeners.added = ws;
}
function playNotificationSound() {
    const audio = new Audio("https://codehs.com/uploads/47d60c5093ca59dfa2078b03c0264f64");
    audio.play().catch(err => {
        console.warn("Autoplay Prevented:", err);
    });
}
function attachPrivateMessageListener(uid) {
    if (privateListeners.has(uid)) return;
    privateListeners.add(uid);
    const [a, b] = [currentUser.uid, uid].sort();
    const path = `private/${a}/${b}`;
    let lastKeys = new Set();
    dbListen(path, (data) => {
        if (!data) return;
        for (const key of Object.keys(data)) {
            if (!lastKeys.has(key)) {
                lastKeys.add(key);
                const msg = data[key];
                if (msg && msg.sender !== currentUser.uid) {
                    playNotificationSound();
                }
            }
        }
    });
}
async function sendPrivateMessage(otherUid, text) {
    if (!currentUser || !otherUid) return;
    if (otherUid === currentUser.uid) {
        showError("You Cannot Send Private Messages To Yourself!");
        return;
    }
    const [a, b] = [currentUser.uid, otherUid].sort();
    const path = `private/${a}/${b}`;
    const existingEmail = await dbGet(`users/${currentUser.uid}/settings/userEmail`);
    if (!existingEmail) {
        await dbSet(`users/${currentUser.uid}/settings/userEmail`, currentUser.email);
    }
    const msg = {
        sender: currentUser.uid,
        text,
        timestamp: Date.now()
    };
    await dbPush(path, msg);
    await dbUpdate(`metadata/${currentUser.uid}/privateChats/${otherUid}`, {
        lastRead: Date.now(),
        unreadCount: 0
    });
    const recipientMeta = await dbGet(`metadata/${otherUid}/privateChats/${currentUser.uid}`) || {};
    await dbSet(`metadata/${otherUid}/privateChats/${currentUser.uid}`, {
        ...recipientMeta,
        lastRead: recipientMeta.lastRead || 0,
        unreadCount: (recipientMeta.unreadCount || 0) + 1
    });
}
async function openPrivateChat(uid, name) {
    if (!currentUser || !uid) return;
    if (uid === currentUser.uid) {
        showError("You Cannot Open A Private Chat With Yourself!");
        return;
    }
    currentPrivateUid = uid;
    currentPrivateName = name || null;
    chatLog.innerHTML = "";
    const [a, b] = [currentUser.uid, uid].sort();
    currentPath = `private/${a}/${b}`;
    attachMessageListeners(currentPath);
    await dbUpdate(`metadata/${currentUser.uid}/privateChats/${uid}`, {
        lastRead: Date.now(),
        unreadCount: 0
    });
}
async function updatePrivateListFromSnapshot(chatsSnapshot) {
    if (!chatsSnapshot) return;
    const chats = chatsSnapshot;
    for (const otherUid of Object.keys(chats)) {
        const meta = chats[otherUid] || {};
        let li = privateList.querySelector(`li[data-uid="${otherUid}"]`);
        const name = await getDisplayName(otherUid);
        if (!li) {
            li = document.createElement("li");
            li.dataset.uid = otherUid;
            const left = document.createElement("div");
            left.className = "left";
            const usernameSpan = document.createElement("span");
            usernameSpan.className = "username";
            left.appendChild(usernameSpan);
            li.appendChild(left);
            const closeBtn = document.createElement("button");
            closeBtn.className = "closeBtn";
            closeBtn.innerHTML = `<i class="bi bi-x-circle" title="Close PM"></i>`;
            closeBtn.onclick = async (e) => {
                e.stopPropagation();
                showConfirm(`Close Private Chat With ${name}? Messages Will Still Be Saved`, function(result) {
                    if (result) {
                        dbDelete(`metadata/${currentUser.uid}/privateChats/${otherUid}`);
                        showSuccess("Chat Closed");
                    } else {
                        showSuccess("Canceled");
                    }
                });
            };
            li.appendChild(closeBtn);
            li.onclick = () => openPrivateChat(otherUid, name);
            privateList.appendChild(li);
            attachPrivateMessageListener(otherUid);
        }
        const left = li.querySelector(".left");
        const usernameSpan = left.querySelector(".username");
        usernameSpan.textContent = name;
        const oldDot = left.querySelector(".notifDot");
        if (oldDot) oldDot.remove();
        const unreadCount = Number(meta.unreadCount || 0);
        if (unreadCount > 0 && currentPrivateUid !== otherUid) {
            const dot = document.createElement("span");
            dot.className = "notifDot";
            dot.textContent = "•";
            left.prepend(dot);
        }
        if (channelList.querySelector(".active")) {
            channelList.querySelector(".active").classList.toggle("active");
        }
        li.classList.toggle("active", currentPrivateUid === otherUid);
    }
}
function startChannelListeners() {
    dbListen("channels", () => {
        renderChannelsFromDB();
    }, "others");
    let lastChannelKeys = null;
    dbListen("channels", (data) => {
        const keys = data ? Object.keys(data) : [];
        if (lastChannelKeys !== null) {
            for (const removed of lastChannelKeys) {
                if (!keys.includes(removed)) {
                    if (currentPath && currentPath === `messages/${removed}`) {
                        switchChannel("General");
                        scrollToBottom();
                    }
                    renderChannelsFromDB();
                }
            }
        }
        lastChannelKeys = keys;
    });
}
function openChannelSettings(channel, data) {
    const overlay = document.createElement("div");
    overlay.className = "channelOverlay";
    overlay.innerHTML = `
        <div class="channelModal">
            <center>
                <h2>
                    Edit ${channel}
                </h2>
            </center>
            <br>
            <input id="channelNameInput" class="form-control" value="${channel}" placeholder="Channel Name" style="width:100%; padding:6px;margin-bottom:10px;">
            <br>
            <center>
                <h3>
                    Read
                </h3>
            </center>
            <hr>
            <br>
            ${renderRoleCheckboxes("read")}
            <center>
                <h3>
                    Write
                </h3>
            </center>
            <hr>
            <br>
            ${renderRoleCheckboxes("write")}
            <div style="display:flex; flex-direction:column; width:100%;">
                <button id="saveSettings">
                    Save
                </button>
                <br>
                <button id="deleteChannel" style="background:#a00; color:white;">
                    Delete Channel
                </button>
                <br>
                <button id="cancelSettings">
                    Cancel
                </button>
                <br>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    for (let key in data.read || {}) {
        const el = overlay.querySelector(`input[data-read="${key}"]`);
        if (el) el.checked = true;
    }
    for (let key in data.write || {}) {
        const el = overlay.querySelector(`input[data-write="${key}"]`);
        if (el) el.checked = true;
    }
    document.getElementById("cancelSettings").onclick = () => overlay.remove();
    document.getElementById("deleteChannel").onclick = async () => {
        showConfirm(`Delete "${channel}"? This cannot be undone.`, async (result) => {
            if (!result) return;
            try {
                await dbDelete(`channels/${channel}`);
                await dbDelete(`messages/${channel}`);
                if (currentPath === `messages/${channel}`) {
                    switchChannel("General");
                }
                overlay.remove();
                showSuccess("Channel Deleted");
            } catch (err) {
                showError("Failed To Delete Channel:", err);
            }
        });
    };
    document.getElementById("saveSettings").onclick = async () => {
        const newName = document.getElementById("channelNameInput").value.trim();
        const read = getSelectedRoles("read");
        const write = getSelectedRoles("write");
        if (Object.keys(read).length === 0) read.verified = true;
        if (Object.keys(write).length === 0) write.verified = true;
        try {
            if (newName && newName !== channel) {
                const oldData = await dbGet(`channels/${channel}`) || {};
                await dbSet(`channels/${newName}`, { ...oldData, read, write });
                await dbDelete(`channels/${channel}`);
                const oldMsgs = await dbGet(`messages/${channel}`);
                if (oldMsgs) {
                    await dbSet(`messages/${newName}`, oldMsgs);
                    await dbDelete(`messages/${channel}`);
                }
                switchChannel(newName);
            } else {
                await dbUpdate(`channels/${channel}`, { read, write });
            }
            overlay.remove();
        } catch (err) {
            showError("Failed To Save Channel Settings:", err);
        }
    };
}
async function hasPermission(channelData, type) {
    if (!channelData) return true;
    if (!currentUser) return false;
    const meta = await getUserMeta(currentUser.uid);
    if (meta.owner || meta.tester || meta.coOwner) {
        return true;
    }
    const perms = channelData[type] || {};
    if (perms.verified) return true;
    const userRoles = {
        isOwner: meta.owner,
        isTester: meta.tester,
        isCoOwner: meta.coOwner,
        isHAdmin: meta.hAdmin,
        isAdmin: meta.admin,
        isDev: meta.dev,
        isPartner: meta.partner,
        premium1: meta.premium1,
        premium2: meta.premium2,
        premium3: meta.premium3,
        isDonater: meta.donor,
        isSus: meta.sus,
        mileStone: meta.milestone,
        isGuesser: meta.guesser,
        isUploader: meta.uploader,
        isLink: meta.linker,
        secure: meta.secure,
        guardian: meta.guardian,
        lanschool: meta.lanschool,
        linewize: meta.linewize,
        blocksi: meta.blocksi
    };
    for (const role in perms) {
        if (perms[role] === true && userRoles[role]) {
            return true;
        }
    }
    return false;
}
async function renderChannelsFromDB() {
    if (renderingChannels) return;
    renderingChannels = true;
    if (!channelList.querySelector("li")) {
        channelList.innerHTML = "";
    }
    const chans = await dbGet("channels") || {};
    if (!("General" in chans)) {
        await dbSet("channels/General", true);
        chans.General = true;
    }
    const keys = Object.keys(chans).sort();
    for (const ch of keys) {
        const chData = chans[ch];
        if (!(await hasPermission(chData, "read"))) continue;
        if (channelList.querySelector(`li[data-channel="${CSS.escape(ch)}"]`)) {
            continue;
        }
        const li = document.createElement("li");
        const textNode = document.createTextNode("" + ch);
        li.appendChild(textNode);
        li.setAttribute("data-channel", ch);
        li.onclick = () => {
            currentPrivateUid = null;
            switchChannel(ch);
            if (channelList.querySelector(".active")) {
                channelList.querySelector(".active").classList.toggle("active");
            }
            if (privateList.querySelector(".active")) {
                privateList.querySelector(".active").classList.toggle("active");
            }
            li.classList.add("active");
        };
        if (!currentPrivateUid && currentPath === `messages/${ch}`) {
            li.classList.add("active");
        }
        if ((isOwner || isCoOwner || isTester) && ch !== "General") {
            const btnWrap = document.createElement("span");
            btnWrap.style.marginLeft = "10px";
            const settingsBtn = document.createElement("button");
            settingsBtn.innerHTML = `<i class='bi bi-gear' title='Open Settings For #${ch}'></i>`;
            settingsBtn.style.background = "none";
            settingsBtn.style.border = "none";
            settingsBtn.style.padding = "0px";
            settingsBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const data = await dbGet(`channels/${ch}`) || {};
                openChannelSettings(ch, data);
            });
            btnWrap.appendChild(settingsBtn);
            li.appendChild(btnWrap);
        }
        channelList.appendChild(li);
    }
    if (isOwner || isCoOwner || isTester) {
        addChannelBtn.style.display = "inline-block";
    } else {
        addChannelBtn.style.display = "none";
    }
    renderingChannels = false;
}
async function switchChannel(ch) {
    if (isRestrictedChannel(ch) && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isDev || isPre2 || isPre3)) {
        showError("You Don't Have Permission To Access That Channel.");
        ch = "General";
    }
    currentPrivateUid = null;
    currentPrivateName = null;
    chatLog.innerHTML = "";
    currentPath = `messages/${ch}`;
    if (isRestrictedChannel(ch) && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isDev || isPre2 || isPre3)) {
        return;
    } else {
        attachMessageListeners(currentPath);
    }
    if (typingRef) {
        try {
            if (typingRef.close) typingRef.close();
        } catch (e) {}
        typingRef = null;
    }
    let typingVisibleTimeout = null;
    typingRef = await dbListen(`typing/${ch}`, (typingUsers) => {
        const names = Object.values(typingUsers || {})
            .filter(u => u && u.name)
            .map(u => u.name);
        const uniqueNames = [...new Set(names)];
        if (uniqueNames.length > 0) {
            typingIndicator.textContent =
                uniqueNames.length === 1
                    ? `${uniqueNames[0]} Is Typing...`
                    : `${uniqueNames.join(", ")} Are Typing...`;
            typingIndicator.style.display = "block";
            if (typingVisibleTimeout) clearTimeout(typingVisibleTimeout);
            typingVisibleTimeout = setTimeout(() => {
                typingIndicator.style.display = "none";
            }, 2500);
        } else {
        }
    });
    clearChannelMention(ch);
    renderChannelsFromDB();
}
function startMetadataListener() {
    if (metadataListenerRef) return;
    const path = `metadata/${currentUser.uid}/privateChats`;
    metadataListenerRef = true;
    dbListen(path, (val) => {
        updatePrivateListFromSnapshot(val || null);
    }, "privateChats");
}
sendBtn.onclick = async () => {
    if (!currentPath || !currentUser) return;
    let text = chatInput.value.trim();
    if (!text) return;
    const muted = await isUserMuted(currentUser.uid);
    if (muted) {
        showError("You Are Muted And Cannot Send Messages Right Now.");
        return;
    }
    if (!isAdmin && !isHAdmin && !isOwner && !isCoOwner && !isTester) {
        const now = Date.now();
        if (now - lastMessageTimestamp < MESSAGE_COOLDOWN) {
            showError("You Can Only Send A Message Every 3 Seconds.");
            return;
        }
        lastMessageTimestamp = now;
    }
    const mentions = text.match(/@\w+/g);
    if (mentions && mentions.length > 1) {
        showError("Only One Mention Per Message Is Allowed.");
        chatInput.value = "";
        return;
    }
    if (text.length > 1000 && !(isCoOwner || isOwner || isHAdmin || isTester)) {
        showError(`Your Message Is Too Long (${text.length} Characters). Please Keep It Under 1000.`);
        chatInput.value = "";
        return;
    }
    const existingEmail = await dbGet(`users/${currentUser.uid}/settings/userEmail`);
    if (!existingEmail) {
        await dbSet(`users/${currentUser.uid}/settings/userEmail`, currentUser.email);
    }
    let outgoingText = text;
    outgoingText = outgoingText.replace(/@Hacker41(\b(?!\s*💎))/gi, "@Hacker41 💎");
    const msg = {
        sender: currentUser.uid,
        text: outgoingText,
        timestamp: Date.now(),
        reply: replyMsgId || null
    };
    if (currentPrivateUid) {
        await sendPrivateMessage(currentPrivateUid, outgoingText);
    } else {
        const ch = currentPath.split("/")[1];
        const chData = await dbGet(`channels/${ch}`);
        if (!(await hasPermission(chData, "write"))) {
            showError("You Cannot Send Messages In This Channel.");
            return;
        }
        await dbPush(currentPath, msg);
    }
    chatInput.value = "";
    toggleReply();
    if (currentUser && currentPath.startsWith("messages/")) {
        const channelName = currentPath.split("/")[1];
        dbDelete(`typing/${channelName}/${currentUser.uid}`);
    }
};
chatInput.addEventListener("input", () => {
    const mentions = chatInput.value.match(/@\w+/g);
    if (mentions && mentions.length > 1) {
        showError("Only One Mention Per Message Is Allowed.");
        chatInput.value = "";
    }
});
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (e.shiftKey) {
            const start = chatInput.selectionStart;
            const end = chatInput.selectionEnd;
            chatInput.value = chatInput.value.substring(0, start) + "\n" + chatInput.value.substring(end);
            chatInput.selectionStart = chatInput.selectionEnd = start + 1;
            e.preventDefault();
        } else {
            e.preventDefault();
            sendBtn.click();
        }
    } else if (e.key === "#") {
        triggerIndex = chatInput.selectionStart;
        mentionActive = true;
        setTimeout(() => {
            showChannelMentionMenu();
        }, 0);
    } else if (e.key === "Tab") {
        if (currentPrivateUid && currentPrivateName) {
            e.preventDefault();
            const pos = chatInput.selectionStart;
            const text = chatInput.value;
            let i = pos - 1;
            while (i >= 0 && /\S/.test(text[i])) i--;
            const tokenStart = i + 1;
            const token = text.substring(tokenStart, pos);
            if (token.startsWith("@")) {
                const nameToInsert = "@" + currentPrivateName.replace(/ 💎/g, "");
                const newValue = text.substring(0, tokenStart) + nameToInsert + text.substring(pos);
                chatInput.value = newValue;
                const newPos = tokenStart + nameToInsert.length;
                chatInput.selectionStart = chatInput.selectionEnd = newPos;
            } else {
            }
        }
    }
});
chatInput.addEventListener("input", () => {
    if (!currentUser || !currentPath || !currentPath.startsWith("messages/")) return;
    const ch = currentPath.split("/")[1];
    const typingPath = `typing/${ch}/${currentUser.uid}`;
    dbSet(typingPath, { name: currentName, typing: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        dbDelete(typingPath);
    }, 3000);
});
chatInput.addEventListener("input", () => {
    const value = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const justTypedAt = value.slice(0, cursorPos).endsWith("@");
    const afterAt = /@[\w\d_-]{1,20}$/.test(value.slice(0, cursorPos));
    if (currentPrivateUid && justTypedAt) {
        mentionHint.textContent = `Press Tab To Mention ${currentPrivateName || "This User"}`;
        mentionHint.style.display = "block";
    } else if (!afterAt) {
        mentionHint.style.display = "none";
    }
});
chatInput.addEventListener("blur", () => {
    mentionHint.style.display = "none";
});
onAuthStateChanged(auth, async user => {
    if (!user) { 
        showError("Not Logged In!"); 
        setTimeout(() => location.href = "InfiniteLogins.html?chat=true", 1000);
        return; 
    }
    currentUser = user;
    const [profile, settings] = await Promise.all([
        dbGet(`users/${user.uid}/profile`),
        dbGet(`users/${user.uid}/settings`)
    ]);
    const p = profile || {};
    const s = settings || {};
    isOwner = !!p.isOwner;
    if (user.email === "infinitecodehs@gmail.com") isOwner = true;
    isCoOwner = !!p.isCoOwner;
    isAdmin = !!p.isAdmin;
    isHAdmin = !!p.isHAdmin;
    isTester = !!p.isTester;
    isDev = !!p.isDev;
    isPre1 = !!p.premium1;
    isPre2 = !!p.premium2;
    isPre3 = !!p.premium3;
    isSus = !!p.isSus;
    isPartner = !!p.isPartner;
    isLinker = !!p.isLink;
    isVerified = !!p.verified;
    if (!isVerified) {
        verifiedOverlay.style.display = "flex";
        document.body.appendChild(verifiedOverlay);
        verifiedOverlay.appendChild(verifiedMessage);
    }
    adminControls.style.display = (isAdmin || isOwner || isCoOwner || isHAdmin || isTester) ? "flex" : "none";
    addChannelBtn.style.display = (isCoOwner || isOwner || isTester) ? "inline-block" : "none";
    await ensureDisplayName(user);
    await loadMentionSetting(user);
    await loadAllUsernames(); 
    startChannelListeners();
    await renderChannelsFromDB();
    if (currentPath && ((currentPath.includes("messages/Admin-Chat")) || (currentPath.includes("messages/Premium-Chat"))) && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isDev || isPre3 || isPre2)) {
        switchChannel("General");
    }
    if (!currentPath) {
        const _urlParams = new URLSearchParams(window.location.search);
        const _dmUid = _urlParams.get("dm");
        const _channel = _urlParams.get("channel");
        const _msgId = window.location.hash.replace("#msg-", "").trim() || null;
        if (_dmUid) {
            getDisplayName(_dmUid).then(name => {
                openPrivateChat(_dmUid, name).then(() => {
                    if (_msgId) scrollToMessage(_msgId);
                });
            });
        } else if (_channel) {
            switchChannel(decodeURIComponent(_channel)).then ? 
                switchChannel(decodeURIComponent(_channel)).then(() => {
                    if (_msgId) scrollToMessage(_msgId);
                }) :
                (() => {
                    switchChannel(decodeURIComponent(_channel));
                    if (_msgId) setTimeout(() => scrollToMessage(_msgId), 800);
                })();
        } else if (_msgId) {
            switchChannel("General");
            setTimeout(() => scrollToMessage(_msgId), 800);
        } else {
            switchChannel("General");
        }
        if (_dmUid || _channel || _msgId) {
            history.replaceState(null, "", window.location.pathname);
        }
    }
    startMetadataListener();
    dbListen(`mentions/${currentUser.uid}`, (data) => {
        if (data) console.log("Mention: ", data);
    });
    const storedUid = localStorage.getItem("openPrivateChatUid");
    if (storedUid) {
        getDisplayName(storedUid).then(name => {
            openPrivateChat(storedUid, name);
        });
        localStorage.removeItem("openPrivateChatUid");
    }
    let displayName = p.displayName || user.email;
    if (!displayName || displayName.trim() === "") displayName = "Spam Account";
    const bioDisplay = p.bio || "Bio Not Set";
    const DNC = s.color || "#ffffff";
    roleSpan.textContent = isSus ? "Suspicious Account" : (isOwner ? "Owner" : (isAdmin ? "Admin" : (isCoOwner ? "Co-Owner" : (isHAdmin ? "Head Admin" : (isTester ? "Tester" : (isPartner ? "Partner" :(isDev ? "Developer" :(isPre3 ? "Premium T3" :(isPre2 ? "Premium T2" :(isPre1 ? "Premium T1" :(isLinker ? "Link Sharer" : "User")))))))))));
    roleSpan.style.color = isSus ? "red" : (isOwner ? "lime" : (isAdmin ? "dodgerblue" : (isCoOwner ? "lightblue" : (isHAdmin ? "#00cc99" : (isTester ? "darkGoldenRod" : (isPartner ? "cornflowerblue" :(isDev ? "green" :(isPre3 ? "red" :(isPre2 ? "orange" :(isPre1 ? "yellow" :(isLinker ? "#4fa3ff": "white")))))))))));
    bioSpan.textContent = bioDisplay;
    bioSpan.style.color = "gray";
    bioSpan.style.fontSize = "60%";
    usernameSpan.textContent = displayName;
    usernameSpan.style.color = DNC;
    const pfpIndex = (p.pic !== undefined && p.pic !== null) ? p.pic : 0;
    let profilePics = [];
    async function loadProfilePics() {
        const pfpDate = Date.now();
        try {
            const res = await fetch(`${pfpDomain}/index.json?t=${pfpDate}`);
            const files = await res.json();
            profilePics = files.map(file => `${pfpDomain}/${file}`);
        } catch (e) {
            console.error("Failed To Load Profile Pics:", e);
            profilePics = [`${pfpDomain}/1.jpeg?t=${pfpDate}`];
        }
    }
    await loadProfilePics();
    const sidebarPfp = document.getElementById("sidebarPfp");
    sidebarPfp.style.border = `2px solid ${DNC}`;
    if (sidebarPfp) {
        const safeIndex = pfpIndex >= 0 && pfpIndex < profilePics.length ? pfpIndex : 0;
        sidebarPfp.src = profilePics[safeIndex] + "?t=" + Date.now();    
    }
});
async function loadAllUsernames() {
    const data = dbGet("users");
    allUsernames = [];
    if (data) {
        for (const uid of Object.keys(data)) {
            if (data[uid].profile && data[uid].profile.displayName) {
                allUsernames.push(data[uid].profile.displayName);
            }
        }
    }
}
addChannelBtn.onclick = async () => {
    if (!(isOwner || isCoOwner || isTester)) return;
    const overlay = document.createElement("div");
    overlay.className = "channelOverlay";
    overlay.innerHTML = `
        <div class="channelModal">
            <center>
                <h2>
                    Create Channel
                </h2>
            </center>
            <hr>
            <br>
            <input id="channelNameInput" class="form-control" placeholder="Channel Name" />
            <br>
            <center>
                <h3>
                    Read Permissions
                </h3>
            </center>
            <hr>
            <br>
            ${renderRoleCheckboxes("read")}
            <center>
                <h3>
                    Write Permissions
                </h3>
            </center>
            <hr>
            <br>
            ${renderRoleCheckboxes("write")}
            <div style="display:flex;flex-direction:column;width:100%">
                <button id="createChannelConfirm">
                    Create
                </button>
                <br>
                <button id="cancelCreate">
                    Cancel
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("cancelCreate").onclick = () => overlay.remove();
    document.getElementById("createChannelConfirm").onclick = async () => {
        const name = document.getElementById("channelNameInput").value.trim();
        if (!name) return;
        const read = getSelectedRoles("read");
        const write = getSelectedRoles("write");
        if (Object.keys(read).length === 0) read.verified = true;
        if (Object.keys(write).length === 0) write.verified = true;
        await dbSet(`channels/${name}`, { read, write });
        overlay.remove();
    };
};
function renderRoleCheckboxes(type) {
    const roles = [
        "isOwner",
        "isTester",
        "isCoOwner",
        "isHAdmin",
        "isAdmin",
        "isDev",
        "isPartner",
        "premium3",
        "premium2",
        "premium1",
        "isDonater",
        "isSus",
        "mileStone",
        "isGuesser",
        "isUploader",
        "isLink",
        "secure",
        "guardian",
        "lanschool",
        "linewize",
        "blocksi",
        "verified"
    ];
    const roleNames = {
        isOwner: "Owner",
        isTester: "Tester",
        isCoOwner: "Co-Owner",
        isHAdmin: "Head Admin",
        isAdmin: "Admin",
        isDev: "Developer",
        isPartner: "Partner",
        premium3: "Premium T3",
        premium2: "Premium T2",
        premium1: "Premium T1",
        isDonater: "Donator",
        isSus: "Suspicious User",
        mileStone: "Award Badge",
        isGuesser: "Guesser",
        isUploader: "Uploader",
        isLink: "Link Sharer",
        secure: "Securely",
        guardian: "GoGuardian",
        lanschool: "Lanschool",
        linewize: "Linewize",
        blocksi: "Blocksi",
        verified: "Verified Users"
    };
    return roles.map(r => `
        <div style="margin-bottom:20px;">
            <label class="switch">
                <input type="checkbox" data-${type}="${r}">
                <span class="slider"></span>
            </label>
            ${roleNames[r] || r}
        </div>
    `).join("");
}
function getSelectedRoles(type) {
    const selected = {};
    document.querySelectorAll(`input[data-${type}]`).forEach(cb => {
        if (cb.checked) {
            selected[cb.dataset[type]] = true;
        }
    });
    return selected;
}
chatInput.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
            e.preventDefault();
            showError("You Cannot Paste Images Unfortunately.");
            return;
        }
    }
});
chatInput.addEventListener("input", () => {
    const value = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const lastAt = value.lastIndexOf("@", cursorPos - 1);
    if (lastAt === -1) {
        mentionMenu.style.display = "none";
        mentionActive = false;
        return;
    }
    mentionActive = true;
    triggerIndex = lastAt;
    const typed = value.slice(lastAt + 1, cursorPos).toLowerCase();
    const matches = allUsernames.filter(name =>
        name.toLowerCase().startsWith(typed)
    );
    if (matches.length === 0) {
        mentionMenu.style.display = "none";
        return;
    }
    renderMentionMenu(matches);
});
function renderMentionMenu(names) {
    mentionMenu.innerHTML = "";
    const supportItem = document.createElement("div");
    supportItem.className = "mention-item";
    supportItem.style.padding = "5px 8px";
    supportItem.style.cursor = "pointer";
    supportItem.style.borderBottom = "1px solid rgb(51,51,51)";
    supportItem.style.display = "flex";
    supportItem.style.justifyContent = "space-between";
    supportItem.style.alignItems = "center";
    const left = document.createElement("span");
    left.textContent = "@support";
    const right = document.createElement("span");
    right.textContent = "Request Support From Staff";
    right.style.fontSize = "0.75em";
    right.style.color = "#888";
    supportItem.appendChild(left);
    supportItem.appendChild(right);
    supportItem.onmouseenter = () => supportItem.style.background = "#333";
    supportItem.onmouseleave = () => supportItem.style.background = "transparent";
    supportItem.onclick = () => {
        const start = triggerIndex;
        const end = chatInput.selectionStart;
        const before = chatInput.value.substring(0, start);
        const after = chatInput.value.substring(end);
        const insert = "@support ";
        chatInput.value = before + insert + after;
        const newPos = before.length + insert.length;
        chatInput.selectionStart = chatInput.selectionEnd = newPos;
        mentionMenu.style.display = "none";
        mentionActive = false;
    };
    mentionMenu.appendChild(supportItem);
    names.forEach(name => {
        const item = document.createElement("div");
        item.textContent = name;
        item.style.padding = "5px 8px";
        item.style.cursor = "pointer";
        item.style.borderBottom = "1px solid #333";
        item.onmouseenter = () => item.style.background = "#333";
        item.onmouseleave = () => item.style.background = "transparent";
        item.onclick = () => {
            autocompleteMention(name);
        };
        mentionMenu.appendChild(item);
    });
    mentionMenu.style.display = "flex";
}
function autocompleteMention(name) {
    const value = chatInput.value;
    const before = value.slice(0, triggerIndex);
    const after = value.slice(chatInput.selectionStart);
    chatInput.value = before + "@" + name + " " + after;
    mentionMenu.style.display = "none";
    mentionActive = false;
    const pos = (before + "@" + name + " ").length;
    chatInput.setSelectionRange(pos, pos);
    chatInput.focus();
}
document.addEventListener("click", (e) => {
    if (!mentionMenu.contains(e.target) && e.target !== chatInput) {
        mentionMenu.style.display = "none";
        mentionActive = false;
    }
});
setInterval(async () => {
    if (currentUser) {
        const token = await getAuthToken();
        const res = await fetch(`${a}/online`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if (!res.ok) {
            throw new Error("Online Indicator Post Failed");
        }
    }
}, 20000);
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", async (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === "notificationAction") {
            const { action, notifData } = data;
            if (!notifData) return;
            if (action === "verify" && notifData.uid) {
                try {
                    const token = await getAuthToken();
                    if (!token) { showError("Not Logged In"); return; }
                    const res = await fetch(`${a}/admin/verify-user`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ uid: notifData.uid })
                    });
                    const json = await res.json();
                    if (res.ok) {
                        showSuccess(json.message || "User Verified");
                    } else {
                        showError(json.error || "Verification Failed");
                    }
                } catch (e) {
                    showError("Verify failed: " + (e?.message || e));
                }
                return;
            }
            if (notifData.url) {
                window.location.href = notifData.url;
            }
        }
        if (data.type === "notificationClick") {
            const url = data.url || (data.notifData && data.notifData.url);
            if (url) window.location.href = url;
        }
    });
    navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
            registration.active.postMessage({ type: "chatReady" });
        }
    }).catch(() => {});
}