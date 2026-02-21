import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { ref, get, set, remove, onValue } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
const privateChatsDiv = document.getElementById("privateChats");
const chatView = document.getElementById("chatView");
const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const deleteChatBtn = document.getElementById("deleteChat");
deleteChatBtn.className = "btn btn-secondary";
const backButton = document.getElementById("backButton");
const userListDiv = document.getElementById("userList");
const userEditDiv = document.getElementById("userEdit");
const editTitle = document.getElementById("editTitle");
const userDataTextarea = document.getElementById("userData");
const saveUserBtn = document.getElementById("saveUser");
const backToListBtn = document.getElementById("backToList");
const sendAsSelect = document.getElementById("sendAsSelect");
const adminMsgInput = document.getElementById("adminMessageInput");
const sendAdminMessageBtn = document.getElementById("sendAdminMessage");
const typingSection = document.getElementById("typingSection");
const muteSection = document.getElementById("mutedUsers");
let currentChatPath = null;
let currentUserEditUID = null;
let userProfiles = {};
let userSettings = {};
let activeChatListener = null;
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
async function logMutedUsers() {
    try {
        const snapshot = await get(ref(db, "mutedUsers"));
        if (!snapshot.exists()) {
            if (muteSection) muteSection.textContent = "";
            return;
        }
        const mutedData = snapshot.val();
        if (muteSection) muteSection.innerHTML = "";
        muteSection.textContent = "Muted Users";
        muteSection.style.maxWidth = "fit-content";
        for (const uid of Object.keys(mutedData)) {
            const userDiv = document.createElement('div');
            userDiv.style.padding = "5px";
            userDiv.style.marginBottom = "5px";
            userDiv.style.background = "#222";
            userDiv.style.borderRadius = "6px";
            const picSnap = await get(ref(db, `users/${uid}/profile/pic`));
            const picVal = picSnap.exists() ? picSnap.val() : "0";
            const nameSnap = await get(ref(db, `users/${uid}/profile/displayName`));
            const nameVal = nameSnap.exists() ? nameSnap.val() : "User";
            const colorSnap = await get(ref(db, `users/${uid}/settings/color`));
            const colorVal = colorSnap.exists() ? colorSnap.val() : "white";
            const emailSnap = await get(ref(db, `users/${uid}/settings/userEmail`));
            const emailVal = emailSnap.exists() ? emailSnap.val() : "No Email";
            const header = document.createElement('div');
            let picIndex = parseInt(picVal);
            let picSrc = "/pfps/1.jpeg";
            if (!isNaN(picIndex) && picIndex > 0 && picIndex <= profilePics.length) {
                picSrc = profilePics[picIndex];
            }
            header.innerHTML = `<img src="${picSrc}" alt="${nameVal}'s Pic" style="height:30px; width:30px; border:1px solid white; border-radius:50%;"><span style="margin-left:10px; font-size:0.9em; color:${colorVal};">${nameVal}</span>`;
            const desc = document.createElement('div');
            const expires = mutedData[uid]?.expires;
            desc.style.marginLeft = "35px";
            desc.style.marginTop = "-10px";
            if (expires != "Never") {
                const readable = new Date(expires).toLocaleString();
                desc.innerHTML = `<span style="font-size:0.7em;color:grey;">Email: ${emailVal}</span><p style="font-size:0.7em;color:grey;margin-top:-5px;">Expires At ${readable}</p>`;
            } else {
                desc.innerHTML = `<span style="font-size:0.7em;color:grey;">Email: ${emailVal}</span><p style="font-size:0.7em;color:grey;margin-top:-5px;">Never Expires</p>`;
            }
            const unmuteBtn = document.createElement('button');
            unmuteBtn.className = "btn btn-secondary";
            unmuteBtn.title = `Unmute ${nameVal}`;
            unmuteBtn.textContent = "Unmute";
            unmuteBtn.onclick = async () => {
                if (!confirm(`Unmute ${nameVal}?`)) return;
                try {
                    await remove(ref(db, `mutedUsers/${uid}`));
                    showSuccess(`${nameVal} Was Unmuted`);
                    userDiv.remove();
                } catch (err) {
                    showError("Failed To Unmute: " + err.message);
                }
            };
            userDiv.appendChild(header);
            userDiv.appendChild(desc);
            userDiv.appendChild(unmuteBtn);
            if (muteSection) muteSection.appendChild(userDiv);
        }
    } catch (err) {
        console.error("Error Fetching Muted Users:", err);
    }
}
logMutedUsers();
const deleteTypingBtn = document.getElementById("deleteTypingBtn");
if (deleteTypingBtn) deleteTypingBtn.style.display = "none";
let typingContainer;
let typingListDiv;
let unverifiedContainer;
function createTypingAndUnverifiedUI() {
    if (!typingSection) {
        console.warn("Typing Element Not Found");
        return;
    }
    typingSection.style.display = "flex";
    typingSection.style.gap = "16px";
    typingSection.style.alignItems = "flex-start";
    typingContainer = document.createElement("div");
    typingContainer.id = "typingContainer";
    typingContainer.style.display = "flex";
    typingContainer.style.flexDirection = "column";
    if (deleteTypingBtn) {
        deleteTypingBtn.style.display = "none";
        deleteTypingBtn.style.marginBottom = "8px";
        deleteTypingBtn.style.padding = "8px 10px";
        deleteTypingBtn.style.borderRadius = "6px";
        deleteTypingBtn.style.cursor = "pointer";
        typingContainer.appendChild(deleteTypingBtn);
    } else {
        console.warn("Typing Btn Not Found");
    }
    typingListDiv = document.createElement("div");
    typingListDiv.id = "typingListDiv";
    typingListDiv.style.minHeight = "30px";
    typingListDiv.style.fontSize = "14px";
    typingListDiv.style.color = "#ddd";
    typingListDiv.style.marginTop = "6px";
    typingContainer.appendChild(typingListDiv);
    unverifiedContainer = document.createElement("div");
    unverifiedContainer.id = "unverifiedContainer";
    unverifiedContainer.style.width = "420px";
    unverifiedContainer.style.border = "1px solid rgba(255,255,255,0.06)";
    unverifiedContainer.style.padding = "12px";
    unverifiedContainer.style.borderRadius = "8px";
    unverifiedContainer.style.background = "#0f0f0f";
    unverifiedContainer.style.color = "#ddd";
    const title = document.createElement("h3");
    title.textContent = "Unverified Users";
    title.style.margin = "0 0 8px 0";
    title.style.fontSize = "16px";
    unverifiedContainer.appendChild(title);
    const viewer = document.createElement("div");
    viewer.id = "unverifiedViewer";
    unverifiedContainer.appendChild(viewer);
    typingSection.appendChild(typingContainer);
    typingSection.appendChild(unverifiedContainer);
}
createTypingAndUnverifiedUI();
let unverifiedUsers = [];
let unverifiedIndex = 0;
let typingListenerUnsub = null;
let usersListenerUnsub = null;
async function updateTypingUI(typingSnapshot) {
    if (!typingListDiv || !deleteTypingBtn) return;
    const typingVal = typingSnapshot && typingSnapshot.exists() ? typingSnapshot.val() : null;
    if (typingVal) {
        deleteTypingBtn.style.display = "inline-block";
    } else {
        deleteTypingBtn.style.display = "none";
    }
    typingListDiv.innerHTML = "";
    if (!typingVal) {
        typingListDiv.textContent = "No Typing Data";
        return;
    }
    const lines = [];
    for (const channelName of Object.keys(typingVal)) {
        const entry = typingVal[channelName];
        if (!entry) continue;
        for (const uid of Object.keys(entry)) {
            if (!uid) continue;
            const cached = userProfiles[uid]?.displayName;
            if (cached) {
                const profile = userProfiles[uid];
                let picNum = parseInt(profile.pic);
                if (isNaN(picNum) || picNum <= 0) {
                    picNum = 0;
                }
                if (picNum > profilePics.length) {
                    picNum = 0;
                }
                const colorSnap = await get(ref(db, `users/${uid}/settings/color`));
                const color = colorSnap.exists() ? colorSnap.val() : "white";
                const picSrc = profilePics[picNum];
                lines.push({ uid, displayName: cached, channelName, picSrc, color});
            } else {
                try {
                    const pSnap = await get(ref(db, `users/${uid}/profile`));
                    const colorSnap = await get(ref(db, `users/${uid}/settings/color`));
                    const profile = pSnap.exists() ? pSnap.val() : {};
                    const color = colorSnap.exists() ? colorSnap.val() : "white";
                    const displayName = profile.displayName || uid;
                    const picNum = parseInt(profile.pic);
                    const picSrc = (!isNaN(picNum) && picNum > 0 && picNum <= profilePics.length) ? profilePics[picNum] : (profile.pic || profilePics[0]);
                    userProfiles[uid] = userProfiles[uid] || {};
                    userProfiles[uid].displayName = displayName;
                    userProfiles[uid].pic = profile.pic || "";
                    lines.push({ uid, displayName, channelName, picSrc, color});
                } catch (err) {
                    console.warn("Failed Fetch Profile For Typing Uid:", uid, err);
                    lines.push({ uid, displayName, channelName, picSrc, color});
                }
            }
        }
    }
    if (lines.length === 0) {
        typingListDiv.textContent = "No Users Typing";
    } else {
        lines.forEach(l => {
            const mdiv = document.createElement("div");
            mdiv.style.padding = "8px";
            mdiv.style.background = "#222";
            mdiv.style.borderRadius = "10px";
            mdiv.style.marginBottom = "4px";
            mdiv.style.border = "1px solid #333";
            const p = document.createElement("span");
            const typic = document.createElement("img");
            typic.src = `${l.picSrc}`;
            typic.style.border = "1px solid white";
            typic.style.borderRadius = "50%";
            typic.style.height = "30px";
            typic.style.width = "30px";
            p.style.padding = "4px 0";
            p.style.marginLeft = "10px";
            p.innerHTML = `<span style="color:${l.color};">${l.displayName}</span> Is Typing In #${l.channelName}`;
            typingListDiv.appendChild(mdiv);
            mdiv.appendChild(typic);
            mdiv.appendChild(p);
        });
    }
}
function listenForTyping() {
    const typingRef = ref(db, "typing");
    if (typingListenerUnsub) {
    }
    onValue(typingRef, snapshot => {
        updateTypingUI(snapshot);
    }, (err) => {
        console.error("Typing Listener Error:", err);
    });
}
async function refreshUnverifiedUsers() {
    const usersRef = ref(db, "users");
    try {
        const snap = await get(usersRef);
        if (!snap.exists()) {
            unverifiedUsers = [];
            unverifiedIndex = 0;
            renderUnverifiedViewer();
            return;
        }
        const all = snap.val();
        const list = [];
        for (const [uid, uData] of Object.entries(all)) {
            const verified = uData?.profile?.verified === true;
            if (!verified) {
                list.push({ uid, data: uData });
            }
        }
        unverifiedUsers = list;
        if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
        renderUnverifiedViewer();
    } catch (err) {
        console.error("Failed To Load Users For Unverified List:", err);
        unverifiedUsers = [];
        unverifiedIndex = 0;
        renderUnverifiedViewer();
    }
}
function showNextUnverified() {
    if (!unverifiedUsers || unverifiedUsers.length === 0) return;
    unverifiedIndex = (unverifiedIndex + 1) % unverifiedUsers.length;
    renderUnverifiedViewer();
}
function renderUnverifiedViewer() {
    const viewer = document.getElementById("unverifiedViewer");
    viewer.innerHTML = "";
    if (!unverifiedUsers || unverifiedUsers.length === 0) {
        const none = document.createElement("div");
        none.textContent = "No Unverified Users Found.";
        viewer.appendChild(none);
        return;
    }
    const current = unverifiedUsers[unverifiedIndex];
    const uid = current.uid;
    const data = current.data || {};
    const profile = data.profile || {};
    const settings = data.settings || {};
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    const picNum = parseInt(profile.pic);
    const picSrc = (!isNaN(picNum) && picNum > 0 && picNum <= profilePics.length) ? profilePics[picNum] : (profile.pic || profilePics[0]);
    const img = document.createElement("img");
    img.src = picSrc;
    img.width = 64;
    img.height = 64;
    img.style.borderRadius = "8px";
    img.alt = "pic";
    const titleBlock = document.createElement("div");
    const displayNameToShow = profile.displayName || settings.displayName || uid;
    const nameEl = document.createElement("div");
    nameEl.textContent = displayNameToShow;
    nameEl.style.fontWeight = "700";
    nameEl.style.fontSize = "15px";
    nameEl.style.color = settings.color;
    const idEl = document.createElement("div");
    idEl.textContent = `UID: ${uid}`;
    idEl.style.fontSize = "12px";
    idEl.style.opacity = "0.8";
    titleBlock.appendChild(nameEl);
    titleBlock.appendChild(idEl);
    header.appendChild(img);
    header.appendChild(titleBlock);
    viewer.appendChild(header);
    const fields = document.createElement("div");
    fields.style.marginTop = "8px";
    fields.style.fontSize = "13px";
    fields.style.lineHeight = "1.4";
    const bio = profile.bio || settings.bio || "(No Bio Set)";
    const bioEl = document.createElement("div");
    bioEl.textContent = `Bio: ${bio}`;
    fields.appendChild(bioEl);
    const color = settings.color || "(No Color Set)";
    const colorEl = document.createElement("div");
    colorEl.textContent = `Color: ${color}`;
    fields.appendChild(colorEl);
    const email = settings.userEmail || "(No Email Set)";
    const emailEl = document.createElement("div");
    emailEl.textContent = `Email: ${email}`;
    fields.appendChild(emailEl);
    const shownKeys = new Set(["displayName", "pic", "bio", "verified"]);
    const shownSettings = new Set(["color", "userEmail", "displayName", "bio"]);
    const otherEl = document.createElement("div");
    otherEl.style.marginTop = "8px";
    otherEl.textContent = "Other Settings";
    otherEl.style.fontWeight = "600";
    fields.appendChild(otherEl);
    const otherList = document.createElement("div");
    otherList.style.fontSize = "12px";
    otherList.style.marginTop = "6px";
    let foundOther = false;
    for (const k of Object.keys(profile)) {
        if (!shownKeys.has(k)) {
            const item = document.createElement("div");
            item.textContent = `profile/${k}: ${JSON.stringify(profile[k])}`;
            otherList.appendChild(item);
            foundOther = true;
        }
    }
    for (const k of Object.keys(settings)) {
        if (!shownSettings.has(k)) {
            const item = document.createElement("div");
            item.textContent = `settings/${k}: ${JSON.stringify(settings[k])}`;
            otherList.appendChild(item);
            foundOther = true;
        }
    }
    if (!foundOther) {
        const noOther = document.createElement("div");
        noOther.textContent = "No Other Settings";
        noOther.style.opacity = "0.8";
        otherList.appendChild(noOther);
    }
    fields.appendChild(otherList);
    viewer.appendChild(fields);
    const btnArea = document.createElement("div");
    btnArea.style.marginTop = "12px";
    btnArea.style.display = "flex";
    btnArea.style.gap = "8px";
    btnArea.style.alignItems = "center";
    const hasSettingsDisplayName = typeof settings.displayName === "string" && settings.displayName.trim() !== "";
    const missingEmail = !settings.userEmail || settings.userEmail === "";
    const verifyBtn = document.createElement("button");
    verifyBtn.textContent = (hasSettingsDisplayName || missingEmail) ? "Verify" : "Verify";
    verifyBtn.classList = "btn btn-secondary";
    verifyBtn.style.cursor = "pointer";
    verifyBtn.onclick = async () => {
        if (hasSettingsDisplayName || missingEmail) {
            if (!confirm(`User ${displayNameToShow} Appears To Be A Spam Account Verify Anyway?`)) return;
        }
        try {
            await set(ref(db, `users/${uid}/profile/verified`), true);
            showSuccess("User Verified.");
            unverifiedUsers.splice(unverifiedIndex, 1);
            if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
            renderUnverifiedViewer();
        } catch (err) {
            showError("Failed To Verify User: " + err.message);
        }
    };
    btnArea.appendChild(verifyBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList = "btn btn-secondary";
    deleteBtn.onclick = async () => {
        if (!confirm(`Delete User "${uid}" And All Their Data?`)) return;
        try {
            await deleteEntireUser(uid);
            unverifiedUsers.splice(unverifiedIndex, 1);
            if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
            renderUnverifiedViewer();
        } catch (err) {
            showError("Failed To Delete User: " + err.message);
        }
    };
    btnArea.appendChild(deleteBtn);
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.classList = "btn btn-secondary";
    nextBtn.style.cursor = "pointer";
    nextBtn.onclick = showNextUnverified;
    btnArea.appendChild(nextBtn);
    if (hasSettingsDisplayName || missingEmail) {
        const extraDelete = document.createElement("button");
        extraDelete.textContent = "Delete User";
        extraDelete.classList = "btn btn-secondary";
        extraDelete.style.cursor = "pointer";
        extraDelete.onclick = async () => {
            if (!confirm(`Delete User "${uid}" And All Their Data?`)) return;
            try {
                await deleteEntireUser(uid);
                unverifiedUsers.splice(unverifiedIndex, 1);
                if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
                renderUnverifiedViewer();
            } catch (err) {
                showError("Delete Failed: " + err.message);
            }
        };
        btnArea.appendChild(extraDelete);
    }
    viewer.appendChild(btnArea);
}
if (deleteTypingBtn) {
    deleteTypingBtn.onclick = async () => {
        if (!confirm("Delete Typing Users?")) return;
        try {
            await remove(ref(db, "typing"));
            showSuccess("Done");
        } catch (err) {
            showError("Failed To Delete: " + err.message);
        }
    };
}
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showError("You Must Be Logged In To View This Page.");
        window.location.href = "InfiniteChatters.html";
        return;
    }
    const uid = user.uid;
    const ownerRef = ref(db, `users/${uid}/profile/isOwner`);
    const testerRef = ref(db, `users/${uid}/profile/isTester`);
    const coOwnerRef = ref(db, `users/${uid}/profile/isCoOwner`);
    const ownerSnap = await get(ownerRef);
    const testerSnap = await get(testerRef);
    const coOwnerSnap = await get(coOwnerRef);
    let isOwner = ownerSnap.exists() && ownerSnap.val() === true;
    let isCoOwner = coOwnerSnap.exists() && coOwnerSnap.val() === true;
    let isTester = testerSnap.exists() && testerSnap.val() === true;
    if (!isOwner && !isCoOwner && !isTester) {
        showError("Access Denied. You Are Not An Approved User.");
        window.location.href = "InfiniteChatters.html";
        return;
    }
    if (isCoOwner && !isOwner && !isTester) {
        userListDiv.style.display = "none";
        userEditDiv.style.display = "none";
        privateChatsDiv.style.display = "none";
        chatView.style.display = "none";
        sendAsSelect.style.display = "none";
        sendAdminMessageBtn.style.display = "none";
        adminMsgInput.style.display = "none";
        deleteChatBtn.style.display = "none";
        listenForTyping();
        return;
    }
    await loadUserList();
    await loadPrivateChats();
    listenForTyping();
    await refreshUnverifiedUsers();
    const usersRefRealtime = ref(db, "users");
    onValue(usersRefRealtime, (snap) => {
        refreshUnverifiedUsers();
    }, (err) => {
        console.warn("Realtime Watcher Failed:", err);
    });
});
function populateSendAsOptions() {
    if (!sendAsSelect) return;
    sendAsSelect.innerHTML = "";
    const adminOption = document.createElement("option");
    adminOption.value = "jiEcu7wSifMalQxVupmQXRchA9k1";
    adminOption.textContent = "Hacker41";
    sendAsSelect.appendChild(adminOption);
    for (const uid of Object.keys(userProfiles)) {
        const profile = userProfiles[uid];
        const opt = document.createElement("option");
        opt.value = uid;
        opt.textContent = profile.displayName || uid;
        sendAsSelect.appendChild(opt);
    }
}
async function loadPrivateChats() {
    privateChatsDiv.innerHTML = "Loading Messages";
    const privateRef = ref(db, "private");
    const snapshot = await get(privateRef);
    if (!snapshot.exists()) {
        privateChatsDiv.innerHTML = "No Messages Found.";
        return;
    }
    const data = snapshot.val();
    privateChatsDiv.innerHTML = "";
    Object.entries(data).forEach(([uid, chatPartners]) => {
        const userDisplay = userProfiles[uid]?.displayName || uid;
        const userDiv = document.createElement("div");
        userDiv.innerHTML = `<strong>${userDisplay}</strong>`;
        privateChatsDiv.appendChild(userDiv);
        Object.keys(chatPartners).forEach(secondUid => {
            const partnerName = userProfiles[secondUid]?.displayName || secondUid;
            const div = document.createElement("div");
            div.className = "user-item";
            div.textContent = `Chat Between ${userDisplay} & ${partnerName}`;
            div.onclick = () => viewPrivateChat(uid, secondUid, userDisplay, partnerName);
            privateChatsDiv.appendChild(div);
        });
    });
}
async function viewPrivateChat(uid, secondUid, userDisplay, partnerDisplay) {
    currentChatPath = `private/${uid}/${secondUid}`;
    privateChatsDiv.style.display = "none";
    chatView.style.display = "block";
    chatTitle.textContent = `Private Chat: ${userDisplay} & ${partnerDisplay}`;
    chatMessages.innerHTML = "Loading...";
    populateSendAsOptions();
    const chatRef = ref(db, currentChatPath);
    onValue(chatRef, async snapshot => {
        if (!snapshot.exists()) {
            chatMessages.innerHTML = "<p>No Messages Found.</p>";
            return;
        }
        const messages = snapshot.val();
        chatMessages.innerHTML = "";
        const entries = Object.entries(messages).sort((a, b) => {
            const aTime = a[1]?.timestamp || 0;
            const bTime = b[1]?.timestamp || 0;
            return aTime - bTime;
        });
        for (const [msgId, msgData] of entries) {
            const senderUid = msgData.sender || uid;
            if (!userProfiles[senderUid] && senderUid !== "jiEcu7wSifMalQxVupmQXRchA9k1") {
                const userSnap = await get(ref(db, `users/${senderUid}/profile`));
                const profile = userSnap.exists() ? userSnap.val() : {};
                userProfiles[senderUid] = {
                    displayName: profile.displayName || "Unknown",
                    pic: profile.pic || ""
                };
                populateSendAsOptions();
            }
            const senderProfile = userProfiles[senderUid] || { displayName: (senderUid === "jiEcu7wSifMalQxVupmQXRchA9k1" ? "Hacker41" : senderUid), pic: "" };
            let picNum = parseInt(senderProfile.pic);
            if (isNaN(picNum) || picNum <= 0 || picNum > profilePics.length) {
                picNum = 0;
            }
            const senderPic = profilePics[Math.max(0, picNum - 0)];
            const senderName = (senderUid === "jiEcu7wSifMalQxVupmQXRchA9k1") ? "Hacker41" : (senderProfile.displayName || "Unknown");
            const color = await get(ref(db, `users/${senderUid}/settings/color`));
            const nameColor = color.exists() ? color.val() : "white";
            let timestamp = "";
            if (msgData.timestamp) {
                const d = new Date(msgData.timestamp);
                const month = (d.getMonth() + 1).toString().padStart(2, "0");
                const day = d.getDate().toString().padStart(2, "0");
                const year = d.getFullYear();
                let hours = d.getHours();
                const minutes = d.getMinutes().toString().padStart(2, "0");
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12;
                timestamp = `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
            }
            const isPartner = senderUid === secondUid;
            const isAdmin = senderUid === "jiEcu7wSifMalQxVupmQXRchA9k1";
            const msgDiv = document.createElement("div");
            msgDiv.className = "msg";
            msgDiv.style.flexDirection = "row";
            msgDiv.style.background = isPartner ? "#1e1e1e" : "#2b2b2b";
            const content = document.createElement("div");
            content.className = "msg-content";
            content.style.textAlign = "left";
            const header = document.createElement("div");
        	header.className = "msg-header";
          	header.innerHTML = `<img style="height:40px;width:40px;border-radius:50%;border:1px solid white;" src="${senderPic}" alt="${senderName}'s Pic"><span style="font-size:1.5em; margin-left:10px; color:${nameColor};width:100%;">${senderName}</span><span style="width:100%; text-align:right;">${timestamp}</span>`;
          	header.style.display = "flex";
          	const text = document.createElement("div");
          	text.className = "msg-text";
          	text.style.marginLeft = "50px";
          	text.style.marginTop = "-10px";
          	text.textContent = msgData.text || "(No Text)";
          	const deleteBtn = document.createElement("button");
          	deleteBtn.textContent = "Delete";
          	deleteBtn.className = "deleteBtn";
          	deleteBtn.style.marginTop = "6px";
          	deleteBtn.onclick = async () => {
            	try {
              		await remove(ref(db, `${currentChatPath}/${msgId}`));
            	} catch (err) {
              		showError("Delete Failed: " + err.message);
            	}
          	};
          	content.appendChild(header);
          	content.appendChild(text);
          	if (msgData.edited) {
            	const edited = document.createElement("div");
            	edited.className = "edited-label";
            	edited.style.marginLeft = "50px";
            	edited.textContent = "(Edited)";
            	edited.style.color = "gray";
            	edited.style.fontSize = "0.7em";
            	content.appendChild(edited);
          	}
          	content.appendChild(deleteBtn);
          	msgDiv.appendChild(content);
          	chatMessages.appendChild(msgDiv);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (err) => {
        console.error("Realtime Listener Error:", err);
        chatMessages.innerHTML = "<p>Error Loading Messages.</p>";
    });
}
deleteChatBtn.onclick = async () => {
    if (!currentChatPath) return;
    if (!confirm("Delete This Entire Private Chat And Metadata?")) return;
    const parts = currentChatPath.split("/");
    const uid = parts[1];
    const secondUid = parts[2];
    try {
        await remove(ref(db, `private/${uid}/${secondUid}`));
        await remove(ref(db, `metadata/${uid}/privateChats/${secondUid}`));
        await remove(ref(db, `metadata/${secondUid}/privateChats/${uid}`));
        showSuccess("Chat And Metadata Deleted.");
        chatView.style.display = "none";
        privateChatsDiv.style.display = "block";
        loadPrivateChats();
    } catch (err) {
        showError("Error Deleting Chat: " + err.message);
    }
};
backButton.onclick = () => {
    chatView.style.display = "none";
    privateChatsDiv.style.display = "block";
};
async function loadUserList() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    const users = snapshot.val();
    const keys = Object.keys(users);
    const userCount = keys.length;
    const userCountH = document.getElementById('userCount');
    userCountH.textContent = `Users: ${userCount}`;
    if (!snapshot.exists()) {
        userListDiv.innerHTML = "No Users Found.";
        return;
    }
	function populateSendAsOptions() {
    	const selected = sendAsSelect.value;
    	sendAsSelect.innerHTML = '';
    	const adminOpt = document.createElement('option');
    	adminOpt.value = 'jiEcu7wSifMalQxVupmQXRchA9k1';
    	adminOpt.textContent = 'Hacker41';
		sendAsSelect.appendChild(adminOpt);
    	const uEntries = Object.entries(userProfiles).sort((a, b) => {
        	const aName = a[1].displayName.toLowerCase();
        	const bName = b[1].displayName.toLowerCase();
        	return aName.localeCompare(bName);
    	});
    	uEntries.forEach(([uid, info]) => {
        	const opt = document.createElement('option');
        	opt.value = uid;
        	opt.textContent = info.displayName || uid;
        	sendAsSelect.appendChild(opt);
    	});
    	if ([...sendAsSelect.options].some(o => o.value === selected)) {
        	sendAsSelect.value = selected;
    	}
	}
	const data = snapshot.val();
	userProfiles = {};
	const sorted = Object.entries(data).sort((a, b) => {
    	const nameA = a[1]?.profile?.displayName?.toLowerCase() || "";
    	const nameB = b[1]?.profile?.displayName?.toLowerCase() || "";
    	return nameA.localeCompare(nameB);
	});
    userListDiv.innerHTML = "";
    sorted.forEach(([uid, info]) => {
        const name = info.profile?.displayName || uid;
        let picNum = parseInt(info.profile?.pic);
        if (isNaN(picNum) || picNum <= 0 || picNum > profilePics.length) {
          	picNum = 0;
        }
        const pic = profilePics[Math.max(0, picNum)];
        const x3FColor = info.settings?.color || "white";
        userProfiles[uid] = { displayName: name, pic: picNum.toString() };
        const div = document.createElement("div");
        div.className = "user-item";
        div.style.color = `${x3FColor}`;
        div.innerHTML = `<img src="${pic}" alt="${name}'s Pic" width="30" height="30" style="border-radius:50%;vertical-align:middle;margin-right:8px;"> ${name}`;
        div.onclick = () => editUser(uid, info);
        userListDiv.appendChild(div);
    });
    populateSendAsOptions();
}
function editUser(uid, data) {
    currentUserEditUID = uid;
    userListDiv.style.display = "none";
    userEditDiv.style.display = "block";
    editTitle.textContent = `Editing User: ${uid}`;
    userDataTextarea.value = JSON.stringify(data, null, 2);
    let delBtn = document.getElementById("deleteUserBtn");
    if (delBtn) delBtn.remove();
    delBtn = document.createElement("button");
    delBtn.id = "deleteUserBtn";
    delBtn.textContent = "Delete User";
    delBtn.style.marginTop = "12px";
    delBtn.style.background = "#7a0000";
    delBtn.style.color = "white";
    delBtn.style.padding = "8px";
    delBtn.style.borderRadius = "6px";
    delBtn.onclick = () => deleteEntireUser(uid);
    userEditDiv.appendChild(delBtn);
}
async function deleteEntireUser(uid) {
    if (!confirm(`Delete User "${uid}" And All Their Data?\nThis Cannot Be Undone.`)) {
    	return;
	}
  	try {
    	const privateRef = ref(db, "private");
    	const privateSnap = await get(privateRef);
    	if (privateSnap.exists()) {
      		const allPrivate = privateSnap.val();
      		for (const userA in allPrivate) {
        		for (const userB in allPrivate[userA]) {
          			if (userA === uid || userB === uid) {
            			await remove(ref(db, `private/${userA}/${userB}`));
          			}
        		}
      		}
    	}
    	await remove(ref(db, `metadata/${uid}/privateChats`));
    	const metadataSnap = await get(ref(db, "metadata"));
    	if (metadataSnap.exists()) {
      		const allMeta = metadataSnap.val();
      		for (const otherUID in allMeta) {
        		if (allMeta[otherUID]?.privateChats?.[uid]) {
          			await remove(ref(db, `metadata/${otherUID}/privateChats/${uid}`));
        		}
      		}
    	}
    	const privateRef2 = ref(db, "private");
    	const privateSnap2 = await get(privateRef2);
    	if (privateSnap2.exists()) {
      		const allPrivate2 = privateSnap2.val();
      		for (const userA in allPrivate2) {
        		for (const userB in allPrivate2[userA]) {
          			const chatPath = `private/${userA}/${userB}`;
          			const msgs = allPrivate2[userA][userB];
          			for (const msgId in msgs) {
            			if (msgs[msgId].sender === uid) {
              				await remove(ref(db, `${chatPath}/${msgId}`));
            			}
          			}
        		}
      		}
    	}
    	const messagesRef = ref(db, "messages");
    	const messagesSnap = await get(messagesRef);
    	if (messagesSnap.exists()) {
      		const allChannels = messagesSnap.val();
      		for (const channelName in allChannels) {
        		const channelMsgs = allChannels[channelName];
       			for (const msgId in channelMsgs) {
          			if (channelMsgs[msgId]?.sender === uid) {
            			await remove(ref(db, `messages/${channelName}/${msgId}`));
          			}
        		}
      		}
    	}
    	await remove(ref(db, `users/${uid}`));
    	showSuccess(`User "${uid}" Deleted Successfully`);
    	userEditDiv.style.display = "none";
    	userListDiv.style.display = "block";
    	loadUserList();
    	loadPrivateChats();
  	} catch (err) {
    	showError("User Delete Failed: " + err.message);
  	}
}
saveUserBtn.onclick = async () => {
    if (!currentUserEditUID) return;
    try {
        const newData = JSON.parse(userDataTextarea.value);
        await set(ref(db, `users/${currentUserEditUID}`), newData);
        showSuccess("User Data Saved!");
        userEditDiv.style.display = "none";
        userListDiv.style.display = "block";
        loadUserList();
    } catch (err) {
        showError("Invalid JSON Or Save Failed: " + err.message);
    }
};
backToListBtn.onclick = () => {
    userEditDiv.style.display = "none";
    userListDiv.style.display = "block";
};
sendAdminMessageBtn.onclick = async () => {
    if (!currentChatPath) {
        showError("Open A Private Chat First.");
        return;
    }
    const text = adminMsgInput.value.trim();
    if (!text) return;
    const sendAs = sendAsSelect.value || "jiEcu7wSifMalQxVupmQXRchA9k1";
    const msgSender = (sendAs === "jiEcu7wSifMalQxVupmQXRchA9k1") ? "jiEcu7wSifMalQxVupmQXRchA9k1" : sendAs;
    const timestamp = Date.now();
    const key = `${timestamp}_${Math.floor(Math.random() * 100000)}`;
    const newMsg = {
        text,
        sender: msgSender,
        timestamp,
        edited: false
    };
    try {
        await set(ref(db, `${currentChatPath}/${key}`), newMsg);
        adminMsgInput.value = "";
    } catch (err) {
        showError("Send Failed: " + err.message);
    }
};
let currentErrorDiv = null;
function showError(message) {
    if (currentErrorDiv) currentErrorDiv.remove();
    const errorDiv = document.createElement("div");
    errorDiv.textContent = message;
    Object.assign(errorDiv.style, {
        position: "fixed",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "salmon",
        color: "black",
        border: "2px solid red",
        borderRadius: "8px",
        padding: "10px 20px",
        zIndex: 9999,
        cursor: "pointer",
        maxWidth: "90%",
        textAlign: "center",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
    });
    errorDiv.addEventListener("click", () => {
        errorDiv.remove();
        currentErrorDiv = null;
    });
    document.body.appendChild(errorDiv);
    currentErrorDiv = errorDiv;
}
let currentSuccessDiv = null;
function showSuccess(message) {
    if (currentSuccessDiv) currentSuccessDiv.remove();
    const successDiv = document.createElement("div");
    successDiv.textContent = message;
    Object.assign(successDiv.style, {
        position: "fixed",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "seagreen",
        color: "black",
        border: "2px solid green",
        borderRadius: "8px",
        padding: "10px 20px",
        zIndex: 9999,
        cursor: "pointer",
        maxWidth: "90%",
        textAlign: "center",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
    });
    successDiv.addEventListener("click", () => {
        successDiv.remove();
        currentSuccessDiv = null;
    });
    document.body.appendChild(successDiv);
    currentSuccessDiv = successDiv;
}