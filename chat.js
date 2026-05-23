import { auth, onAuthStateChanged } from "/imports.js";
const sidebar = document.getElementById("sidebar");
const mobileToggle = document.getElementById("mobileToggle");
mobileToggle.onclick = () => {
    sidebar.classList.toggle("open");
};
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
const BACKEND = a;
const chatMsgFunctions = document.getElementById('chatMsgFunctions');
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
let pendingAttachFile = null;
let typingInterval = null;
let typingStopTimeout = null;
let currentColor = "#ffffff";
let currentListeners = {};
let currentMsgRef = null;
let currentName = "User";
let currentPath = null;
let currentPrivateName = null;
let currentPrivateUid = null;
let currentUser = null;
let isGuest = false;
const knownUserDisplayNames = new Set();
window.isGuest = isGuest;
window.currentUser = currentUser;
document.getElementById("profileRow").addEventListener("click", () => {
    if (currentUser && !isGuest) {
        window.location.href = "InfiniteAccounts.html?chat=true";
    }
});
let anonSessionToken = localStorage.getItem("anonSessionToken") || null;
let anonDisplayName = localStorage.getItem("anonDisplayName") || "Anonymous";
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
    const valueWithTs = { ...value, timestamp: Number(key) };
    await dbSet(path + "/" + key, valueWithTs);
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
        const tokenParam = token ? `&token=${token}` : "";
        const wsUrl = `${h}/?path=${encodeURIComponent(JSON.stringify(pathArray))}${tokenParam}`;
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
    let loadingBar = document.getElementById("__loadMoreIndicator");
    if (!loadingBar) {
        loadingBar = document.createElement("div");
        loadingBar.id = "__loadMoreIndicator";
        loadingBar.style.cssText = "text-align:center;padding:8px;color:#888;font-size:0.8em;";
        loadingBar.textContent = "Loading Messages";
    }
    chatLog.prepend(loadingBar);
    try {
        const savePath = currentPath;
        const res = await fetchAPI("load-more-messages", {
            path: pathToArray(currentPath),
            before: oldestLoadedTimestamp,
            limit: 25
        });
        if (currentPath !== savePath) { loadingBar.remove(); loadingOlderMessages = false; return; }
        const msgs = res.data;
        if (!msgs || (Array.isArray(msgs) && msgs.length === 0)) {
            hasMoreMessages = false;
            loadingBar.textContent = "No More Messages";
            setTimeout(() => loadingBar.remove(), 1500);
            loadingOlderMessages = false;
            return;
        }
        const entries = (Array.isArray(msgs) ? msgs : Object.entries(msgs).map(([id, v]) => ({ id, ...v })))
            .sort((a, b) => Number(a.timestamp || a.id) - Number(b.timestamp || b.id));
        if (entries.length === 0) {
            hasMoreMessages = false;
            loadingBar.remove();
            loadingOlderMessages = false;
            return;
        }
        const container = document.getElementById("chatLog");
        const oldHeight = container.scrollHeight;
        for (let i = entries.length - 1; i >= 0; i--) {
            const msg = entries[i];
            const id = msg.id;
            if (document.getElementById("msg-" + id)) continue;
            const div = await renderMessageInstant(id, msg);
            if (div) {
                loadingBar.insertAdjacentElement("afterend", div);
            }
        }
        if (entries.length < 25) hasMoreMessages = false;
        oldestLoadedTimestamp = Number(entries[0].timestamp || entries[0].id) - 1;
        const newHeight = container.scrollHeight;
        container.scrollTop += (newHeight - oldHeight);
        loadingBar.remove();
    } catch (e) {
        console.error("Load Older Messages Failed:", e);
        if (loadingBar) loadingBar.remove();
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
    if (document.getElementById("msg-" + id)) return null;
    if (id === "sender" || id === "text" || id === "timestamp" || id === "s" || id === "t") return null;
    if (!msg) return null;
    const isDiscordMsg = !!(msg.u !== undefined && msg.a !== undefined);
    const isAnonMsg = !!(( msg.anon === true || msg.sender === "anon") && !isDiscordMsg);
    const div = document.createElement("div");
    div.className = "msg" + (isDiscordMsg ? " msg-discord" : "");
    div.id = "msg-" + id;
    if (msg._discordMirrorId) div.dataset.discordMirrorId = String(msg._discordMirrorId);
    div.dataset.timestamp = msg.timestamp || Number(id) || Date.now();
    const topRow = document.createElement("div");
    topRow.id = "topRow";
    const leftWrapper = document.createElement("span");
    leftWrapper.style.display = "flex";
    leftWrapper.style.gap = "6px";
    leftWrapper.style.alignItems = "center";
    const profilePic = document.createElement("img");
    profilePic.style.width = "32px";
    profilePic.style.height = "32px";
    profilePic.style.borderRadius = "50%";
    profilePic.style.border = `2px solid #5865F2`;
    profilePic.style.objectFit = "cover";
    profilePic.style.cursor = isDiscordMsg ? "default" : "pointer";
    const nameSpan = document.createElement("span");
    nameSpan.id = "msgName";
    nameSpan.className = "highlight";
    nameSpan.style.cursor = isDiscordMsg ? "default" : "pointer";
    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp";
    const tsMs = msg.timestamp || Number(id) || Date.now();
    timeSpan.textContent = tsMs ? formatTimestamp(tsMs) : "";
    const msgBtns = document.createElement("div");
    msgBtns.id = 'msgBtns';
    const textDiv = document.createElement("div");
    textDiv.className = "msg-text";
    textDiv.style.whiteSpace = "pre-wrap";
    textDiv.style.overflowWrap = "anywhere";
    textDiv.style.marginLeft = "40px";
    textDiv.style.marginTop = "-5px";
    let editedSpan = null;
    if (msg.edited || msg.e) {
        editedSpan = document.createElement("span");
        editedSpan.className = "edited-label";
        editedSpan.style.fontSize = "0.72em";
        editedSpan.style.color = "#888";
        editedSpan.style.marginLeft = "40px";
    }
    const rawText = isDiscordMsg ? (msg.t || "") : (msg.t || msg.text || "");
    async function buildRichText(raw, textDivEl) {
        let safe = buildSafeText(raw);
        safe = await processChannelMentions(safe);
        textDivEl.innerHTML = safe;
        textDivEl.querySelectorAll("discord-embed-b64").forEach(el => {            try {
                const b64 = el.getAttribute("data") || "";
                const decoded = atob(b64);
                const wrapper = document.createElement("div");
                wrapper.innerHTML = decoded;
                el.replaceWith(wrapper.firstChild || wrapper);
            } catch {}
        });
        textDivEl.querySelectorAll(".mention-user").forEach(span => {
            span.style.cursor = "pointer";
            span.addEventListener("click", async () => {
                const name = span.dataset.name;
                const uid = await getUidByDisplayName(name);
                if (!uid) { showError("User Profile Not Found."); return; }
                window.location.href = `InfiniteAccounts.html?user=${uid}`;
            });
        });
        textDivEl.querySelectorAll(".channel-mention").forEach(span => {
            span.style.color = "#4fa3ff";
            span.style.cursor = "pointer";
            span.addEventListener("click", () => {
                const ch = span.dataset.channel;
                if (typeof switchChannel === "function") switchChannel(ch);
            });
        });
        textDivEl.querySelectorAll(".chat-img").forEach(img => {
            img.style.cursor = "pointer";
            img.addEventListener("click", () => {
                viewerImg.src = img.src;
                downloadBtn.href = img.src;
                downloadBtn.download = img.alt || "image";
                imgViewer.style.display = "flex";
            });
        });
        try {
            const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
            if (existingScript) existingScript.remove();
            if (textDivEl.querySelector(".tiktok-embed")) {
                const script = document.createElement("script");
                script.src = "https://www.tiktok.com/embed.js";
                script.async = true;
                document.body.appendChild(script);
            }
        } catch {}
        const previewCache = {};
        let previewDiv = document.querySelector(".link-preview-global");
        if (!previewDiv) {
            previewDiv = document.createElement("div");
            previewDiv.className = "link-preview-global";
            Object.assign(previewDiv.style, {
                position: "fixed", zIndex: "9999", display: "none", width: "320px",
                background: "rgba(20,20,20,0.95)", padding: "10px", borderRadius: "10px",
                border: "1px solid #333", boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                color: "#fff", transition: "opacity 0.15s ease", opacity: "0", pointerEvents: "none"
            });
            document.body.appendChild(previewDiv);
        }
        textDivEl.querySelectorAll("a[href]").forEach(link => {
            const url = link.href;
            link.addEventListener("mouseenter", async () => {
                const rect = link.getBoundingClientRect();
                previewDiv.style.top = `${rect.bottom + 6}px`;
                previewDiv.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;
                previewDiv.style.display = "block";
                previewDiv.style.opacity = "1";
                previewDiv.innerHTML = "Loading Preview...";
                if (!previewCache[url]) {
                    try {
                        const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
                        const data = await r.json();
                        if (data.status === "success" && data.data) {
                            const { title, description, image } = data.data;
                            previewCache[url] = { title, description, image };
                        } else { previewCache[url] = { error: "(No Preview Available)" }; }
                    } catch { previewCache[url] = { error: "(Preview Failed)" }; }
                }
                const info = previewCache[url];
                if (info.error) {
                    previewDiv.textContent = info.error;
                } else {
                    previewDiv.innerHTML = "";
                    const content = document.createElement("div");
                    content.style.cssText = "display:flex;align-items:center;gap:8px;";
                    if (info.image?.url) {
                        const img = document.createElement("img");
                        img.src = info.image.url;
                        img.style.cssText = "width:60px;height:60px;border:1px solid white;object-fit:cover;border-radius:6px;";
                        content.appendChild(img);
                    }
                    const details = document.createElement("div");
                    details.style.flex = "1";
                    if (info.title) { const t = document.createElement("div"); t.textContent = info.title; t.style.fontWeight = "bold"; details.appendChild(t); }
                    if (info.description) { const d = document.createElement("div"); d.textContent = info.description; d.style.cssText = "font-size:0.8em;color:#ccc;line-height:1.2em;"; details.appendChild(d); }
                    content.appendChild(details);
                    previewDiv.appendChild(content);
                }
            });
            link.addEventListener("mouseleave", () => {
                previewDiv.style.opacity = "0";
                setTimeout(() => { previewDiv.style.display = "none"; }, 150);
            });
            const showLinkMenu = (x, y) => {
                const old = document.querySelector(".link-context-menu");
                if (old) old.remove();
                const menu = document.createElement("div");
                menu.className = "link-context-menu";
                menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:#222;border:1px solid #555;border-radius:6px;padding:8px;color:#fff;z-index:9999;max-width:300px;word-break:break-all;`;
                menu.textContent = link.href;
                document.body.appendChild(menu);
                const close = () => { menu.remove(); document.removeEventListener("click", close); };
                setTimeout(() => { document.addEventListener("click", close); }, 0);
            };
            link.addEventListener("contextmenu", (e) => { e.preventDefault(); showLinkMenu(e.clientX, e.clientY); });
            let pressTimer = null;
            link.addEventListener("touchstart", (e) => { pressTimer = setTimeout(() => { const t = e.touches[0]; showLinkMenu(t.clientX, t.clientY); }, 500); });
            link.addEventListener("touchend", () => clearTimeout(pressTimer));
            link.addEventListener("touchmove", () => clearTimeout(pressTimer));
        });
    }
    buildRichText(rawText, textDiv).then(() => {
        initAudioPlayers(textDiv);
    }).catch(() => { 
        textDiv.innerHTML = buildSafeText(rawText);
        initAudioPlayers(textDiv);
    });
    if (msg.edited || msg.e) editedSpan.textContent = "(Edited)";
    topRow.appendChild(leftWrapper);
    topRow.appendChild(timeSpan);
    leftWrapper.appendChild(profilePic);
    leftWrapper.appendChild(nameSpan);
    if (isAnonMsg) {
        profilePic.src = "/pfps/1.jpeg";
        profilePic.onerror = () => { profilePic.src = ""; profilePic.style.display = "none"; };
        nameSpan.textContent = msg.u || "Anonymous";
        nameSpan.style.color = "#aaa";
        nameSpan.style.cursor = "default";
        const anonBadge = document.createElement("span");
        anonBadge.title = "Guest message (Not Logged In)";
        anonBadge.style.marginLeft = "4px";
        anonBadge.style.fontSize = "0.75em";
        anonBadge.style.color = "#888";
        anonBadge.style.background = "rgba(255,255,255,0.07)";
        anonBadge.style.borderRadius = "4px";
        anonBadge.style.padding = "1px 4px";
        anonBadge.textContent = "guest";
        leftWrapper.appendChild(anonBadge);
    } else if (isDiscordMsg) {
        profilePic.src = `${BACKEND}${msg.a}` || "/res/discord.png";
        profilePic.onerror = () => { profilePic.src = "/res/discord.png"; };
        nameSpan.textContent = msg.u || "This Message Is From The Discord";
        nameSpan.style.color = "#5865F2";
        const discordBadge = document.createElement("span");
        discordBadge.innerHTML = `<i class="bi bi-discord" style="color:#5865F2" title="This Message Is From The Discord"></i>`;
        discordBadge.style.marginLeft = "4px";
        leftWrapper.appendChild(discordBadge);
        if (msg.r) {
            (async () => {
                const replyTs = msg.r;
                try {
                    const rData = await dbGet(`${currentPath}/${replyTs}`);
                    if (rData) {
                        const rName = rData.u || (rData.s ? await getDisplayName(rData.s) : "Unknown");
                        let rText;
                        if (rData.file || rData.fileUrl || rData.attachment) {
                            rText = '<span style="color:#4fa3ff;">Click To View Attachment</span>';
                        } else {
                            rText = buildReplyPreviewText((rData.t || rData.text || "").substring(0, 120));
                        }
                        const replyPreview = document.createElement("div");
                        replyPreview.style.display = "flex";
                        replyPreview.style.cursor = "pointer";
                        replyPreview.style.gap = "5px";
                        replyPreview.onclick = () => scrollToMessage(String(replyTs));
                        const arrow = document.createElement("span");
                        arrow.style.width = "30px";
                        arrow.style.marginLeft = "15px";
                        arrow.style.height = "8px";
                        arrow.style.marginTop = "11px";
                        arrow.style.borderTop = "1px solid #aaa";
                        arrow.style.borderLeft = "1px solid #aaa";
                        arrow.style.borderTopLeftRadius = "10px";
                        const reply = document.createElement("span");
                        reply.style.fontSize = "0.8em";
                        reply.style.marginRight = "44px";
                        reply.style.color = "#aaa";
                        reply.style.whiteSpace = "nowrap";
                        reply.style.overflow = "hidden";
                        reply.style.textOverflow = "ellipsis";
                        reply.style.maxWidth = "100%";
                        reply.innerHTML = `Replying To: @${rName}: ${rText}`;
                        replyPreview.appendChild(arrow);
                        replyPreview.appendChild(reply);
                        div.prepend(replyPreview);
                    }
                } catch {}
            })();
        }
        div.appendChild(topRow);
        div.appendChild(textDiv);
        if (editedSpan) div.appendChild(editedSpan);
        const reactionsRow = document.createElement("div");
        reactionsRow.className = "reactions-row";
        reactionsRow.dataset.msgid = id;
        div.appendChild(reactionsRow);
        const discordReactBtn = document.createElement("button");
        discordReactBtn.className = "react-btn";
        discordReactBtn.innerHTML = `<i class="bi bi-emoji-smile"></i>`;
        discordReactBtn.title = "Add Reaction";
        discordReactBtn.onclick = (e) => { e.stopPropagation(); showEmojiPicker(e, id); };
        const discordReplyBtn = document.createElement("button");
        discordReplyBtn.innerHTML = `<i class="bi bi-arrow-90deg-left"></i>`;
        discordReplyBtn.title = "Reply to Discord message";
        discordReplyBtn.onclick = () => toggleReply(id, msg.u || "Discord User", rawText);
        msgBtns.appendChild(discordReplyBtn);
        msgBtns.appendChild(discordReactBtn);
        div.insertBefore(msgBtns, topRow);
        return div;
    }
    if (isAnonMsg) {
        const rawText = msg.t || msg.text || "";
        const textDiv = document.createElement("div");
        textDiv.className = "msg-text";
        textDiv.style.marginLeft = "40px";
        textDiv.style.marginTop = "-5px";
        textDiv.style.whiteSpace = "pre-wrap";
        textDiv.style.overflowWrap = "anywhere";
        textDiv.innerHTML = buildSafeText(rawText);
        const replyId = msg.r || msg.reply;
        if (replyId) {
            (async () => {
                try {
                    const rData = await dbGet(`${currentPath}/${replyId}`);
                    if (rData) {
                        const rName = rData.u || (rData.s ? await getDisplayName(rData.s) : "Unknown");
                        const rText = buildReplyPreviewText((rData.t || rData.text || "").substring(0, 120));
                        const replyBar = document.createElement("div");
                        replyBar.className = "reply-bar";
                        replyBar.style.cssText = "border-left:3px solid #aaa;padding-left:6px;color:#aaa;font-size:0.82em;margin-bottom:3px;cursor:pointer;";
                        replyBar.innerHTML = `↩ ${rName}: ${rText}`;
                        replyBar.onclick = () => scrollToMessage(String(replyId));
                        textDiv.prepend(replyBar);
                    }
                } catch {}
            })();
        }
        if (isOwner || isCoOwner || isTester || isHAdmin) {
            const anonDelBtn = document.createElement("button");
            anonDelBtn.innerHTML = "<i class='bi bi-trash'></i>";
            anonDelBtn.title = "Delete Guest Message";
            anonDelBtn.onclick = async (e) => {
                if (e.shiftKey) {
                    await dbDelete(`${currentPath}/${id}`);
                    div.remove();
                    return;
                }
                showConfirm("Delete This Guest Message?", async (ok) => {
                    if (!ok) return;
                    await dbDelete(`${currentPath}/${id}`);
                    div.remove();
                });
            };
            msgBtns.appendChild(anonDelBtn);
        }
        div.appendChild(topRow);
        div.appendChild(textDiv);
        const reactionsRow = document.createElement("div");
        reactionsRow.className = "reactions-row";
        reactionsRow.dataset.msgid = id;
        div.appendChild(reactionsRow);
        div.insertBefore(msgBtns, topRow);
        return div;
    }
    const senderId = msg.sender || msg.s;
    if (!senderId) return null;
    nameSpan.textContent = "Loading...";
    nameSpan.style.color = "#aaa";
    profilePic.src = `${pfpDomain}/1.jpeg`;
    const replyId = msg.reply || msg.r;
    if (replyId) {
        (async () => {
            try {
                const rData = await dbGet(`${currentPath}/${replyId}`);
                if (rData) {
                    const rName = rData.u || (rData.s ? await getDisplayName(rData.s) : (rData.sender ? await getDisplayName(rData.sender) : "Unknown"));
                    let rText;
                    if (rData.file || rData.fileUrl || rData.attachment) {
                        rText = '<span style="color:#4fa3ff;">Click To View Attachment</span>';
                    } else {
                        rText = buildReplyPreviewText((rData.t || rData.text || "").substring(0, 120));
                    }
                    const replyPreview = document.createElement("div");
                    replyPreview.style.display = "flex";
                    replyPreview.style.cursor = "pointer";
                    replyPreview.style.gap = "5px";
                    replyPreview.onclick = () => scrollToMessage(String(replyId));
                    const arrow = document.createElement("span");
                    arrow.style.width = "30px";
                    arrow.style.marginLeft = "15px";
                    arrow.style.height = "8px";
                    arrow.style.marginTop = "11px";
                    arrow.style.borderTop = "1px solid #aaa";
                    arrow.style.borderLeft = "1px solid #aaa";
                    arrow.style.borderTopLeftRadius = "10px";
                    const replySpan = document.createElement("span");
                    replySpan.style.fontSize = "0.8em";
                    reply.style.marginRight = "44px";
                    replySpan.style.color = "#aaa";
                    reply.style.marginTop = "-5px";
                    replySpan.style.whiteSpace = "nowrap";
                    replySpan.style.overflow = "hidden";
                    replySpan.style.textOverflow = "ellipsis";
                    replySpan.style.maxWidth = "100%";
                    replySpan.innerHTML = `Replying To: @${rName}: ${rText}`;
                    replyPreview.appendChild(arrow);
                    replyPreview.appendChild(replySpan);
                    div.prepend(replyPreview);
                }
            } catch {}
        })();
    }
    const reactBtn = document.createElement("button");
    reactBtn.className = "react-btn";
    reactBtn.innerHTML = `<i class="bi bi-emoji-smile"></i>`;
    reactBtn.title = "Add Reaction";
    reactBtn.onclick = (e) => { e.stopPropagation(); showEmojiPicker(e, id); };
    msgBtns.appendChild(reactBtn);
    div.appendChild(topRow);
    div.appendChild(textDiv);
    if (editedSpan) div.appendChild(editedSpan);
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
    const container = document.getElementById("chatLog");
    if (container) container.appendChild(div);
    (async () => {
        try {
            const meta = await getUserMeta(senderId);
            let displayName = meta.displayName;
            if (!displayName || displayName.trim() === "") displayName = "Spam Account";
            let profilePics = [];
            try {
                const pfpDate = Date.now();
                const res = await fetch(`${pfpDomain}/index.json?t=${pfpDate}`);
                const files = await res.json();
                profilePics = files.map(file => `${pfpDomain}/${file}`);
            } catch {
                profilePics = [`${pfpDomain}/1.jpeg`];
            }
            const picVal = meta.pic;
            const picIndex = (picVal >= 0 && picVal < profilePics.length) ? picVal : 0;
            profilePic.src = profilePics[picIndex] + "?t=" + Date.now();
            profilePic.style.border = `2px solid ${meta.color}`;
            nameSpan.textContent = displayName;
            nameSpan.style.color = meta.color;
            const openProfile = () => { window.location.href = `InfiniteAccounts.html?user=${senderId}`; };
            nameSpan.onclick = openProfile;
            profilePic.onclick = openProfile;
            if (((isOwner || isTester) && !meta.owner) || (isCoOwner && !meta.owner && !meta.tester && !meta.coOwner) || (isHAdmin && !meta.owner && !meta.tester && !meta.coOwner && !meta.hAdmin) || (isAdmin && !meta.owner && !meta.tester && !meta.coOwner && !meta.hAdmin && !meta.admin)) {
                nameSpan.addEventListener("contextmenu", async (e) => {
                    e.preventDefault();
                    const freshMeta = await getUserMeta(senderId);
                    const alreadyMuted = freshMeta.muted;
                    const menu = document.createElement("div");
                    menu.style.cssText = "position:absolute;background:#222;border:1px solid #555;border-radius:6px;padding:6px 10px;color:#fff;cursor:pointer;z-index:9999;";
                    menu.style.left = e.pageX + "px";
                    menu.style.top = e.pageY + "px";
                    if (alreadyMuted) {
                        menu.textContent = "Unmute User";
                        menu.onclick = async () => { await unmuteUser(senderId); closeMenu(); };
                    } else {
                        menu.textContent = "Mute User";
                        const options = document.createElement("div");
                        options.style.cssText = "display:flex;flex-direction:column;margin-top:4px;";
                        const mkOpt = (label, fn) => {
                            const d = document.createElement("div");
                            d.textContent = label; d.style.cursor = "pointer";
                            d.onclick = fn; options.appendChild(d);
                        };
                        mkOpt("Toggle", async () => { await dbSet(`mutedUsers/${senderId}`, { expires: "Never" }); delete userMetaCache[senderId]; showSuccess("User Muted"); closeMenu(); });
                        mkOpt("Minutes", async () => { let m = parseInt(await customPrompt("Minutes?", false, "5")); if (!isNaN(m) && m > 0) { await dbSet(`mutedUsers/${senderId}`, { expires: Date.now() + m * 60000 }); delete userMetaCache[senderId]; showSuccess(`Muted ${m}m`); } closeMenu(); });
                        mkOpt("Hours", async () => { let h = parseInt(await customPrompt("Hours?", false, "1")); if (!isNaN(h) && h > 0) { await dbSet(`mutedUsers/${senderId}`, { expires: Date.now() + h * 3600000 }); delete userMetaCache[senderId]; showSuccess(`Muted ${h}h`); } closeMenu(); });
                        mkOpt("Days", async () => { let d = parseInt(await customPrompt("Days?", false, "1")); if (!isNaN(d) && d > 0) { await dbSet(`mutedUsers/${senderId}`, { expires: Date.now() + d * 86400000 }); delete userMetaCache[senderId]; showSuccess(`Muted ${d}d`); } closeMenu(); });
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
            dbListen(`mutedUsers/${senderId}`, async (data) => {
                if (!data) { mutedBadge.style.display = "none"; return; }
                if (data.expires === "Never") { mutedBadge.style.display = "inline"; return; }
                if (data.expires && Date.now() > data.expires) { await dbDelete(`mutedUsers/${senderId}`); mutedBadge.style.display = "none"; return; }
                mutedBadge.style.display = "inline";
            });
            const allPrimaryBadges = [];
            const extraBadges = [];
            const mkP = (cls, color, title) => allPrimaryBadges.push({ cls, color, title });
            const mkE = (cls, color, label, title) => extraBadges.push({ cls, color, label, title });
            if (meta.sus) mkP("bi bi-shield-exclamation","red","Under Investigation");
            if (meta.owner) mkP("bi bi-shield-plus","lime","Owner");
            if (meta.tester) mkP("bi bi-cogs","darkGoldenRod","Tester");
            if (meta.coOwner) mkP("bi bi-shield-fill","lightblue","Co-Owner");
            if (meta.hAdmin) mkP("bi bi-shield-halved","#00cc99","Head Admin");
            if (meta.admin) mkP("bi bi-shield","dodgerblue","Admin");
            if (meta.dev) mkP("bi bi-code-square","green","Developer");
            if (meta.premium3) mkP("bi bi-hearts","red","Premium T3");
            if (meta.premium2) mkP("bi bi-heart-fill","orange","Premium T2");
            if (meta.premium1) mkP("bi bi-heart-half","yellow","Premium T1");
            if (meta.donor) mkP("bi bi-balloon-heart","#00E5FF","Donated");
            if (meta.partner) mkE("bi bi-handshake","cornflowerblue","Partner","Partner");
            if (meta.uploader) mkE("bi bi-film","grey","Uploader","Uploaded A Movie");
            if (meta.milestone) mkE("bi bi-award","yellow","Award","Award Badge");
            if (meta.guesser) mkE("bi bi-stopwatch","#ff0000","Guesser","Guesser");
            if (meta.discord && meta.discord.trim()) mkE("bi bi-discord","#5865F2",`@${meta.discord}`,`Discord: @${meta.discord}`);
            if (meta.linker) mkE("bi bi-link","#4fa3ff","Linker","Link Sharer");
            if (meta.secure) mkE("bi bi-securely","dodgerblue","Securely","Has Securely");
            if (meta.guardian) mkE("bi bi-goguardian","grey","GoGuardian","Has GoGuardian");
            if (meta.lanschool) mkE("bi bi-lanschool","greenyellow","Lanschool","Has Lanschool");
            if (meta.linewize) mkE("bi bi-linewize","lightskyblue","Linewize","Has Linewize");
            if (meta.blocksi) mkE("bi bi-blocksi","cadetblue","Blocksi","Has Blocksi");
            const totalRoles = allPrimaryBadges.length + extraBadges.length;
            let inlinePrimaries, overflowPrimaries, inlineExtras, popoverExtras;
            if (totalRoles <= 3) {
                inlinePrimaries = allPrimaryBadges; overflowPrimaries = [];
                inlineExtras = extraBadges; popoverExtras = [];
            } else {
                inlinePrimaries = allPrimaryBadges.slice(0, 3);
                overflowPrimaries = allPrimaryBadges.slice(3);
                inlineExtras = []; popoverExtras = extraBadges;
            }
            const onlineBadge = document.createElement("i");
            const setOnlineStatus = (isOnline) => {
                onlineBadge.className = isOnline ? "bi bi-online" : "bi bi-offline";
                onlineBadge.style.color = isOnline ? "#69a84f" : "#999999";
                onlineBadge.title = isOnline ? "Online" : "Offline";
            };
            setOnlineStatus(meta.online);
            dbListen(`users/${senderId}/profile/online`, (val) => setOnlineStatus(!!val));
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
            const isSelf = senderId === currentUser?.uid;
            const replyBtn = document.createElement("button");
            replyBtn.innerHTML = `<i class="bi bi-arrow-90deg-left"></i>`;
            replyBtn.title = "Reply";
            replyBtn.onclick = () => toggleReply(id, displayName, rawText);
            if (!isGuest) {
                msgBtns.insertBefore(replyBtn, reactBtn);
            }
            if (!isGuest && (isSelf || isOwner || isAdmin || isCoOwner || isHAdmin || isTester)) {
                let canDelete = isSelf || isOwner || isTester || (isCoOwner && !meta.owner && !meta.tester && !meta.coOwner) || (isHAdmin && !meta.owner && !meta.coOwner && !meta.tester && !meta.hAdmin);
                let canEdit   = isSelf || isOwner || isTester || (isCoOwner && !meta.owner && !meta.tester && !meta.coOwner && !meta.hAdmin);
                if (canEdit) {
                    const editBtn = document.createElement("button");
                    editBtn.innerHTML = "<i class='bi bi-pencil-square'></i>";
                    editBtn.title = "Edit Message";
                    editBtn.onclick = () => {
                        if (div.querySelector("textarea")) return;
                        const textarea = document.createElement("textarea");
                        textarea.value = rawText;
                        textarea.style.cssText = "width:100%;box-sizing:border-box;resize:vertical;background:#121212;color:#fff;border:1px solid #555;border-radius:4px;padding:4px;margin-top:4px;";
                        const textDivHeight = textDiv.offsetHeight;
                        if (textDivHeight > 0) textarea.style.height = textDivHeight + "px";
                        textDiv.style.display = "none";
                        const saveBtn = document.createElement("button");
                        saveBtn.textContent = "Save";
                        saveBtn.style.marginRight = "6px";
                        const cancelBtn = document.createElement("button");
                        cancelBtn.textContent = "Cancel";
                        saveBtn.onclick = async () => {
                            const newText = textarea.value.trim();
                            if (!newText) return;
                            await dbSet(`${currentPath}/${id}/t`, newText);
                            await dbSet(`${currentPath}/${id}/e`, "edited");
                            textarea.remove(); 
                            saveBtn.remove(); 
                            cancelBtn.remove();
                            textDiv.style.display = "block";
                            textDiv.innerHTML = buildSafeText(newText);
                        };
                        cancelBtn.onclick = () => { 
                            textarea.remove(); 
                            saveBtn.remove(); 
                            cancelBtn.remove(); 
                            textDiv.style.display = "block";
                        };
                        textDiv.after(textarea);
                        textarea.after(saveBtn);
                        saveBtn.after(cancelBtn);
                    };
                    msgBtns.insertBefore(editBtn, reactBtn);
                }
                if (canDelete) {
                    const delBtn = document.createElement("button");
                    delBtn.innerHTML = "<i class='bi bi-trash'></i>";
                    delBtn.title = "Delete Message";
                    delBtn.onclick = async (e) => {
                        if (e.shiftKey) {
                            await dbDelete(`${currentPath}/${id}`);
                            div.remove();
                            return;
                        }
                        showConfirm("Delete This Message?", async (ok) => {
                            if (!ok) return;
                            await dbDelete(`${currentPath}/${id}`);
                            div.remove();
                        });
                    };
                    msgBtns.appendChild(delBtn);
                }
            }
            div.insertBefore(msgBtns, topRow);
        } catch (e) {
            console.warn("Failed To Load User Data For Message:", e);
            nameSpan.textContent = "User";
        }
    })();
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
function buildSafeText(raw) {
    const embedPlaceholders = [];
    let rawWithoutEmbeds = raw.replace(/<discord-embed-b64([^>]*)><\/discord-embed-b64>|<discord-embed-b64([^>]*)\/?>|<discord-embed-b64([^>]*)>/gi, (match) => {
        const idx = embedPlaceholders.length;
        embedPlaceholders.push(match);
        return `\x00DISCORD_EMBED_${idx}\x00`;
    });
    let safe = rawWithoutEmbeds
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    if (embedPlaceholders.length > 0) {
        safe = safe.replace(/\x00DISCORD_EMBED_(\d+)\x00/g, (_, i) => embedPlaceholders[Number(i)]);
    }
    safe = safe.replace(
        /&lt;i\s+class="([^"]*(?:fa|bi)[^"]+)"(?:\s+style="([^"]*)")?(?:\s+title="([^"]*)")?\s*&gt;&lt;\/i&gt;/g,
        (_, cls, style, title) => {
            let attrs = `class="${cls}"`;
            if (style) attrs += ` style="${style}"`;
            if (title) attrs += ` title="${title}"`;
            return `<i ${attrs}></i>`;
        }
    );
    safe = safe.replace(
        /^(### |## |# |-# )(.*)$/gm,
        (_, prefix, text) => {
            if (prefix === "# ") return `<h1>${text}</h1>`;
            if (prefix === "## ") return `<h2>${text}</h2>`;
            if (prefix === "### ") return `<h3>${text}</h3>`;
            if (prefix === "-# ") return `<div class="subtext">${text}</div>`;
            return text;
        }
    );
    safe = safe.replace(
        /&lt;p\s+style="color:\s*([^";]+)\s*;"\s*&gt;([\s\S]*?)&lt;\/p&gt;/gi,
        (_, color, content) => {
            const safeColor = color.replace(/[^a-zA-Z0-9#(),.%\s]/g, "");
            return `<p style="color:${safeColor}; margin-bottom:0px;">${content}</p>`;
        }
    );
    safe = safe.replace(
        /&lt;img\b([\s\S]*?)&gt;/gi,
        (fullTag, attrs) => {
            const srcMatch = attrs.match(/\bsrc="([^"]*)"/i);
            let safeSrc = srcMatch ? srcMatch[1].replace(/"/g, "") : "";
            if (safeSrc.startsWith("/")) {
                safeSrc = BACKEND + safeSrc;
            }
            const altMatch = attrs.match(/\balt="([^"]*)"/i);
            const styleMatch = attrs.match(/\bstyle="([^"]*)"/i);
            const alt = altMatch ? altMatch[1] : "";
            const style = styleMatch ? styleMatch[1] : "";
            let w = null, h = null, r = null;
            if (style) {
                const wm = style.match(/width\s*:\s*([0-9]+)px/i);
                const hm = style.match(/height\s*:\s*([0-9]+)px/i);
                const rm = style.match(/border-radius\s*:\s*([0-9]+)px/i);
                if (wm) w = Math.min(parseInt(wm[1]), 300);
                if (hm) h = Math.min(parseInt(hm[1]), 300);
                if (rm) r = parseInt(rm[1]);
            }
            let st = "margin-top:6px;cursor:pointer;border-radius:6px;";
            if (w) st += `width:${w}px;`;
            if (h) st += `height:${h}px;`;
            if (r !== null) st += `border-radius:${r}px;`;
            return `<img src="${safeSrc}" alt="${alt}" class="chat-img" style="${st}" onerror="this.style.display='none'">`;
        }
    );
    safe = safe.replace(
        /&lt;video\b([\s\S]*?)&gt;/gi,
        (fullTag, attrs) => {
            const srcMatch = attrs.match(/\bsrc="([^"]*)"/i);
            let safeSrc = srcMatch ? srcMatch[1].replace(/"/g, "") : "";
            if (safeSrc.startsWith("/")) {
                safeSrc = BACKEND + safeSrc;
            }
            const altMatch = attrs.match(/\balt="([^"]*)"/i);
            const alt = altMatch ? altMatch[1] : "";
            const nameMatch = attrs.match(/\bdata-fname="([^"]*)"/i);
            const fname = nameMatch ? nameMatch[1] : (alt || "video");
            const fsizeMatch = attrs.match(/\bdata-fsize="([^"]*)"/i);
            const fsize = fsizeMatch ? fsizeMatch[1] : "";
            const fsizeHtml = fsize ? `<span class="discord-vid-size">${fsize}</span>` : "";
            return `<div class="discord-vid-wrapper"><div class="discord-vid-topbar"><span class="discord-vid-fname">${fname}</span>${fsizeHtml}<a class="discord-vid-dl" href="${safeSrc}" download="${fname}" title="Download"><i class="bi bi-download"></i></a></div><video src="${safeSrc}" class="chat-vid discord-vid" onerror="this.parentElement.style.display='none'"></video><div class="discord-vid-controls"><button class="discord-vid-play"><i class="bi bi-play-fill"></i></button><input type="range" class="discord-vid-seek" value="0" min="0" max="100" step="0.1"><div class="discord-vid-time"><span class="discord-vid-cur">0:00</span> / <span class="discord-vid-dur">0:00</span></div><button class="discord-vid-mute" title="Mute"><i class="bi bi-volume-up-fill"></i></button></div></div>`;
        }
    );
    safe = safe.replace(/&lt;\/video&gt;/gi, "");
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(
        /&lt;audio\b([\s\S]*?)&gt;/gi,
        (fullTag, attrs) => {
            const srcMatch = attrs.match(/\bsrc="([^"]*)"/i);
            let safeSrc = srcMatch ? srcMatch[1].replace(/"/g, "") : "";
            if (safeSrc.startsWith("/")) {
                safeSrc = BACKEND + safeSrc;
            }
            const altMatch = attrs.match(/\balt="([^"]*)"/i);
            const alt = altMatch ? altMatch[1] : "";
            const nameMatch = attrs.match(/\bdata-fname="([^"]*)"/i);
            const fname = nameMatch ? nameMatch[1] : "audio";
            const fsizeMatch = attrs.match(/\bdata-fsize="([^"]*)"/i);
            const fsize = fsizeMatch ? fsizeMatch[1] : "";
            const fsizeHtml = fsize ? `<span class="discordaudiosize">${fsize}</span>` : "";
            const tophtml = `<span class="discordaudiotop"><i class="bi bi-file-earmark-music"></i><span style="display:flex;flex-direction:column;overflow:hidden;">${fname} ${fsizeHtml}</span></span>`
            return `<div class="discord-audio" data-fname="${fname}" data-src="${safeSrc}" data-dl="${fname}">${tophtml}<audio controls src="${safeSrc}" alt="${alt}" onerror="this.style.display='none'"></audio><div class="discordaudiocontrols"><button class="discordaudioplay"><i class='bi bi-play-fill'></i></button><input type="range" class="discordaudioseek" value="0" min="0" max="100"><div class="discordaudiotime"><span class="current">--:--</span> / <span class="duration">--:--</span></div><a class="discordaudiodl" href="${safeSrc}" download="${fname}" title="Download"><i class="bi bi-download"></i></a></div></div>`;
        }
    );
    safe = safe.replace(/&lt;\/audio&gt;/gi, "</audio>");
    safe = safe.replace(
        /&lt;file\b([\s\S]*?)&gt;/gi,
        (fullTag, attrs) => {
            const srcMatch = attrs.match(/\bhref="([^"]*)"/i) || attrs.match(/\bsrc="([^"]*)"/i);
            let safeSrc = srcMatch ? srcMatch[1].replace(/"/g, "") : "";
            if (safeSrc.startsWith("/")) safeSrc = BACKEND + safeSrc;
            const nameMatch = attrs.match(/\bdata-fname="([^"]*)"/i);
            const fname = nameMatch ? nameMatch[1] : "file";
            const fsizeMatch = attrs.match(/\bdata-fsize="([^"]*)"/i);
            const fsize = fsizeMatch ? fsizeMatch[1] : "";
            const ext = fname.split(".").pop().toLowerCase();
            let iconClass = "bi bi-file-earmark";
            if (["pdf"].includes(ext)) iconClass = "bi bi-file-earmark-pdf";
            else if (["zip","rar","7z","tar","gz"].includes(ext)) iconClass = "bi bi-file-earmark-zip";
            else if (["doc","docx","txt","md"].includes(ext)) iconClass = "bi bi-file-earmark-text";
            else if (["xls","xlsx","csv"].includes(ext)) iconClass = "bi bi-file-earmark-spreadsheet";
            else if (["ppt","pptx"].includes(ext)) iconClass = "bi bi-file-earmark-slides";
            else if (["js","ts","py","html","css","json","cpp","c","java"].includes(ext)) iconClass = "bi bi-file-earmark-code";
            const fsizeHtml = fsize ? `<span class="discord-file-size">${fsize}</span>` : "";
            return `<div class="discord-file-block"><i class="${iconClass} discord-file-icon"></i><div class="discord-file-info"><span class="discord-file-name" title="${fname}">${fname}</span>${fsizeHtml}</div><a class="discord-file-dl" href="${safeSrc}" download="${fname}" title="Download"><i class="bi bi-download"></i></a></div>`;
        }
    );
    safe = safe.replace(/&lt;\/file&gt;/gi, "");
    safe = safe.replace(/\n/g, "<br>");
    const mentionRegex = /@([^\s<]+)/g;
    safe = safe.replace(mentionRegex, (match, name) => {
        const lower = name.toLowerCase();
        if (lower === "support" && currentPath && currentPath.startsWith("messages/") && (isDev || isOwner || isTester)) {
            return `<span class="mention-self">@support</span>`;
        }
        const cleanLower = lower.replace(/ 💎/g, "");
        const isKnownUser = knownUserDisplayNames.has(cleanLower) || knownUserDisplayNames.has(lower);
        if (!isKnownUser) return match;
        const isSelfMention = currentName && (
            currentName.toLowerCase() === lower ||
            currentName.toLowerCase() === lower.replace(" 💎", "")
        );
        const cls = isSelfMention ? "mention-self" : "mention";
        return `<span class="${cls} mention-user" data-name="${name}">@${name}</span>`;
    });
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    safe = safe.replace(markdownLinkRegex, (match, text, url) => {
        const cleanText = text.trim();
        const cleanUrl = url.trim();
        if (cleanText === cleanUrl) {
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:#4fa3ff;text-decoration:underline;">${cleanText}</a>`;
        } else if (cleanText.includes(".")) {
            return `${cleanText} (${cleanUrl})`;
        }
        const looksLikeUrl = /^https?:\/\//i.test(cleanText);
        if (looksLikeUrl && cleanText !== cleanUrl) return `${cleanText} (${cleanUrl})`;
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:#4fa3ff;text-decoration:underline;">${cleanText}</a>`;
    });
    const urlRegex = /(^|[\s>])((https?:\/\/)[^\s<]+)/gi;
    safe = safe.replace(urlRegex, (match, prefix, url) => {
        let display = url;
        while (/[.,!?;:)\]\\"]$/.test(display)) display = display.slice(0, -1);
        const trailing = url.slice(display.length);
        if (display.includes("tenor.com")) {
            const clean = display.split("?")[0];
            const finalUrl = clean.endsWith(".gif") ? display : display + ".gif";
            return `${prefix}<img src="${finalUrl}" class="chat-img tenor-gif" data-tenor="${display}" style="max-width:250px;margin-top:10px;border-radius:8px;">${trailing}`;
        }
        if (display.includes("youtube.com/watch") || display.includes("youtu.be/") || display.includes("youtube.com/shorts/")) {
            let videoId = "";
            if (display.includes("youtube.com/watch")) {
                const urlObj = new URL(display);
                videoId = urlObj.searchParams.get("v");
            } else if (display.includes("youtu.be/")) {
                videoId = display.split("youtu.be/")[1].split(/[?&]/)[0];
            } else if (display.includes("youtube.com/shorts/")) {
                videoId = display.split("/shorts/")[1].split(/[?&]/)[0];
            }
            const isShort = display.includes("/shorts/");
            return `${prefix}<div class="yt-embed ${isShort ? "short" : ""}"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>${trailing}`;
        }
        if (display.includes("tiktok.com")) {
            return `${prefix}<blockquote class="tiktok-embed" cite="${display}" data-video-id=""><a href="${display}"></a></blockquote>${trailing}`;
        }
        return `${prefix}<a href="${display}" target="_blank" rel="noopener noreferrer" style="color:#4fa3ff;text-decoration:underline;">${display}</a>${trailing}`;
    });
    return safe;
}
function buildReplyPreviewText(raw) {
    if (!raw) return "";
    let text = raw.replace(/<discord-embed-b64[^>]*>[\s\S]*?<\/discord-embed-b64>/gi, "");
    text = text.replace(/<discord-embed-b64[^>]*\/?>/gi, "");
    text = text.replace(
        /(^|[\s>])(https?:\/\/[^\s<]+)/gi,
        (match, prefix, url) => {
            let display = url;
            while (/[.,!?;:)\]\\"']$/.test(display)) display = display.slice(0, -1);
            const isTenor = display.includes("tenor.com");
            const isGifUrl = /\.gif(\?|$)/i.test(display);
            const isYouTube = /youtube\.com|youtu\.be/i.test(display);
            const isTikTok = /tiktok\.com/i.test(display);
            const isImage = /\.(png|jpg|jpeg|webp)(\?|$)/i.test(display);
            if (isTenor || isGifUrl) return `${prefix}<gif-placeholder></gif-placeholder>`;
            if (isYouTube || isTikTok || isImage) return `${prefix}<media-placeholder></media-placeholder>`;
            return match;
        }
    );
    text = text.replace(/<(?!gif-placeholder|\/gif-placeholder|media-placeholder|\/media-placeholder)[^>]+>/gi, "");
    text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    text = text.replace(/^(#{1,3} |-# )/gm, "");
    text = text.replace(/@[^\s<]*/g, "");
    text = text.replace(/(https?:\/\/[^\s<]+)/g, "");
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(/_(.*?)_/g, "<em>$1</em>");
    text = text.replace(/<gif-placeholder><\/gif-placeholder>/g, `<i class="bi bi-image-fill"></i> Gif`);
    text = text.replace(/<media-placeholder><\/media-placeholder>/g, `<i class="bi bi-image-fill"></i> Media`);
    text = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    return text;
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
    function filterMirroredMessages(messagesObj) {
        if (!messagesObj || typeof messagesObj !== "object") return {};
        const domMirroredIds = new Set();
        chatLog.querySelectorAll(".msg").forEach(el => {
            const mid = el.dataset.discordMirrorId;
            if (mid) domMirroredIds.add(String(mid));
        });
        const entries = Object.entries(messagesObj);
        const batchMirroredIds = new Set(
            entries
                .map(([_, msg]) => msg?._discordMirrorId)
                .filter(Boolean)
                .map(String)
        );
        const mirroredIds = new Set([...domMirroredIds, ...batchMirroredIds]);
        const filtered = {};
        for (const [id, msg] of entries) {
            if (msg?._discordId && mirroredIds.has(String(msg._discordId))) {
                const existing = document.getElementById("msg-" + id);
                if (existing) existing.remove();
                continue;
            }
            filtered[id] = msg;
        }
        return filtered;
    }
    const res = await fetchAPI("limit-to-last", { path: pathToArray(path), limit: PAGE_SIZE });
    let msgs = res?.data;
    if (!msgs) return;
    msgs = filterMirroredMessages(msgs);
    const entries = Object.entries(msgs).sort((a, b) => {
        const tsA = a[1].timestamp ? Number(a[1].timestamp) : Number(a[0]);
        const tsB = b[1].timestamp ? Number(b[1].timestamp) : Number(b[0]);
        return tsA - tsB;
    });
    oldestLoadedTimestamp = entries[0] ? (Number(entries[0][1].timestamp || entries[0][0]) - 1) : null;
    const fragment = document.createDocumentFragment();
    for (const [id, msg] of entries) {
        const div = await renderMessageInstant(id, msg);
        if (div) fragment.appendChild(div);
    }
    chatLog.appendChild(fragment);
    initAudioPlayers(chatLog);
    scrollToBottom(false);
    let lastSnapshot = { ...msgs };
    const renderedKeys = new Set(Object.keys(msgs));
    const ws = await dbListen(path, async (newData) => {
        if (currentMsgRef !== path) return;
        if (!newData || typeof newData !== "object") return;
        newData = filterMirroredMessages(newData);
        for (const [key, val] of Object.entries(newData)) {
            const existing = document.getElementById("msg-" + key);
            if (!existing) {
                const newTs = Number(val.timestamp || key);
                const msgsEls = Array.from(chatLog.querySelectorAll(".msg"));
                const oldestRenderedTs = msgsEls.length > 0
                    ? Number(msgsEls[0].dataset.timestamp || 0) : 0;
                if (!renderedKeys.has(key) && newTs < oldestRenderedTs) {
                    continue;
                }
                renderedKeys.add(key);
                const newDiv = await renderMessageInstant(key, val);
                if (!newDiv) continue;
                let inserted = false;
                for (const el of msgsEls) {
                    if (Number(el.dataset.timestamp || 0) > newTs) {
                        chatLog.insertBefore(newDiv, el);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) chatLog.appendChild(newDiv);
                initAudioPlayers(newDiv);
                if (autoScrollEnabled) scrollToBottom(true);
            } else if (lastSnapshot[key] && JSON.stringify(lastSnapshot[key]) !== JSON.stringify(val)) {
                const textDiv = existing.querySelector(".msg-text");
                const editedSpan = existing.querySelector(".edited-label");
                if (textDiv) {
                    let safeText = buildSafeText(val.t || val.text);
                    textDiv.innerHTML = safeText;
                    if (editedSpan) editedSpan.textContent = (val.e || val.edited) ? "(Edited)" : "";
                }
                const reactRow = existing.querySelector(".reactions-row");
                if (reactRow) renderReactionsInRow(reactRow, val.reactions);
            }
        }
        for (const key of Object.keys(lastSnapshot)) {
            if (!newData[key]) {
                const el = document.getElementById("msg-" + key);
                if (el) el.remove();
                renderedKeys.delete(key);
            }
        }
        lastSnapshot = { ...newData };
    }, "messages");
    currentListeners.added = ws;
}
function initAudioPlayers(container) {
    const scope = container || document;
    scope.querySelectorAll(".discord-audio").forEach((player) => {
        if (player.dataset.audioInit) return;
        player.dataset.audioInit = "1";
        const audio = player.querySelector("audio");
        const playBtn = player.querySelector(".discordaudioplay");
        const seek = player.querySelector(".discordaudioseek");
        const current = player.querySelector(".current");
        const duration = player.querySelector(".duration");
        if (!audio || !playBtn || !seek || !current || !duration) return;
        function format(t) {
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60).toString().padStart(2, "0");
            return `${m}:${s}`;
        }
        audio.addEventListener("loadedmetadata", () => {
            seek.max = Math.floor(audio.duration);
            duration.textContent = format(audio.duration);
            current.textContent = "0:00";
        });
        audio.addEventListener("timeupdate", () => {
            if (!seek._seeking) seek.value = audio.currentTime;
            current.textContent = format(audio.currentTime);
        });
        audio.addEventListener("ended", () => {
            playBtn.innerHTML = "<i class='bi bi-play-fill'></i>";
            seek.value = 0;
            current.textContent = "0:00";
        });
        playBtn.addEventListener("click", () => {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = "<i class='bi bi-pause-fill'></i>";
            } else {
                audio.pause();
                playBtn.innerHTML = "<i class='bi bi-play-fill'></i>";
            }
        });
        if (!isMobile) {
            seek.addEventListener("mousedown", () => { seek._seeking = true; });
            seek.addEventListener("mouseup", () => {
                seek._seeking = false;
                audio.currentTime = seek.value;
            });
            seek.addEventListener("input", () => {
                current.textContent = format(Number(seek.value));
            });
        }
    });
    scope.querySelectorAll(".discord-vid-wrapper").forEach((wrapper) => {
        if (wrapper.dataset.vidInit) return;
        wrapper.dataset.vidInit = "1";
        const video = wrapper.querySelector(".discord-vid");
        const playBtn = wrapper.querySelector(".discord-vid-play");
        const seek = wrapper.querySelector(".discord-vid-seek");
        const curEl = wrapper.querySelector(".discord-vid-cur");
        const durEl = wrapper.querySelector(".discord-vid-dur");
        const muteBtn = wrapper.querySelector(".discord-vid-mute");
        if (!video || !playBtn || !seek || !curEl || !durEl) return;
        function fmt(t) {
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60).toString().padStart(2, "0");
            return `${m}:${s}`;
        }
        video.addEventListener("loadedmetadata", () => {
            seek.max = video.duration;
            durEl.textContent = fmt(video.duration);
        });
        video.addEventListener("timeupdate", () => {
            if (!seek._seeking) seek.value = video.currentTime;
            curEl.textContent = fmt(video.currentTime);
        });
        video.addEventListener("ended", () => {
            playBtn.innerHTML = "<i class='bi bi-play-fill'></i>";
            seek.value = 0;
            curEl.textContent = "0:00";
        });
        video.addEventListener("pause", () => {
            playBtn.innerHTML = "<i class='bi bi-play-fill'></i>";
        });
        video.addEventListener("play", () => {
            playBtn.innerHTML = "<i class='bi bi-pause-fill'></i>";
        });
        playBtn.addEventListener("click", () => {
            if (video.paused) video.play();
            else video.pause();
        });
        if (muteBtn) {
            muteBtn.addEventListener("click", () => {
                video.muted = !video.muted;
                muteBtn.innerHTML = video.muted
                    ? "<i class='bi bi-volume-mute-fill'></i>"
                    : "<i class='bi bi-volume-up-fill'></i>";
            });
        }
        if (!isMobile) {
            seek.addEventListener("mousedown", () => { seek._seeking = true; });
            seek.addEventListener("mouseup", () => {
                seek._seeking = false;
                video.currentTime = seek.value;
            });
            seek.addEventListener("input", () => {
                curEl.textContent = fmt(Number(seek.value));
            });
            wrapper.addEventListener("dblclick", (e) => {
                if (e.target === video) {
                    if (video.paused) video.play();
                    else video.pause();
                }
            });
        }
    });
}
function playNotificationSound() {
    const audio = new Audio("/res/notif.mp3");
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
    let attachBtn = document.getElementById("chatAttachBtn");
    if (attachBtn) attachBtn.style.display = "none";
    if (sidebar.classList.contains("open")) sidebar.classList.toggle("open");
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
            <label style="color:#aaa;font-size:0.85em;">Discord Channel ID (Leave Empty To Unlink)</label>
            <input id="discordChannelIdInput" class="form-control" placeholder="Discord Channel ID" style="width:100%; padding:6px;margin-bottom:10px;">
            <div id="discordIdStatus" style="font-size:0.78em;color:#aaa;margin-bottom:10px;"></div>
            <hr>
            <center><h3>Guest Settings</h3></center>
            <hr>
            <div style="margin-bottom:14px;">
                <label class="switch">
                    <input type="checkbox" id="guestReadToggle">
                    <span class="slider"></span>
                </label>
                Guest Read
            </div>
            <div style="margin-bottom:18px;">
                <label class="switch">
                    <input type="checkbox" id="guestWriteToggle">
                    <span class="slider"></span>
                </label>
                Guest Write
            </div>
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
    (async () => {
        try {
            const token = await getAuthToken();
            const res = await fetch(`${BACKEND}/discord-channel-map`, {
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) {
                const json = await res.json();
                const currentId = json.map?.[channel] || "";
                const input = overlay.querySelector("#discordChannelIdInput");
                if (input) {
                    input.value = currentId;
                    const status = overlay.querySelector("#discordIdStatus");
                    if (status) status.textContent = currentId ? `Currently Mapped To: ${currentId}` : "Not Mapped To Any Discord Channel";
                }
            }
        } catch {}
    })();
    for (let key in data.read || {}) {
        const el = overlay.querySelector(`input[data-read="${key}"]`);
        if (el) el.checked = true;
    }
    for (let key in data.write || {}) {
        const el = overlay.querySelector(`input[data-write="${key}"]`);
        if (el) el.checked = true;
    }
    const guestReadToggle  = overlay.querySelector("#guestReadToggle");
    const guestWriteToggle = overlay.querySelector("#guestWriteToggle");
    if (guestReadToggle)  guestReadToggle.checked  = !!(data.guestRead);
    if (guestWriteToggle) guestWriteToggle.checked = !!(data.guestWrite);
    guestWriteToggle?.addEventListener("change", () => {
        if (guestWriteToggle.checked) guestReadToggle.checked = true;
    });
    guestReadToggle?.addEventListener("change", () => {
        if (!guestReadToggle.checked) guestWriteToggle.checked = false;
    });
    document.getElementById("deleteChannel").onclick = async () => {
        showConfirm(`Delete "${channel}"? This Cannot Be Undone.`, async (result) => {
            if (!result) return;
            try {
                await dbDelete(`channels/${channel}`);
                await dbDelete(`messages/${channel}`);
                try {
                    const token = await getAuthToken();
                    await fetch(`${BACKEND}/discord-channel-map`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                        body: JSON.stringify({ channelName: channel, discordChannelId: "" })
                    });
                } catch {}
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
        const discordId = (document.getElementById("discordChannelIdInput")?.value || "").trim();
        const read = getSelectedRoles("read");
        const write = getSelectedRoles("write");
        if (Object.keys(read).length === 0) read.verified = true;
        if (Object.keys(write).length === 0) write.verified = true;
        const guestRead  = !!(overlay.querySelector("#guestReadToggle")?.checked);
        const guestWrite = !!(overlay.querySelector("#guestWriteToggle")?.checked);
        if (discordId && !/^\d+$/.test(discordId)) {
            showError("Discord Channel ID Must Be A Number");
            return;
        }
        try {
            if (newName && newName !== channel) {
                const oldData = await dbGet(`channels/${channel}`) || {};
                await dbSet(`channels/${newName}`, { ...oldData, read, write, guestRead, guestWrite });
                await dbDelete(`channels/${channel}`);
                const oldMsgs = await dbGet(`messages/${channel}`);
                if (oldMsgs) {
                    await dbSet(`messages/${newName}`, oldMsgs);
                    await dbDelete(`messages/${channel}`);
                }
                switchChannel(newName);
            } else {
                await dbUpdate(`channels/${channel}`, { read, write, guestRead, guestWrite });
            }
            try {
                const token = await getAuthToken();
                const targetName = (newName && newName !== channel) ? newName : channel;
                await fetch(`${BACKEND}/discord-channel-map`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                    body: JSON.stringify({ channelName: targetName, discordChannelId: discordId })
                });
            } catch (e) {
                console.warn("Failed To Save Discord Channel Mapping:", e);
            }
            overlay.remove();
            showSuccess("Channel Settings Saved!");
        } catch (err) {
            showError("Failed To Save Channel Settings:", err);
        }
    };
}
async function hasPermission(channelData, type) {
    if (!channelData) return true;
    if (!currentUser) {
        if (type === "read")  return !!(channelData.guestRead);
        if (type === "write") return !!(channelData.guestWrite);
        return false;
    }
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
        if (isOwner || isCoOwner || isTester) {
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
    if (isGuest) {
        const chData = await dbGet(`channels/${ch}`);
        const canRead  = !!(chData?.guestRead  || !chData);
        const canWrite = !!(chData?.guestWrite);
        if (!canRead) {
            showError("This channel is not available to guests.");
            currentPath = null;
            return;
        }
        sendBtn.disabled = !canWrite;
        sendBtn.title = canWrite ? "Send Message" : "This Channel Does Not Allow Guest Messages";
        let notice = document.getElementById("guestReadOnlyNotice");
        if (!canWrite) {
            if (!notice) {
                notice = document.createElement("div");
                notice.id = "guestReadOnlyNotice";
                notice.style.cssText = "text-align:center;color:#aaa;font-size:0.8em;padding:4px;background:rgba(0,0,0,0.3);border-radius:4px;margin:2px 0;";
                chatInput?.parentElement?.insertBefore(notice, chatInput);
            }
            notice.textContent = "Read-only — Log In To Send Messages In This Channel";
        } else if (notice) {
            notice.remove();
        }
    }
    if (isRestrictedChannel(ch) && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isDev || isPre2 || isPre3)) {
        return;
    } else {
        attachMessageListeners(currentPath);
    }
    if (sidebar.classList.contains("open")) sidebar.classList.toggle("open");
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
    if (!currentPath) return;
    if (isGuest) {
        let text = chatInput.value.trim();
        if (!text && !pendingAttachFile) return;
        if (/@everyone\b/i.test(text) || /@here\b/i.test(text)) {
            showError("@everyone And @here Mentions Are Not Allowed.");
            chatInput.value = "";
            return;
        }
        if (text.length > 500) {
            showError("Guest Messages Are Limited To 500 Characters.");
            chatInput.value = "";
            return;
        }
        const ch = currentPath.split("/")[1];
        const chData = await dbGet(`channels/${ch}`);
        if (!(await hasPermission(chData, "write"))) {
            showError("This Channel Does Not Allow Guest Messages.");
            return;
        }
        if (pendingAttachFile) {
            try {
                const fileMsg = { 
                    u: anonDisplayName, 
                    t: text || "", 
                    sender: "anon", 
                    r: replyMsgId || undefined 
                };
                await dbPushWithFile(currentPath, fileMsg, pendingAttachFile);
                pendingAttachFile = null;
                const preview = document.getElementById("chatFilePreview");
                if (preview) preview.remove();
                chatInput.value = "";
                toggleReply();
                return;
            } catch (err) {
                showError("File Upload Failed: " + err.message);
                return;
            }
        }
        const ts = Date.now();
        const headers = { "Content-Type": "application/json" };
        if (anonSessionToken) headers["x-anon-session"] = anonSessionToken;
        try {
            const res = await fetch(`${BACKEND}/write`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    path: ["messages", ch, String(ts)],
                    value: { u: anonDisplayName, t: text, sender: "anon", r: replyMsgId || undefined },
                    anonSession: anonSessionToken
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                showError(err.error || "Failed To Send");
                return;
            }
        } catch (e) {
            showError("Failed to send: " + e.message);
            return;
        }
        chatInput.value = "";
        toggleReply();
        return;
    }
    if (!currentUser) return;
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
    if (/@everyone\b/i.test(text) || /@here\b/i.test(text)) {
        showError("@everyone And @here Mentions Are Not Allowed.");
        chatInput.value = "";
        return;
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
        s: currentUser.uid,
        t: outgoingText,
        r: replyMsgId || null
    };
    if (!msg.r) delete msg.r;
    if (currentPrivateUid) {
        await sendPrivateMessage(currentPrivateUid, outgoingText);
        if (pendingAttachFile) {
            const fileMsg = { s: currentUser.uid, t: "", r: replyMsgId || null };
            if (!fileMsg.r) delete fileMsg.r;
            await dbPushWithFile(currentPath, fileMsg, pendingAttachFile);
        }
    } else {
        const ch = currentPath.split("/")[1];
        const chData = await dbGet(`channels/${ch}`);
        if (!(await hasPermission(chData, "write"))) {
            showError("You Cannot Send Messages In This Channel.");
            return;
        }
        if (pendingAttachFile) {
            await dbPush(currentPath, msg);
            const fileMsg = { s: currentUser.uid, t: "", r: null };
            await dbPushWithFile(currentPath, fileMsg, pendingAttachFile);
        } else {
            await dbPushWithFile(currentPath, msg, null);
        }
    }
    chatInput.value = "";
    if (typeof window._clearChatAttachment === "function") window._clearChatAttachment();
    toggleReply();
    if (currentUser && currentPath.startsWith("messages/")) {
        const channelName = currentPath.split("/")[1];
        dbDelete(`typing/${channelName}/${currentUser.uid}`);
    }
};
onAuthStateChanged(auth, async user => {
    if (!user) {
        isGuest = true;
        currentUser = null;
        if (usernameSpan) usernameSpan.textContent = anonDisplayName;
        if (roleSpan) { roleSpan.textContent = "Guest"; roleSpan.style.color = "#aaa"; }
        if (bioSpan) { bioSpan.textContent = "Browsing as guest"; bioSpan.style.color = "gray"; }
        mentionToggleLabel.style.display = "none";
        adminControls.style.display = "none";
        addChannelBtn.style.display = "none";
        _injectGuestNameButton();
        sendBtn.disabled = true;
        await loadAllUsernames();
        startChannelListeners();
        await renderChannelsFromDB();
        const _urlParams = new URLSearchParams(window.location.search);
        const _channel = _urlParams.get("channel");
        if (_channel) {
            switchChannel(decodeURIComponent(_channel));
        } else {
            switchChannel("General");
        }
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
function _injectGuestNameButton() {
    if (document.getElementById("guestNameBtn")) return;
    const btn = document.createElement("button");
    btn.id = "guestNameBtn";
    btn.textContent = "Set Name";
    btn.title = "Set Your Anonymous Display Name";
    btn.style.cssText = "font-size:0.75em;padding:3px 8px;margin-top:4px;background:#333;color:#ccc;border:1px solid #555;border-radius:4px;cursor:pointer;";
    btn.onclick = _promptGuestName;
    const container = usernameSpan?.parentElement;
    if (container) container.appendChild(btn);
    else document.body.appendChild(btn);
    const loginLink = document.createElement("a");
    loginLink.id = "guestLoginLink";
    loginLink.href = "InfiniteLogins.html?chat=true";
    loginLink.textContent = "Login";
    loginLink.style.cssText = "display:block;font-size:0.75em;margin-top:4px;color:#4fa3ff;text-decoration:underline;cursor:pointer;";
    if (container) container.appendChild(loginLink);
}
async function _promptGuestName() {
    window.location.href = window.location.href;
    const name = window.prompt("Enter Your Anonymous Display Name (Max 32 Chars):", anonDisplayName);
    if (!name || !name.trim()) return;
    try {
        const res = await fetch(`${BACKEND}/api/anon-name`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), sessionToken: anonSessionToken })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showError(err.error || "Failed To Set Name");
            return;
        }
        const data = await res.json();
        anonSessionToken = data.sessionToken;
        anonDisplayName = data.name;
        localStorage.setItem("anonSessionToken", anonSessionToken);
        localStorage.setItem("anonDisplayName", anonDisplayName);
        if (usernameSpan) usernameSpan.textContent = anonDisplayName;
        showSuccess(`Display Name Set To "${anonDisplayName}"`);
    } catch (e) {
        showError("Failed To Set Name: " + e.message);
    }
}
async function loadAllUsernames() {
    const data = await dbGet("users");
    allUsernames = [];
    knownUserDisplayNames.clear();
    if (data) {
        for (const uid of Object.keys(data)) {
            if (data[uid].profile && data[uid].profile.displayName) {
                allUsernames.push(data[uid].profile.displayName);
                knownUserDisplayNames.add(data[uid].profile.displayName.replace(/ 💎/g, "").toLowerCase());
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
            <center><h3>Guest Access</h3></center>
            <hr>
            <div style="margin-bottom:14px;">
                <label class="switch">
                    <input type="checkbox" id="guestReadToggle">
                    <span class="slider"></span>
                </label>
                Guest Read
            </div>
            <div style="margin-bottom:18px;">
                <label class="switch">
                    <input type="checkbox" id="guestWriteToggle">
                    <span class="slider"></span>
                </label>
                Guest Write
            </div>
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
    const gRT = overlay.querySelector("#guestReadToggle");
    const gWT = overlay.querySelector("#guestWriteToggle");
    gWT?.addEventListener("change", () => { if (gWT.checked) gRT.checked = true; });
    gRT?.addEventListener("change", () => { if (!gRT.checked) gWT.checked = false; });
    document.getElementById("cancelCreate").onclick = () => overlay.remove();
    document.getElementById("createChannelConfirm").onclick = async () => {
        const name = document.getElementById("channelNameInput").value.trim();
        if (!name) return;
        const read = getSelectedRoles("read");
        const write = getSelectedRoles("write");
        if (Object.keys(read).length === 0) read.verified = true;
        if (Object.keys(write).length === 0) write.verified = true;
        const guestRead  = !!(overlay.querySelector("#guestReadToggle")?.checked);
        const guestWrite = !!(overlay.querySelector("#guestWriteToggle")?.checked);
        await dbSet(`channels/${name}`, { read, write, guestRead, guestWrite });
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
(function injectFileAttachUI() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "chatFileInput";
    fileInput.accept = "image/*,video/*,audio/*,.pdf,.txt,.zip,.rar,.doc,.docx,.xls,.xlsx,.pptx,.js,.html,";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    const attachBtn = document.createElement("button");
    attachBtn.id = "chatAttachBtn";
    attachBtn.innerHTML = `<i class="bi bi-file-earmark-plus" title="Attach File" style="display:block;padding:10px;font-size:1.5em;"></i>`;
    attachBtn.style.cssText = "background:none;border:none;cursor:pointer;padding:15px;font-size:2px;";
    attachBtn.onmouseenter = () => attachBtn.style.color = "#fff";
    attachBtn.onmouseleave = () => attachBtn.style.color = "#aaa";
    attachBtn.onclick = () => fileInput.click();
    const previewBar = document.createElement("div");
    previewBar.id = "chatFilePreview";
    previewBar.style.cssText = "display:none;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.06);border-radius:8px;margin-bottom:4px;font-size:0.85em;color:#ccc;max-width:100%;";
    const previewIcon = document.createElement("span");
    previewIcon.textContent = "📎";
    const previewName = document.createElement("span");
    previewName.style.cssText = "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    const previewClear = document.createElement("button");
    previewClear.textContent = "✕";
    previewClear.style.cssText = "background:none;border:none;cursor:pointer;color:#888;font-size:0.9em;padding:0 4px;";
    previewClear.title = "Remove attachment";
    previewClear.onclick = () => clearAttachment();
    previewBar.appendChild(previewIcon);
    previewBar.appendChild(previewName);
    previewBar.appendChild(previewClear);
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        const MAX = 10 * 1024 * 1024;
        if (file.size > MAX) {
            showError("File Is Too Large. Maximum Size Is 10 MB.");
            fileInput.value = "";
            return;
        }
        pendingAttachFile = file;
        previewName.textContent = file.name + ` (${(file.size / 1024).toFixed(1)} KB)`;
        previewBar.style.display = "flex";
        fileInput.value = "";
    });
    function clearAttachment() {
        pendingAttachFile = null;
        previewBar.style.display = "none";
        previewName.textContent = "";
    }
    window._clearChatAttachment = clearAttachment;
    chatMsgFunctions.appendChild(attachBtn);
    const inputRow = chatInput.closest("div") || chatInput.parentElement;
    if (inputRow && inputRow.parentElement) {
        inputRow.parentElement.insertBefore(previewBar, inputRow);
    } else {
        sendBtn.parentElement.insertBefore(previewBar, sendBtn.parentElement.firstChild);
    }
})();
async function dbPushWithFile(path, value, file) {
    if (!file) return dbPush(path, value);
    const key = Date.now().toString();
    const valueWithTs = { ...value, timestamp: Number(key) };
    const token = await getAuthToken();
    const form = new FormData();
    form.append("path", JSON.stringify([...path.split("/").filter(Boolean), key]));
    form.append("value", JSON.stringify(valueWithTs));
    form.append("file", file, file.name);
    const headers = {};
    if (token) {
        form.append("token", token);
        headers["Authorization"] = "Bearer " + token;
    } else if (anonSessionToken) {
        form.append("anonSession", anonSessionToken);
        headers["x-anon-session"] = anonSessionToken;
    }
    const res = await fetch(`${a}/write`, { method: "POST", headers, body: form });
    if (!res.ok) {
        let errMsg = "Upload failed";
        try { const j = await res.json(); errMsg = j?.error || errMsg; } catch {}
        throw new Error(errMsg);
    }
    return key;
}
chatInput.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
                e.preventDefault();
                const MAX = 10 * 1024 * 1024;
                if (file.size > MAX) { showError("Pasted Image Is Too Large (max 10 MB)."); return; }
                pendingAttachFile = new File([file], "pasted-image.png", { type: file.type });
                const previewBar = document.getElementById("chatFilePreview");
                const previewName = previewBar?.querySelector("span:nth-child(2)");
                if (previewName) previewName.textContent = "pasted-image.png" + ` (${(file.size / 1024).toFixed(1)} KB)`;
                if (previewBar) previewBar.style.display = "flex";
            }
            return;
        }
    }
});
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
    if (!typingInterval) {
        dbSet(typingPath, { name: currentName, typing: true });
        typingInterval = setInterval(() => {
            dbSet(typingPath, { name: currentName, typing: true });
        }, 3000);
    }
    clearTimeout(typingStopTimeout);
    typingStopTimeout = setTimeout(() => {
        clearInterval(typingInterval);
        typingInterval = null;
        dbDelete(typingPath);
    }, 3000);
});
chatInput.addEventListener("input", () => {
    const value = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const justTypedAt = value.slice(0, cursorPos).endsWith("@");
    const afterAt = /@[\w\d_-]{1,20}$/.test(value.slice(0, cursorPos));
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
    if (currentPrivateUid && justTypedAt) {
        mentionHint.textContent = `Press Tab To Mention ${currentPrivateName || "This User"}`;
        mentionHint.style.display = "block";
    } else if (!afterAt) {
        mentionHint.style.display = "none";
    }
    renderMentionMenu(matches);
});
chatInput.addEventListener("blur", () => {
    mentionHint.style.display = "none";
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
    initAudioPlayers(chatLog);
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
                    const res = await fetch(`${a}/verify-user`, {
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