import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { ref, push, onChildAdded, onChildRemoved, onChildChanged, remove, update, set, get, runTransaction, onValue, off } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
const channelList = document.getElementById("channels");
const chatLog = document.getElementById("chatLog");
let lastMessageTimestamp = 0;
const MESSAGE_COOLDOWN = 3000;
const mentionNotif = document.getElementById("mentionNotif");
const mentionToggleLabel = document.getElementById("mentionToggleLabel");
const mentionToggle = document.getElementById("mentionToggle");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const adminControls = document.getElementById("adminControls");
const newChannelName = document.getElementById("newChannelName");
const addChannelBtn = document.getElementById("addChannelBtn");
const privateList = document.getElementById("privateList");
const usernameSpan = document.getElementById("username");
const bioSpan = document.getElementById("bio");
const emailSpan = document.getElementById("email");
const roleSpan = document.getElementById("role");
let currentPath = null;
let currentMsgRef = null;
let currentListeners = {};
let currentUser = null;
let currentName = "User";
let currentColor = "#ffffff";
let isAdmin = false;
let isHAdmin = false;
let isTester = false;
let isCoOwner = false;
let isOwner = false;
let isDev = false;
let isPre3 = false;
let isPre2 = false;
let isPre1 = false;
let isSus = false;
let isPartner = false;
let currentPrivateUid = null;
let currentPrivateName = null;
let metadataListenerRef = null;
let autoScrollEnabled = true;
const privateListeners = new Set();
const channelMentionSet = new Set();
const mentionMenu = document.getElementById("mentionMenu");
let allUsernames = [];
let mentionActive = false;
let triggerIndex = -1;
const style = document.createElement("style");
style.textContent = `
    .mention {
        color: #4fa3ff;
        font-weight: bold;
        background: rgba(79,163,255,0.1);
        padding: 2px 4px;
        border-radius: 4px;
    }
    .mention-self {
        color: gold;
        font-weight: bold;
        background: rgba(255,215,0,0.15);
        padding: 2px 4px;
        border-radius: 4px;
    }
    .notifDot {
        color: red;
        font-weight: bold;
        margin-right: 6px;
    }
    .left { 
        display:flex; 
        align-items:center; 
        gap:6px; 
    }
`;
const typingIndicator = document.createElement("div");
typingIndicator.id = "typingIndicator";
typingIndicator.style.fontSize = "0.8em";
typingIndicator.style.color = "#aaa";
typingIndicator.style.marginTop = "4px";
typingIndicator.style.display = "none";
chatInput.insertAdjacentElement("beforebegin", typingIndicator);
let typingTimeout = null;
let typingRef = null;
document.head.appendChild(style);
chatLog.addEventListener("scroll", () => {
    const nearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 50;
    autoScrollEnabled = nearBottom;
});
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
async function muteUser(uid) {
    const muteRef = ref(db, `mutedUsers/${uid}`);
    const expireTime = Date.now() + 24 * 60 * 60 * 1000;
    await set(muteRef, { expires: expireTime });
    showSuccess("User Muted For 1 Day.");
}
async function unmuteUser(uid) {
    await remove(ref(db, `mutedUsers/${uid}`));
    showSuccess("User Unmuted.");
}
async function isUserMuted(uid) {
    const muteRef = ref(db, `mutedUsers/${uid}`);
    const snap = await get(muteRef);
    if (!snap.exists()) return false;
    const data = snap.val();
    if (data.expires && Date.now() > data.expires) {
        await remove(muteRef); 
        return false;
    }
    return true;
}
function detachCurrentMessageListeners() {
    if (!currentMsgRef) return;
    try {
        if (currentListeners.added) off(currentMsgRef, 'child_added', currentListeners.added);
        if (currentListeners.removed) off(currentMsgRef, 'child_removed', currentListeners.removed);
        if (currentListeners.changed) off(currentMsgRef, 'child_changed', currentListeners.changed);
    } catch (e) {}
    currentMsgRef = null;
    currentListeners = {};
}
async function ensureDisplayName(user) {
    const nameSnap = await get(ref(db, `users/${user.uid}/profile/displayName`));
    if (!nameSnap.exists()) {
        const name = (user.email === "infinitecodehs@gmail.com") ? "Hacker41 💎" : "User";
        await set(ref(db, `users/${user.uid}/profile/displayName`), name);
        currentName = name;
    } else {
        currentName = nameSnap.val();
        localStorage.setItem("displayName", currentName);
    }
    const colorSnap = await get(ref(db, `users/${user.uid}/settings/color`));
    if (colorSnap.exists()) {
        currentColor = colorSnap.val();
        localStorage.setItem("color", currentColor);
    } else {
        currentColor = "#ffffff";
    }
}
mentionToggle.addEventListener("change", async () => {
    if (!currentUser) return;
    const newValue = mentionToggle.checked;
    try {
        await set(ref(db, `users/${currentUser.uid}/settings/showMentions`), newValue);
        mentionToggleLabel.style.color = newValue ? "gold" : "#888";
    } catch (err) {
        showError("Failed To Save Mention Setting:", err);
    }
});
async function loadMentionSetting(user) {
    try {
        const settingRef = ref(db, `users/${user.uid}/settings/showMentions`);
        const snap = await get(settingRef);
        if (snap.exists()) {
            mentionToggle.checked = snap.val();
        } else {
            mentionToggle.checked = true;
            await set(settingRef, true);
        }
        mentionToggleLabel.style.color = mentionToggle.checked ? "gold" : "#888";
    } catch (err) {
        showError("Failed To Load Mention Setting:", err);
        mentionToggle.checked = true;
    }
}
async function getDisplayName(uid) {
    const snap = await get(ref(db, `users/${uid}/profile/displayName`));
    let dn = snap.exists() ? snap.val() : "User";
    if (!dn || dn.trim() === "") dn = "Spam Account";
    return dn;
}
mentionNotif.addEventListener("click", () => {
    const msgId = mentionNotif.dataset.msgid;
    if (msgId) {
        const seenRef = ref(db, `metadata/${currentUser.uid}/mentions/${msgId}/seen`);
        set(seenRef, true);
    }
    mentionNotif.style.display = "none";
});
function messageMentionsYou(text) {
    if (!text || !currentName) return false;
    const lowerMsg = text.toLowerCase();
    const plain = currentName.toLowerCase().replace(" 💎", "");
    return lowerMsg.includes(`@${plain}`) || lowerMsg.includes(`@${plain} 💎`);
}
async function processChannelMentions(htmlText) {
    const channelRegex = /#([A-Za-z0-9_\-]+)/g;
    const channelSnap = await get(ref(db, "channels"));
    const allChannels = channelSnap.exists() ? Object.keys(channelSnap.val()) : [];
    return htmlText.replace(channelRegex, (match, chName) => {
        if (allChannels.includes(chName)) {
            return `<span class="channel-mention" data-channel="${chName}">#${chName}</span>`;
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
    const snap = await get(ref(db, "users"));
    if (!snap.exists()) return null;
    const clean = name.replace(/ 💎/g, "").toLowerCase();
    for (const [uid, data] of Object.entries(snap.val())) {
        const dn = data?.profile?.displayName;
        if (dn && dn.replace(/ 💎/g, "").toLowerCase() === clean) {
            return uid;
        }
    }
    return null;
}
async function renderMessageInstant(id, msg) {
    if (document.getElementById("msg-" + id)) return null;
    const div = document.createElement("div");
    div.className = "msg";
    div.id = "msg-" + id;
    div.dataset.timestamp = msg.timestamp || Date.now();
    const topRow = document.createElement("div");
    topRow.id = "topRow";
    const nameSpan = document.createElement("span");
    nameSpan.id = "msgName";
    nameSpan.className = "highlight";
    nameSpan.style.color = "#aaa";
    nameSpan.style.cursor = "pointer";
    nameSpan.textContent = "User";
    const leftWrapper = document.createElement("span");
    leftWrapper.style.display = "flex";
    leftWrapper.style.gap = "6px";
    const profilePic = document.createElement("img");
    profilePic.style.width = "32px";
    profilePic.style.height = "32px";
    profilePic.style.borderRadius = "50%";
    profilePic.style.border = "2px solid white";
    profilePic.style.objectFit = "cover";
    profilePic.style.cursor = "pointer";
    const profilePics = [
        "/pfps/1.jpeg",
        "/pfps/2.jpeg",
        "/pfps/3.jpeg",
        "/pfps/4.jpeg",
        "/pfps/5.jpeg",
        "/pfps/6.jpeg",
        "/pfps/7.jpeg",
        "/pfps/8.jpeg",
        "/pfps/9.jpeg",
        "/pfps/10.jpeg",
        "/pfps/11.jpeg",
        "/pfps/12.jpeg",
        "/pfps/13.jpeg",
        "/pfps/14.jpeg"
    ];
    leftWrapper.appendChild(profilePic);
    leftWrapper.appendChild(nameSpan);
    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp";
    timeSpan.textContent = msg.timestamp ? formatTimestamp(msg.timestamp) : "";
    topRow.appendChild(leftWrapper);
    topRow.appendChild(timeSpan);
    const textDiv = document.createElement("div");
    textDiv.style.whiteSpace = "pre-wrap";
    textDiv.style.marginLeft = "40px";
    textDiv.style.marginTop = "-15px";
    let safeText = (msg.text || "");
    safeText = safeText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    safeText = safeText.replace(
        /&lt;i class="([^"]*(?:fa|bi)[^"]+)"&gt;&lt;\/i&gt;/g,
        '<i class="$1"></i>'
    );
    safeText = safeText.replace(/\n/g, "<br>");
    const mentionRegex = /@([^\s<]+)/g;
    safeText = safeText.replace(mentionRegex, (match, name) => {
        const isSelfMention = currentName && (currentName.toLowerCase() === name.toLowerCase() ||
            currentName.toLowerCase() === name.toLowerCase().replace(" 💎", ""));
        const cls = isSelfMention ? "mention-self" : "mention";
        return `<span class="${cls} mention-user" data-name="${name}">@${name}</span>`;
    });
    const urlRegex = /\b((?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
    safeText = safeText.replace(urlRegex, (match) => {
        let display = match;
        while (/[.,!?;:)\]\"]$/.test(display)) display = display.slice(0, -1);
        let href = display.trim();
        if (!/^https?:\/\//i.test(href)) {
            return match;
        }
        const trailing = match.slice(display.length);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"
            style="color:#4fa3ff; text-decoration:underline; position:relative;">${display}</a>${trailing}`;
    });
    safeText = await processChannelMentions(safeText);
    textDiv.innerHTML = safeText;
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
                console.warn("switchChannel() not defined, cannot change channel:", ch);
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
    div.appendChild(topRow);
    div.appendChild(textDiv);
    div.appendChild(editedSpan);
    (async () => {
        try {
            const [nameSnap, colorSnap, picSnap, badgeSnap, adminSnap, ownerSnap, coOwnerSnap, hAdminSnap, devSnap, pre1Snap, pre2Snap, pre3Snap, testerSnap, hSnap, susSnap, partnerSnap, discordSnap] = await Promise.all([
                get(ref(db, `users/${msg.sender}/profile/displayName`)),
                get(ref(db, `users/${msg.sender}/settings/color`)),
                get(ref(db, `users/${msg.sender}/profile/pic`)),
                get(ref(db, `users/${msg.sender}/settings/badgeText`)),
                get(ref(db, `users/${msg.sender}/profile/isAdmin`)),
                get(ref(db, `users/${msg.sender}/profile/isOwner`)),
                get(ref(db, `users/${msg.sender}/profile/isCoOwner`)),
                get(ref(db, `users/${msg.sender}/profile/isHAdmin`)),
                get(ref(db, `users/${msg.sender}/profile/isDev`)),
                get(ref(db, `users/${msg.sender}/profile/premium1`)),
                get(ref(db, `users/${msg.sender}/profile/premium2`)),
                get(ref(db, `users/${msg.sender}/profile/premium3`)),
                get(ref(db, `users/${msg.sender}/profile/isTester`)),
                get(ref(db, `users/${msg.sender}/profile/mileStone`)),
                get(ref(db, `users/${msg.sender}/profile/isSus`)),
                get(ref(db, `users/${msg.sender}/profile/isPartner`)),
                get(ref(db, `users/${msg.sender}/profile/dUsername`))
            ]);
            let discordUsername = discordSnap.exists() ? discordSnap.val() : "";
            let displayName = nameSnap.exists() ? nameSnap.val() : "User";
            if (!displayName || displayName.trim() === "") {
                displayName = "Spam Account";
            }
            const color = colorSnap.exists() ? colorSnap.val() : "#4fa3ff";
            let badgeText = null;
            const senderIsAdmin = adminSnap.exists() ? adminSnap.val() : false;
            const senderIsDev = devSnap.exists() ? devSnap.val() : false;
            const senderPre1 = pre1Snap.exists() ? pre1Snap.val() :false;
            const senderPre2 = pre2Snap.exists() ? pre2Snap.val() :false;
            const senderPre3 = pre3Snap.exists() ? pre3Snap.val() :false;
            const senderIsSus = susSnap.exists() ? susSnap.val() : false;
            const senderIsPartner = partnerSnap.exists() ? partnerSnap.val() : false;
            const senderIsCoOwner = coOwnerSnap.exists() ? coOwnerSnap.val() : false;
            const senderIsOwner = ownerSnap.exists() ? ownerSnap.val() : false;
            const senderIsHAdmin = hAdminSnap.exists() ? hAdminSnap.val() : false;
            const senderIsTester = testerSnap.exists() ? testerSnap.val() : false;
            const senderIsHUser = hSnap.exists() ? hSnap.val() : false;
            if (senderIsSus) badgeText = "Sus";
            else if (senderIsOwner) badgeText = "OWNR";
            else if (senderIsTester) badgeText = "TSTR";
            else if (senderIsCoOwner) badgeText = "COWNR";
            else if (senderIsHAdmin) badgeText = "HADMIN";
            else if (senderIsAdmin) badgeText = "ADMN";
            else if (senderIsDev) badgeText = "Developer";
            else if (senderIsPartner) badgeText = "Partner";
            else if (senderPre3) badgeText = "Premium3";
            else if (senderPre2) badgeText = "Premium2";
            else if (senderPre1) badgeText = "Premium1";
            else if (senderIsHUser) badgeText = "100";
            if (badgeSnap.exists() && badgeSnap.val().trim() !== "") {
                badgeText = badgeSnap.val();
            }
            const picVal = picSnap.exists() ? picSnap.val() : 0;
            const picIndex = (picVal >= 0 && picVal <= 13) ? picVal : 0;
            profilePic.src = profilePics[picIndex];
            nameSpan.textContent = displayName;
            nameSpan.style.color = color;
            const openProfile = () => {
                const cleanName = encodeURIComponent(displayName.replace(/ /g, ""));
                window.location.href = `InfiniteAccounts.html?user=${msg.sender}`;
            };
            nameSpan.onclick = openProfile;
            profilePic.onclick = openProfile;
            nameSpan.textContent = displayName;
            nameSpan.style.color = color;
            if (((isOwner || isTester) && !senderIsOwner) || (isCoOwner && !senderIsOwner && !senderIsTester && !senderIsCoOwner) || (isHAdmin && !senderIsOwner && !senderIsTester && !senderIsCoOwner && !senderIsHAdmin) || (isAdmin && !senderIsOwner && !senderIsTester && !senderIsCoOwner && !senderIsHAdmin && !senderIsAdmin)) {
                nameSpan.addEventListener("contextmenu", async (e) => {
                    e.preventDefault();
                    const alreadyMuted = await isUserMuted(msg.sender);
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
                            const muteRef = ref(db, `mutedUsers/${msg.sender}`);
                            const expireTime = "Never";
                            await set(muteRef, { expires: expireTime });
                            showSuccess(`User Muted`);
                            closeMenu();
                        };
                        const muteMinutes = document.createElement("div");
                        muteMinutes.textContent = "Minutes";
                        muteMinutes.style.cursor = "pointer";
                        muteMinutes.onclick = async () => {
                            let minutes = prompt("Mute For How Many Minutes?", "5");
                            minutes = parseInt(minutes);
                            if (!isNaN(minutes) && minutes > 0) {
                                const muteRef = ref(db, `mutedUsers/${msg.sender}`);
                                const expireTime = Date.now() + minutes * 60 * 1000;
                                await set(muteRef, { expires: expireTime });
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
                            let hours = prompt("Mute For How Many Hours?", "1");
                            hours = parseInt(hours);
                            if (!isNaN(hours) && hours > 0) {
                                const muteRef = ref(db, `mutedUsers/${msg.sender}`);
                                const expireTime = Date.now() + hours * 60 * 60 * 1000;
                                await set(muteRef, { expires: expireTime });
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
                            let days = prompt("Mute For How Many Days?", "1");
                            days = parseInt(days);
                            if (!isNaN(days) && days > 0) {
                                const muteRef = ref(db, `mutedUsers/${msg.sender}`);
                                const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
                                await set(muteRef, { expires: expireTime });
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
            if (badgeText) {
                const badgeSpan = document.createElement("span");
                badgeSpan.style.marginLeft = "6px";
                badgeSpan.style.fontWeight = "bold";
                let dontShowOthers = false;
                if (badgeText === "Sus") {
                    dontShowOthers = true;
                    badgeSpan.innerHTML = '<i class="bi bi-shield-exclamation"></i>';
                    badgeSpan.style.color = 'red';
                    badgeSpan.title = 'This User Is Currently Under Investigation, Please Do Not Interact With This User';
                } else if (badgeText === "OWNR" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-shield-plus"></i>';
                    badgeSpan.style.color = "lime";
                    badgeSpan.title = "Owner";
                } else if (badgeText === "TSTR" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="fa-solid fa-cogs"></i>';
                    badgeSpan.style.color = "DarkGoldenRod";
                    badgeSpan.title = "Tester";
                } else if (badgeText === "COWNR" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-shield-fill"></i>';
                    badgeSpan.style.color = "lightblue";
                    badgeSpan.title = "Co-Owner";
                } else if (badgeText === "HADMIN" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
                    badgeSpan.style.color = "#00cc99";
                    badgeSpan.title = "Head Admin";
                } else if (badgeText === "ADMN" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-shield"></i>';
                    badgeSpan.style.color = "dodgerblue";
                    badgeSpan.title = "Admin";
                } else if (badgeText === "Partner" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="fa fa-handshake"></i>';
                    badgeSpan.style.color = 'cornflowerblue';
                    badgeSpan.title = "This User Is A Partner Of Infinite Campus";
                } else if (badgeText === "Developer" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-code-square"></i>';
                    badgeSpan.style.color = "green";
                    badgeSpan.title = "This User Is A Developer For Infinitecampus.xyz";
                } else if (badgeText === "Premium3" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-hearts"></i>';
                    badgeSpan.style.color = 'red';
                    badgeSpan.title = 'This User Has Infinite Campus Premium T3';
                } else if (badgeText === "Premium2" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-heart-fill"></i>';
                    badgeSpan.style.color = 'orange';
                    badgeSpan.title = 'This User Has Infinite Campus Premium T2';
                } else if (badgeText === "Premium1" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-heart-half"></i>';
                    badgeSpan.style.color = 'yellow';
                    badgeSpan.title = 'This User Has Infinite Campus Premium T1';
                } else if (badgeText === "100" && !dontShowOthers) {
                    badgeSpan.innerHTML = '<i class="bi bi-award"></i>';
                    badgeSpan.style.color = "yellow";
                    badgeSpan.title = "This User Is The 100th Signed Up User";
                } else {
                    badgeSpan.textContent = `${badgeText}`;
                    badgeSpan.style.color = "pink";
                    badgeSpan.title = "Custom Badge";
                }
                if (discordSnap.exists() && discordSnap.val().trim() !== "") {
                    const dUsername = discordSnap.val();
                    const icon = document.createElement("i");
                    icon.className = "bi bi-discord";
                    icon.style.color = "#5865F2";
                    icon.style.marginLeft = "6px";
                    icon.title = `Known As @${dUsername} On Discord`;
                    badgeSpan.appendChild(icon);
                }
                leftWrapper.appendChild(badgeSpan);
            }
            const isSelf = msg.sender === currentUser.uid;
            if (isSelf || isOwner || isAdmin || isCoOwner || isHAdmin || isTester) {
                let canDelete = false;
                if (isSelf) canDelete = true;
                else if (isOwner || isTester) canDelete = true;
                else if (isCoOwner && !senderIsOwner && !senderIsTester && !senderIsCoOwner && !senderIsOwner) canDelete = true;
                else if (isHAdmin && !senderIsOwner && !senderIsCoOwner && !senderIsTester && !senderIsHAdmin) canDelete = true;
                else if (isAdmin && !senderIsHAdmin && !senderIsAdmin && !senderIsCoOwner && !senderIsOwner && senderIsTester) canDelete = true;
                let canEdit = false;
                if (isSelf) canEdit = true;
                else if (isOwner || isTester) canEdit = true;
                else if (isCoOwner && !senderIsOwner && !senderIsTester && !senderIsCoOwner && !senderIsHAdmin) canEdit = true;
                if (canDelete) {
                    const delBtn = document.createElement("button");
                    delBtn.textContent = "Delete";
                    delBtn.onclick = () => remove(ref(db, currentPath + "/" + id));
                    div.appendChild(delBtn);
                }
                if (canEdit) {
                    const editBtn = document.createElement("button");
                    editBtn.textContent = "Edit";
                    editBtn.onclick = () => {
                        if (div.querySelector("textarea")) return;
                        const textarea = document.createElement("textarea");
                        textarea.value = msg.text;
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
                                    await update(ref(db, currentPath + "/" + id), {
                                        text: newText,
                                        edited: true
                                    });
                                }
                                textarea.remove();
                                textDiv.style.display = "block";
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                textarea.remove();
                                textDiv.style.display = "block";
                            }
                        });
                    };
                    div.appendChild(editBtn);
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
            const mentionRef = ref(db, `metadata/${currentUser.uid}/mentions/${id}`);
            get(mentionRef).then((snapshot) => {
                const data = snapshot.val();
                if (!data || data.seen === false) {
                    if (currentPath && currentPath.startsWith("messages/")) {
                        const channelName = currentPath.split("/")[1];
                    }
                    mentionNotif.style.display = "inline";
                    mentionNotif.dataset.msgid = id;
                    if (!data) {
                        set(mentionRef, {
                            seen: false,
                            channel: currentPath?.split("/")[1] || null,
                        });
                    }
                    (async () => {
                        const nm = await getDisplayName(msg.sender);
                        mentionNotif.textContent = `You Were Mentioned By ${nm}!`;
                        mentionNotif.animate(
                            [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }],
                            { duration: 1000 }
                        );
                        playNotificationSound()
                    })();
                }
            });
        }
    } catch (e) {
        showError(e);
    }
    return div;
}
async function cleanExpiredMutes() {
    const mutedRef = ref(db, 'mutedUsers');
    const snap = await get(mutedRef);
    if (!snap.exists()) return;
    const allMutes = snap.val();
    for (const uid in allMutes) {
        const data = allMutes[uid];
        if (data.expires && Date.now() > data.expires) {
            await remove(ref(db, `mutedUsers/${uid}`));
            console.log(`Expired Mute For ${uid} Removed`);
        }
    }
}
cleanExpiredMutes();
setInterval(cleanExpiredMutes, 1000);
async function attachMessageListeners(msgRef) {
    detachCurrentMessageListeners();
    currentMsgRef = msgRef;
    chatLog.innerHTML = "";
    const snapshot = await get(msgRef);
    const msgs = snapshot.exists() ? snapshot.val() : {};
    const entries = Object.entries(msgs).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const renderPromises = entries.map(([id, msg]) => renderMessageInstant(id, msg));
    const createdDivs = await Promise.all(renderPromises);
    createdDivs.forEach(d => { if (d) chatLog.appendChild(d); });
    scrollToBottom(true);
    currentListeners.added = onChildAdded(msgRef, async snap => {
        if (msgRef !== currentMsgRef) return;
        const key = snap.key;
        const val = snap.val();
        if (!document.getElementById("msg-" + key)) {
            const newDiv = await renderMessageInstant(key, val);
            if (!newDiv) return;
            const newTs = Number(val.timestamp || Date.now());
            const msgsEls = Array.from(chatLog.querySelectorAll(".msg"));
            let inserted = false;
            for (const el of msgsEls) {
                const elTs = Number(el.dataset.timestamp || 0);
                if (elTs > newTs) {
                    chatLog.insertBefore(newDiv, el);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) chatLog.appendChild(newDiv);
            const mentionsYou = messageMentionsYou(val.text);
            if (!mentionsYou && autoScrollEnabled) {
                scrollToBottom(true);
            } else {
            }
        }
    });
    currentListeners.removed = onChildRemoved(msgRef, snap => {
        if (msgRef !== currentMsgRef) return;
        const el = document.getElementById("msg-" + snap.key);
        if (el) el.remove();
    });
    currentListeners.changed = onChildChanged(msgRef, snap => {
        if (msgRef !== currentMsgRef) return;
        const el = document.getElementById("msg-" + snap.key);
        if (el) {
            const textDiv = el.querySelector("div:nth-child(2)");
            const editedSpan = el.querySelector(".edited-label");
            const updatedMsg = snap.val();
            let safeText = (updatedMsg.text || "");
            safeText = safeText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            safeText = safeText.replace(
                /&lt;i class="([^"]*(?:fa|bi)[^"]+)"&gt;&lt;\/i&gt;/g,
                '<i class="$1"></i>'
            );
            safeText = safeText.replace(/\n/g, "<br>");
            const mentionRegex = /@([^\s<]+)/g;
            safeText = safeText.replace(mentionRegex, (match, name) => {
                const isSelfMention = currentName && (currentName.toLowerCase() === name.toLowerCase() ||
                    currentName.toLowerCase() === name.toLowerCase().replace(" 💎", ""));
                const cls = isSelfMention ? "mention-self" : "mention";
                return `<span class="${cls}">@${name}</span>`;
            });
            textDiv.innerHTML = safeText;
            editedSpan.textContent = snap.val().edited ? "(Edited)" : "";
        }
    });
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
    const msgRef = ref(db, path);
    onChildAdded(msgRef, snap => {
        const msg = snap.val();
        if (msg && msg.sender !== currentUser.uid) {
            playNotificationSound();
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
    const emailRef = ref(db, `users/${currentUser.uid}/settings/userEmail`);
    const emailSnap = await get(emailRef);
    if (!emailSnap.exists()) {
        await set(emailRef, currentUser.email);
    }
    const msg = {
        sender: currentUser.uid,
        text,
        timestamp: Date.now()
    };
    await set(push(ref(db, path)), msg);
    await update(ref(db, `metadata/${currentUser.uid}/privateChats/${otherUid}`), {
        lastRead: Date.now(),
        unreadCount: 0
    });
    const recipientMetaRef = ref(db, `metadata/${otherUid}/privateChats/${currentUser.uid}`);
    await runTransaction(recipientMetaRef, curr => {
        if (curr === null) return { lastRead: 0, unreadCount: 1 };
        return { ...curr, unreadCount: (curr.unreadCount || 0) + 1 };
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
    attachMessageListeners(ref(db, currentPath));
    await update(ref(db, `metadata/${currentUser.uid}/privateChats/${uid}`), {
        lastRead: Date.now(),
        unreadCount: 0
    });
}
async function updatePrivateListFromSnapshot(chatsSnapshot) {
    privateList.innerHTML = "";
    if (!chatsSnapshot) return;
    const chats = chatsSnapshot;
    for (const otherUid of Object.keys(chats)) {
        const meta = chats[otherUid] || {};
        const name = await getDisplayName(otherUid);
        const li = document.createElement("li");
        li.dataset.uid = otherUid;
        const left = document.createElement("div");
        left.className = "left";
        const unreadCount = Number(meta.unreadCount || 0);
        if (unreadCount > 0 && currentPrivateUid !== otherUid) {
            const dot = document.createElement("span");
            dot.className = "notifDot";
            dot.textContent = "•";
            left.appendChild(dot);
        }
        const usernameSpan = document.createElement("span");
        usernameSpan.textContent = "" + name;
        left.appendChild(usernameSpan);
        li.appendChild(left);
        const closeBtn = document.createElement("button");
        closeBtn.className = "closeBtn";
        closeBtn.textContent = "X";
        closeBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm("Close This Private Chat? Messages Will Still Be Saved")) return;
            await remove(ref(db, `metadata/${currentUser.uid}/privateChats/${otherUid}`));
        };
        li.appendChild(closeBtn);
        li.onclick = () => openPrivateChat(otherUid, name);
        if (currentPrivateUid === otherUid) li.classList.add("active");
        privateList.appendChild(li);
        attachPrivateMessageListener(otherUid);
    }
}
function startChannelListeners() {
    const channelsRef = ref(db, "channels");
    onChildAdded(channelsRef, snap => { renderChannelsFromDB(); });
    onChildRemoved(channelsRef, snap => {
        if (currentPath && currentPath.startsWith("messages/") && currentPath.endsWith("/" + snap.key) ) {
            switchChannel("General");
            scrollToBottom();
        }
        renderChannelsFromDB();
    });
    onChildChanged(channelsRef, snap => { renderChannelsFromDB(); });
}
async function renderChannelsFromDB() {
    channelList.innerHTML = "";
    const snap = await get(ref(db, "channels"));
    const chans = snap.exists() ? snap.val() : {};
    if (!("General" in chans)) {
        await set(ref(db, "channels/General"), true);
        chans.General = true;
    }
    const keys = Object.keys(chans).sort();
    keys.forEach(ch => {
        if (isRestrictedChannel(ch) && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isPre2 || isPre3)) return;
        const li = document.createElement("li");
        const textNode = document.createTextNode("" + ch);
        li.appendChild(textNode);
        li.onclick = () => { currentPrivateUid = null; switchChannel(ch); };
        if (!currentPrivateUid && currentPath === `messages/${ch}`) li.classList.add("active");
        if ((isOwner || isCoOwner || isTester) && ch !== "General") {
            const btnWrap = document.createElement("span");
            btnWrap.style.marginLeft = "10px";
            const renameBtn = document.createElement("button");
            renameBtn.textContent = "✎";
            renameBtn.onclick = async (e) => {
                e.stopPropagation();
                const newName = prompt("Rename Channel:", ch);
                if (newName && newName.trim() && newName !== ch) {
                    try {
                        const channelSnap = await get(ref(db, `channels/${ch}`));
                        if (channelSnap.exists()) {
                            await set(ref(db, `channels/${newName}`), channelSnap.val());
                        }
                        const msgSnap = await get(ref(db, `messages/${ch}`));
                        if (msgSnap.exists()) {
                            await set(ref(db, `messages/${newName}`), msgSnap.val());
                        }
                        await remove(ref(db, `channels/${ch}`));
                        await remove(ref(db, `messages/${ch}`));
                        showError(`Channel Renamed From ${ch} To ${newName}`);
                    } catch (err) {
                        showError("Error Renaming Channel:", err);
                    }
                }
            };
            const delBtn = document.createElement("button");
            delBtn.textContent = "🗑";
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Delete Channel ${ch}? This Will Remove All Messages.`)) {
                    await remove(ref(db, `channels/${ch}`));
                    await remove(ref(db, `messages/${ch}`));
                }
            };
            btnWrap.appendChild(renameBtn);
            btnWrap.appendChild(delBtn);
            li.appendChild(btnWrap);
        }
        channelList.appendChild(li);
    });
    if (isOwner || isCoOwner || isTester) {
        newChannelName.style.display = "inline-block";
        addChannelBtn.style.display = "inline-block";
    } else {
        newChannelName.style.display = "none";
        addChannelBtn.style.display = "none";
    }
}
function switchChannel(ch) {
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
        attachMessageListeners(ref(db, currentPath));
    }
    if (typingRef) {
        try { off(typingRef, 'value'); } catch (e) { /* ignore */ }
        typingRef = null;
    }
    typingRef = ref(db, `typing/${ch}`);
    onValue(typingRef, (snap) => {
        const typingUsers = snap.val() || {};
        const names = Object.entries(typingUsers)
        .map(([_, val]) => (val && val.name) ? val.name : 'Someone');
        if (names.length > 0) {
            typingIndicator.textContent =
            names.length === 1
            ? `${names[0]} Is Typing...`
            : `${names.join(", ")} Are Typing...`;
            typingIndicator.style.display = "block";
        } else {
            typingIndicator.style.display = "none";
        }
    });
    clearChannelMention(ch);
    renderChannelsFromDB();
}
function startMetadataListener() {
    if (metadataListenerRef) return;
    metadataListenerRef = ref(db, `metadata/${currentUser.uid}/privateChats`);
    onValue(metadataListenerRef, snap => {
        const val = snap.exists() ? snap.val() : null;
        updatePrivateListFromSnapshot(val);
    });
}
sendBtn.onclick = async () => {
    if (!currentPath) return;
    let text = chatInput.value;
    const trimmed = text.trim();
    if (!trimmed) return;
    const muted = await isUserMuted(currentUser.uid);
    if (muted) {
        return;
    }
    if (!isAdmin  && !isHAdmin && !isOwner && !isCoOwner && !isTester) {
        const now = Date.now();
        if (now - lastMessageTimestamp < MESSAGE_COOLDOWN) {
            showError("You Can Only Send A Message Every 3 Seconds.");
            return;
        }
        lastMessageTimestamp = now;
    }
    const mentions = trimmed.match(/@\w+/g);
    if (mentions && mentions.length > 1) {
        showError("Only One Mention Per Message Is Allowed.");
        chatInput.value = "";
        return;
    }
    if (trimmed.length > 1000 && !(isCoOwner || isOwner || isHAdmin || isTester)) {
        showError(`Your Message Is Too Long (${trimmed.length} Characters). Please Keep It Under 1000.`);
        chatInput.value = "";
        return;
    }
    const emailRef = ref(db, `users/${currentUser.uid}/settings/userEmail`);
    const emailSnap = await get(emailRef);
    if (!emailSnap.exists()) {
        await set(emailRef, currentUser.email);
    }
    let outgoingText = text;
    outgoingText = outgoingText.replace(/@Hacker41(\b(?!\s*💎))/gi, "@Hacker41 💎");
    const msg = {
        sender: currentUser.uid,
        text: outgoingText,
        timestamp: Date.now()
    };
    if (currentPrivateUid) {
        await sendPrivateMessage(currentPrivateUid, outgoingText);
    } else {
        if ((currentPath === "messages/Admin-Chat" || currentPath === "messages/Premium-Chat") && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isDev || isPre2 || isPre3)) {
            showError("You Cannot Send Messages To Restricted Channels");
            chatInput.value = "";
            return;
        }
        await push(ref(db, currentPath), msg);
    }
    chatInput.value = "";
    if (typingRef && currentUser) {
    const channelName = currentPath.split("/")[1];
    remove(ref(db, `typing/${channelName}/${currentUser.uid}`));
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
    const thisTypingRef = ref(db, `typing/${ch}/${currentUser.uid}`);
    set(thisTypingRef, { name: currentName, typing: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        remove(thisTypingRef);
    }, 3000);
});
sendBtn.addEventListener("click", async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    if (!currentUser) return;
    const muted = await isUserMuted(currentUser.uid);
    if (muted) {
        showError("You Are Muted And Cannot Send Messages Right Now.");
        return;
    }
    if (!currentUser || !currentPath || !currentPath.startsWith("messages/")) return;
    const ch = currentPath.split("/")[1];
    remove(ref(db, `typing/${ch}/${currentUser.uid}`));
});
const mentionHint = document.getElementById("mentionHint");
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
    const pre1snap = await get(ref(db, `users/${user.uid}/profile/premium1`));
    const pre2snap = await get(ref(db, `users/${user.uid}/profile/premium2`));
    const pre3snap = await get(ref(db, `users/${user.uid}/profile/premium3`));
    const devSnap = await get(ref(db, `users/${user.uid}/profile/isDev`));
    const adminSnap = await get(ref(db, `users/${user.uid}/profile/isAdmin`));
    const coOwnerSnap = await get(ref(db, `users/${user.uid}/profile/isCoOwner`));
    const hAdminSnap = await get(ref(db, `users/${user.uid}/profile/isHAdmin`));
    const testerSnap = await get(ref(db, `users/${user.uid}/profile/isTester`));
    const susSnap = await get(ref(db, `users/${user.uid}/profile/isSus`));
    const partnerSnap = await get(ref(db, `users/${user.uid}/profile/isPartner`));
    currentUser = user;
    const ownerSnap = await get(ref(db, `users/${user.uid}/profile/isOwner`));
    isOwner = ownerSnap.exists() && ownerSnap.val() === true;
    if (user.email === "infinitecodehs@gmail.com") isOwner = true;
    isCoOwner = coOwnerSnap.exists() ? coOwnerSnap.val() : false;
    isAdmin = adminSnap.exists() ? adminSnap.val() : false;
    isHAdmin = hAdminSnap.exists() ? hAdminSnap.val() : false;
    isTester = testerSnap.exists() ? testerSnap.val() : false;
    isDev = devSnap.exists() ? devSnap.val() : false;
    isPre1 = pre1snap.exists() ? pre1snap.val() : false;
    isPre2 = pre2snap.exists() ? pre2snap.val() : false;
    isPre3 = pre3snap.exists() ? pre3snap.val() : false;
    isSus = susSnap.exists() ? susSnap.val() : false;
    isPartner = partnerSnap.exists() ? partnerSnap.val() : false;
    adminControls.style.display = (isAdmin || isOwner || isCoOwner || isHAdmin || isTester) ? "block" : "none";
    newChannelName.style.display = (isCoOwner || isOwner || isTester) ? "inline-block" : "none";
    addChannelBtn.style.display = (isCoOwner || isOwner || isTester) ? "inline-block" : "none";
    await ensureDisplayName(user);
    await loadMentionSetting(user);
    await loadAllUsernames(); 
    startChannelListeners();
    await renderChannelsFromDB();
    if (currentPath && ((currentPath.includes("messages/Admin-Chat")) || (currentPath.includes("messages/Premium-Chat"))) && !(isAdmin || isOwner || isCoOwner || isHAdmin || isTester || isDev || isPre3 || isPre2)) {
        switchChannel("General");
    }
    if (!currentPath) switchChannel("General");
    startMetadataListener();
    const mentionsRef = ref(db, `mentions/${currentUser.uid}`);
    onChildAdded(mentionsRef, snap => { console.log("Mention: ", snap.val()); });
    const storedUid = localStorage.getItem("openPrivateChatUid");
    if (storedUid) {
        getDisplayName(storedUid).then(name => {
            openPrivateChat(storedUid, name);
        });
        localStorage.removeItem("openPrivateChatUid");
    }
    const nameSnap = await get(ref(db, `users/${user.uid}/profile/displayName`));
    const bioSnap = await get(ref(db, `users/${user.uid}/profile/bio`));
    const bioDisplay = bioSnap.exists() ? bioSnap.val() : `Bio Not Set`;
    let displayName = nameSnap.exists() ? nameSnap.val() : user.email;
    if (!displayName || displayName.trim() === "") {
        displayName = "Spam Account";
    }
    const nameColor = await get(ref(db, `users/${user.uid}/settings/color`));
    const DNC = nameColor.exists() ? nameColor.val() : `#ffffff`;
    isAdmin = adminSnap.exists() ? adminSnap.val() : false;
    isOwner = ownerSnap.exists() ? ownerSnap.val() : false;
    isHAdmin = hAdminSnap.exists() ? hAdminSnap.val() : false;
    isTester = testerSnap.exists() ? testerSnap.val() : false;
    roleSpan.textContent = isSus ? "Suspicious Account" : (isOwner ? "Owner" : (isAdmin ? "Admin" : (isCoOwner ? "Co-Owner" : (isHAdmin ? "Head Admin" : (isTester ? "Tester" : (isPartner ? "Partner" :(isDev ? "Developer" :(isPre3 ? "Premium T3" :(isPre2 ? "Premium T2" :(isPre1 ? "Premium T1" : "User"))))))))));
    roleSpan.style.color = isSus ? "red" : (isOwner ? "lime" : (isAdmin ? "dodgerblue" : (isCoOwner ? "lightblue" : (isHAdmin ? "#00cc99" : (isTester ? "darkGoldenRod" : (isPartner ? "cornflowerblue" :(isDev ? "green" :(isPre3 ? "red" :(isPre2 ? "orange" :(isPre1 ? "yellow" :"white"))))))))));
    bioSpan.textContent = bioDisplay;
    bioSpan.style.color = "gray";
    bioSpan.style.fontSize = "60%";
    usernameSpan.textContent = displayName;
    usernameSpan.style.color = DNC;
    const pfpSnap = await get(ref(db, `users/${user.uid}/profile/pic`));
    const pfpIndex = pfpSnap.exists() ? pfpSnap.val() : 0;
    const profilePics = [
        "/pfps/1.jpeg",
        "/pfps/2.jpeg",
        "/pfps/3.jpeg",
        "/pfps/4.jpeg",
        "/pfps/5.jpeg",
        "/pfps/6.jpeg",
        "/pfps/7.jpeg",
        "/pfps/8.jpeg",
        "/pfps/9.jpeg",
        "/pfps/10.jpeg",
        "/pfps/11.jpeg",
        "/pfps/12.jpeg",
        "/pfps/13.jpeg",
        "/pfps/14.jpeg"
    ];
    const sidebarPfp = document.getElementById("sidebarPfp");
    if (sidebarPfp) {
        sidebarPfp.src = profilePics[pfpIndex];
    }
});
async function loadAllUsernames() {
    const usersSnap = await get(ref(db, "users"));
    allUsernames = [];
    if (usersSnap.exists()) {
        const data = usersSnap.val();
        for (const uid of Object.keys(data)) {
            if (data[uid].profile && data[uid].profile.displayName) {
                allUsernames.push(data[uid].profile.displayName);
            }
        }
    }
}
addChannelBtn.onclick = async () => {
    if (!(isOwner || isCoOwner || isTester || currentUser.email === "infinitecodehs@gmail.com")) return;
    const name = newChannelName.value.trim();
    if (!name) return;
    await set(ref(db, `channels/${name}`), true);
    newChannelName.value = "";
};
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