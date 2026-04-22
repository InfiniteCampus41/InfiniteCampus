import { auth, db, onAuthStateChanged, ref, get, set, remove, onValue, signOut, signInWithCustomToken } from "./imports.js";
const privateChatsDiv = document.getElementById("privateChats");
const chatView = document.getElementById("chatView");
const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const deleteChatBtn = document.getElementById("deleteChat");
deleteChatBtn.className = "button";
const BACKEND = `${a}`;
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
const userData = "/users/${uid}";
let userSettings = {};
let activeChatListener = null;
let currentIsOwner = false;
let profilePics = [];
let pfpDomain = "/pfps";
let ADMIN_PASS = localStorage.getItem("a_pass") || null;
if (!(e.includes(window.location.host))) {
    pfpDomain = "https://raw.githubusercontent.com/InfiniteCampus41/InfiniteCampus/refs/heads/main/pfps"; 
}
const imgViewer = document.createElement("div");
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
const viewerImg = document.createElement("img");
viewerImg.style.maxWidth = "90%";
viewerImg.style.maxHeight = "80%";
viewerImg.style.cursor = "zoom-in";
viewerImg.style.transition = "transform 0.2s";
const downloadBtn = document.createElement("a");
downloadBtn.textContent = "Download Image";
downloadBtn.style.marginTop = "15px";
downloadBtn.style.color = "white";
downloadBtn.style.textDecoration = "underline";
downloadBtn.style.cursor = "pointer";
imgViewer.appendChild(viewerImg);
imgViewer.appendChild(downloadBtn);
document.body.appendChild(imgViewer);
let zoomed = false;
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
                if (data && data.ok) {
                    return true;
                }
            } catch (e) {}
            localStorage.removeItem("a_pass");
            ADMIN_PASS = null;
        }
        const entered = await customPrompt("Enter Admin Password:", true);
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
            if (data && data.ok) {
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
async function loadProfilePics() {
    try {
        const res = await fetch(`${pfpDomain}/index.json?${Date.now()}`);
        const files = await res.json();
        profilePics = files.map(f => `${pfpDomain}/${f}?t=${Date.now()}`);
        console.log("Loaded Profile Pics:", profilePics);
    } catch (err) {
        console.error("Failed To Load Profile Pics:", err);
        profilePics = [`${pfpDomain}/1.jpeg?t=${Date.now()}`];
    }
}
async function preloadUsers() {
    const snap = await get(ref(db, "users"));
    if (!snap.exists()) return;
    const data = snap.val();
    for (const uid in data) {
        userProfiles[uid] = {
            displayName: data[uid]?.profile?.displayName || uid,
            pic: data[uid]?.profile?.pic || "",
            color: data[uid]?.settings?.color || "white"
        };
    }
}
async function logMutedUsers() {
    try {
        const [mutedSnap, usersSnap] = await Promise.all([
            get(ref(db, "mutedUsers")),
            get(ref(db, "users"))
        ]);
        if (!mutedSnap.exists()) {
            if (muteSection) muteSection.textContent = "";
            return;
        }
        const mutedData = mutedSnap.val();
        const usersData = usersSnap.exists() ? usersSnap.val() : {};
        muteSection.innerHTML = "";
        muteSection.textContent = "Muted Users";
        for (const uid of Object.keys(mutedData)) {
            const userData = usersData[uid] || {};
            const picVal = userData.profile?.pic || "0";
            const nameVal = userData.profile?.displayName || "User";
            const colorVal = userData.settings?.color || "white";
            const emailVal = userData.settings?.userEmail || "No Email";
            const userDiv = document.createElement('div');
            let picIndex = parseInt(picVal);
            let picSrc = profilePics[picIndex] || profilePics[0];
            userDiv.innerHTML = `
                <img src="${picSrc}" style="height:30px;width:30px;border-radius:50%;">
                <span style="color:${colorVal};margin-left:10px;">${nameVal}</span>
                <div style="font-size:12px;color:gray;">${emailVal}</div>
            `;
            const unmuteBtn = document.createElement("button");
            unmuteBtn.textContent = "Unmute";
            unmuteBtn.onclick = () => remove(ref(db, `mutedUsers/${uid}`));
            userDiv.appendChild(unmuteBtn);
            muteSection.appendChild(userDiv);
        }

    } catch (err) {
        console.error(err);
    }
}
logMutedUsers();
const deleteTypingBtn = document.getElementById("deleteTypingBtn");
if (deleteTypingBtn) deleteTypingBtn.style.display = "block";
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
        deleteTypingBtn.style.display = "block";
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
function updateTypingUI(snapshot) {
    if (!typingListDiv) return;
    const typingVal = snapshot.exists() ? snapshot.val() : null;
    typingListDiv.innerHTML = "";
    if (!typingVal) {
        typingListDiv.textContent = "No Typing Data";
        return;
    }
    for (const channel in typingVal) {
        for (const uid in typingVal[channel]) {
            const user = userProfiles[uid] || {};
            const name = user.displayName || uid;
            const color = user.color || "white";
            const pic = profilePics[user.pic] || profilePics[0];
            const div = document.createElement("div");
            div.innerHTML = `
                <img src="${pic}" style="height:30px;width:30px;border-radius:50%;">
                <span style="color:${color}">${name}</span>
                typing in #${channel}
            `;
            typingListDiv.appendChild(div);
        }
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
function listenForUnverifiedUsers() {
    onValue(ref(db, "users"), snap => {
        if (!snap.exists()) return;
        const all = snap.val();
        unverifiedUsers = [];
        for (const [uid, data] of Object.entries(all)) {
            if (!data?.profile?.verified) {
                unverifiedUsers.push({ uid, data });
            }
        }
        renderUnverifiedViewer();
    });
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
    const shownKeys = new Set(["displayName", "pic", "bio", "verified", "votes"]);
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
            showConfirm(`User ${displayNameToShow} Appears To Be A Spam Account Verify Anyway?`, function(result) {
                if (result) {
                    try {
                        set(ref(db, `users/${uid}/profile/verified`), true);
                        showSuccess("User Verified.");
                        unverifiedUsers.splice(unverifiedIndex, 1);
                        if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
                        renderUnverifiedViewer();
                    } catch (err) {
                        showError("Failed To Verify User: " + err.message);
                    }
                } else {
                    showSuccess("Canceled");
                }
            })
        } else {
            try {
                await set(ref(db, `users/${uid}/profile/verified`), true);
                showSuccess("User Verified");
                unverifiedUsers.splice(unverifiedIndex, 1);
                if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
                renderUnverifiedViewer();
            } catch (err) {
                showError("Failed To Verify User: " + err.message);
            }
        }
    };
    btnArea.appendChild(verifyBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList = "btn btn-secondary";
    deleteBtn.onclick = async () => {
        showConfirm(`Delete User "${uid}" And All Their Data?`, function(result) {
            if (result) {
                try {
                    deleteEntireUser(uid);
                    unverifiedUsers.splice(unverifiedIndex, 1);
                    if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
                    renderUnverifiedViewer();
                } catch (err) {
                    showError("Delete Failed: " + err.message);
                }  
            } else {
                showSuccess("Canceled");
            }
        })
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
            if (
                showConfirm(`Delete User "${uid}" And All Their Data?`, function(result) {
                    if (result) {
                        try {
                            deleteEntireUser(uid);
                            unverifiedUsers.splice(unverifiedIndex, 1);
                            if (unverifiedIndex >= unverifiedUsers.length) unverifiedIndex = 0;
                            renderUnverifiedViewer();
                        } catch (err) {
                            showError("Delete Failed: " + err.message);
                        }  
                    } else {
                        showSuccess("Canceled");
                    }
                })
            ) return;
        };
        btnArea.appendChild(extraDelete);
    }
    viewer.appendChild(btnArea);
}
if (deleteTypingBtn) {
    deleteTypingBtn.onclick = async () => {
        showConfirm("Delete Typing Data?", function(result) {
            if (result) {
                try {
                    remove(ref(db, "typing"));
                    showSuccess("Done");
                } catch (err) {
                    showError("Failed To Delete: " + err.message);
                }            
            } else {
                showSuccess("Canceled");
            }
        });
    };
}
onAuthStateChanged(auth, async (user) => {
    await loadProfilePics();
    if (!user) {
        showError("You Must Be Logged In To View This Page.");
        return;
    }
    const uid = user.uid;
    const ownerRef = ref(db, `users/${uid}/profile/isOwner`);
    const testerRef = ref(db, `users/${uid}/profile/isTester`);
    const coOwnerRef = ref(db, `users/${uid}/profile/isCoOwner`);
    const hAdminRef = ref(db, `users/${uid}/profile/isHAdmin`);
    const devRef = ref(db, `users/${uid}/profile/isDev`);
    const ownerSnap = await get(ownerRef);
    const testerSnap = await get(testerRef);
    const coOwnerSnap = await get(coOwnerRef);
    const hAdminSnap = await get(hAdminRef);
    const devSnap = await get(devRef);
    let isOwner = ownerSnap.exists() && ownerSnap.val() === true;
    currentIsOwner = isOwner;
    let isCoOwner = coOwnerSnap.exists() && coOwnerSnap.val() === true;
    let isTester = testerSnap.exists() && testerSnap.val() === true;
    let isHAdmin = hAdminSnap.exists() && hAdminSnap.val() === true;
    let isDev = devSnap.exists() && devSnap.val() === true; 
    if (!isOwner && !isCoOwner && !isTester && !isHAdmin && !isDev) {
        showError("Access Denied. You Are Not An Approved User.");
        window.location.href = "InfiniteChatters.html";
        return;
    }
    if (isCoOwner || isHAdmin && !isOwner && !isTester) {
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
    await preloadUsers();
    await preloadUserMeta();
    listenForTyping();
    listenForUnverifiedUsers();
    await loadUserList();
    await loadPrivateChats();
    const usersRefRealtime = ref(db, "users");
    get(usersRefRealtime).then(() => listenForUnverifiedUsers());
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
let userMetaCache = {};
async function preloadUserMeta() {
    const snap = await get(ref(db, "users"));
    if (!snap.exists()) return;
    const data = snap.val();
    for (const uid in data) {
        userMetaCache[uid] = {
            profile: data[uid].profile || {},
            settings: data[uid].settings || {}
        };
    }
}
async function loadPrivateChats() {
    privateChatsDiv.innerHTML = "Loading...";
    const snap = await get(ref(db, "private"));
    if (!snap.exists()) {
        privateChatsDiv.innerHTML = "No Messages";
        return;
    }
    const data = snap.val();
    privateChatsDiv.innerHTML = "";
    for (const uid in data) {
        const name = userProfiles[uid]?.displayName || uid;
        for (const partner in data[uid]) {
            const partnerName = userProfiles[partner]?.displayName || partner;
            const div = document.createElement("div");
            div.className = "user-item";
            div.textContent = `Chat Between ${name} & ${partnerName}`;
            div.onclick = () => viewPrivateChat(uid, partner);
            privateChatsDiv.appendChild(div);
        }
    }
}
async function viewPrivateChat(uid, secondUid, userDisplay, partnerDisplay) {
    currentChatPath = `private/${uid}/${secondUid}`;
    privateChatsDiv.style.display = "none";
    chatView.style.display = "block";
    chatTitle.textContent = `Private Chat: ${userDisplay} & ${partnerDisplay}`;
    chatMessages.innerHTML = "Loading...";
    populateSendAsOptions();
    const chatRef = ref(db, currentChatPath);
    onValue(chatRef, (snapshot) => {
        if (!snapshot.exists()) {
            chatMessages.innerHTML = "<p>No Messages Found.</p>";
            return;
        }
        const messages = snapshot.val();
        chatMessages.innerHTML = "";
        const entries = Object.entries(messages).sort((a, b) => {
            return (a[1]?.timestamp || 0) - (b[1]?.timestamp || 0);
        });
        for (const [msgId, msgData] of entries) {
            const senderUid = msgData.sender || uid;
            const meta = userMetaCache[senderUid] || {};
            const profile = meta.profile || {};
            const settings = meta.settings || {};
            if (!userProfiles[senderUid]) {
                userProfiles[senderUid] = {
                    displayName: profile.displayName || "Unknown",
                    pic: profile.pic || ""
                };
                populateSendAsOptions();
            }
            const senderProfile = userProfiles[senderUid];
            let picNum = parseInt(senderProfile.pic);
            if (isNaN(picNum) || picNum <= 0 || picNum > profilePics.length) {
                picNum = 0;
            }
            const senderPic = profilePics[picNum];
            const senderName = (senderUid === "jiEcu7wSifMalQxVupmQXRchA9k1")
                ? "Hacker41"
                : (senderProfile.displayName || "Unknown");
            const nameColor = settings.color || "white";
            let badgeText = null;
            const senderIsOwner = profile.isOwner === true;
            const senderIsTester = profile.isTester === true;
            const senderIsCoOwner = profile.isCoOwner === true;
            const senderIsHAdmin = profile.isHAdmin === true;
            const senderIsAdmin = profile.isAdmin === true;
            const senderIsSus = profile.isSus === true;
            if (senderIsSus) badgeText = "Sus";
            else if (senderIsOwner) badgeText = "OWNR";
            else if (senderIsTester) badgeText = "TSTR";
            else if (senderIsCoOwner) badgeText = "COWNR";
            else if (senderIsHAdmin) badgeText = "HADMIN";
            else if (senderIsAdmin) badgeText = "ADMN";
            const badgeContainer = document.createElement("span");
            badgeContainer.style.marginLeft = "3px";
            badgeContainer.style.fontWeight = "bold";
            badgeContainer.style.display = "inline-flex";
            badgeContainer.style.alignItems = "center";
            badgeContainer.style.gap = "3px";
            const mutedBadge = document.createElement("span");
            mutedBadge.style.color = "red";
            mutedBadge.style.fontWeight = "bold";
            mutedBadge.style.display = "none";
            mutedBadge.title = "This User Is Muted";
            mutedBadge.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
            const mutedRef = ref(db, `mutedUsers/${senderUid}`);
            onValue(mutedRef, async (snap) => {
                if (!snap.exists()) {
                    mutedBadge.style.display = "none";
                    return;
                }
                const data = snap.val();
                if (data.expires === "Never") {
                    mutedBadge.style.display = "inline";
                    return;
                }
                if (data.expires && Date.now() > data.expires) {
                    await remove(mutedRef);
                    mutedBadge.style.display = "none";
                    return;
                }
                mutedBadge.style.display = "inline";
            });
            let dontShowOthers = false;
            if (badgeText === "Sus") {
                dontShowOthers = true;
                badgeContainer.innerHTML = '<i class="bi bi-shield-exclamation"></i>';
                badgeContainer.style.color = 'red';
                badgeContainer.title = 'This User Is Currently Under Investigation';
            } else if (badgeText === "OWNR") {
                badgeContainer.innerHTML = '<i class="bi bi-shield-plus"></i>';
                badgeContainer.style.color = "lime";
            } else if (badgeText === "TSTR") {
                badgeContainer.innerHTML = '<i class="fa-solid fa-cogs"></i>';
                badgeContainer.style.color = "DarkGoldenRod";
            } else if (badgeText === "COWNR") {
                badgeContainer.innerHTML = '<i class="bi bi-shield-fill"></i>';
                badgeContainer.style.color = "lightblue";
            } else if (badgeText === "HADMIN") {
                badgeContainer.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
                badgeContainer.style.color = "#00cc99";
            } else if (badgeText === "ADMN") {
                badgeContainer.innerHTML = '<i class="bi bi-shield"></i>';
                badgeContainer.style.color = "dodgerblue";
            }
            if (profile.isDev) {
                const i = document.createElement("i");
                i.className = "bi bi-code-square";
                i.style.color = "green";
                badgeContainer.appendChild(i);
            }
            if (profile.premuim3) badgeContainer.innerHTML += '<i class="bi bi-hearts" style="color:red"></i>';
            if (profile.premium2) badgeContainer.innerHTML += '<i class="bi bi-heart-fill" style="color:orange"></i>';
            if (profile.premium1) badgeContainer.innerHTML += '<i class="bi bi-heart-half" style="color:yellow"></i>';
            if (profile.isDonater) badgeContainer.innerHTML += '<i class="bi bi-balloon-heart" style="color:#00E5FF"></i>';
            if (profile.isPartner) badgeContainer.innerHTML += '<i class="fa fa-handshake" style="color:cornflowerblue"></i>';
            if (profile.isUploader) badgeContainer.innerHTML += '<i class="bi bi-film" style="color:grey"></i>';
            if (profile.mileStone) badgeContainer.innerHTML += '<i class="bi bi-award" style="color:yellow"></i>';
            if (profile.isGuesser) badgeContainer.innerHTML += '<i class="bi bi-stopwatch" style="color:red"></i>';
            if (profile.dUsername && profile.dUsername.trim() !== "") {
                badgeContainer.innerHTML += '<i class="bi bi-discord" style="color:#5865F2"></i>';
            }
            badgeContainer.appendChild(mutedBadge);
            let timestamp = "";
            if (msgData.timestamp) {
                timestamp = new Date(msgData.timestamp).toLocaleString();
            }
            const msgDiv = document.createElement("div");
            msgDiv.className = "msg";
            const content = document.createElement("div");
            const header = document.createElement("div");
            header.innerHTML = `
                <img src="${senderPic}" style="height:40px;width:40px;border-radius:50%">
                <span style="margin-left:10px;color:${nameColor};font-size:1.5em;">
                    ${senderName}
                </span>
            `;
            const timeSpan = document.createElement("span");
            timeSpan.textContent = timestamp;
            timeSpan.style.marginLeft = "auto";
            header.appendChild(badgeContainer);
            header.appendChild(timeSpan);
            const text = document.createElement("div");
            text.innerHTML = (msgData.text || "").replace(/\n/g, "<br>");
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => remove(ref(db, `${currentChatPath}/${msgId}`));
            content.appendChild(header);
            content.appendChild(text);
            content.appendChild(deleteBtn);
            msgDiv.appendChild(content);
            chatMessages.appendChild(msgDiv);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (err) => {
        console.error(err);
    });
}
deleteChatBtn.onclick = async () => {
    if (!currentChatPath) return;
    if (
        showConfirm("Delete This Entire Private Chat And Metadata?", function(result) {
            if (result) {
                const parts = currentChatPath.split("/");
                const uid = parts[1];
                const secondUid = parts[2];
                try {
                    remove(ref(db, `private/${uid}/${secondUid}`));
                    remove(ref(db, `private/${secondUid}/${uid}`));
                    remove(ref(db, `metadata/${uid}/privateChats/${secondUid}`));
                    remove(ref(db, `metadata/${secondUid}/privateChats/${uid}`));
                    showSuccess("Chat And Metadata Deleted.");
                    chatView.style.display = "none";
                    privateChatsDiv.style.display = "block";
                    loadPrivateChats();
                } catch (err) {
                    showError("Error Deleting Chat: " + err.message);
                }            
            } else {
                showSuccess("Canceled");
            }
        })
    ) return;
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
        div.innerHTML = `
            <img src="${pic}" alt="${name}'s Pic" width="30" height="30" style="border-radius:50%;vertical-align:middle;margin-right:8px;">
            ${name}
        `;
        div.onclick = () => editUser(uid, info);
        userListDiv.appendChild(div);
    });
    populateSendAsOptions();
}
function editUser(uid, data) {
    currentUserEditUID = uid;
    userListDiv.style.display = "none";
    userEditDiv.style.display = "block";
    editTitle.textContent = `User Actions: ${uid}`;
    userDataTextarea.style.display = "none";
    saveUserBtn.style.display = "none";
    userEditDiv.querySelectorAll(".action-btn").forEach(el => el.remove());
    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.flexDirection = "column";
    btnContainer.style.marginTop = "12px";
    btnContainer.style.gap = "10px";
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit User Data";
    editBtn.className = "button action-btn";
    editBtn.onclick = () => {
        userDataTextarea.style.display = "block";
        saveUserBtn.style.display = "block";
        userDataTextarea.value = JSON.stringify(data, null, 2);
        btnContainer.style.display = "none";
    };
    backToListBtn.onclick = () => {
        if (userDataTextarea.style.display === "block") {
            userDataTextarea.style.display = "none";
            saveUserBtn.style.display = "none";
            btnContainer.style.display = "flex";
        } else {
            userEditDiv.style.display = "none";
            userListDiv.style.display = "block";
        }
    };
    btnContainer.appendChild(editBtn);
    if (currentIsOwner) {
        const loginBtn = document.createElement("button");
        loginBtn.textContent = "Login As User";
        loginBtn.className = "button action-btn";
        loginBtn.onclick = async () => {
            try {
                const idToken = await auth.currentUser.getIdToken();
                verifyAdminPassword().then(async (isValid) => {
                    if (!isValid) {
                        showError("Invalid Admin Password");
                        return;
                    } else {
                        const res = await adminFetch(BACKEND + "/createCustomToken", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + idToken
                            },
                            body: JSON.stringify({ targetUid: uid })
                        });
                        const result = await res.json();
                        if (!result.token) {
                            showError("Failed: " + JSON.stringify(result));
                            return;
                        }
                        await signOut(auth);
                        await signInWithCustomToken(auth, result.token);
                        await adminFetch(BACKEND + "/tokenUsed", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ uid })
                        });
                        showSuccess("Switched Account");
                        window.location.href = "/InfiniteChatters.html";
                    }
                });
            } catch (err) {
                console.error(err);
                showError("Error Occurred");
            }
        };
        btnContainer.appendChild(loginBtn);
    }
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete User";
    deleteBtn.className = "button action-btn";
    deleteBtn.style.background = "#7a0000";
    deleteBtn.style.color = "white";
    deleteBtn.onclick = () => {
        showConfirm(`Delete User "${uid}" And All Their Data?`, function(result) {
            if (result) {
                deleteEntireUser(uid);
                userEditDiv.style.display = "none";
                userListDiv.style.display = "block";
                loadUserList();
            } else {
                showSuccess("Canceled");
            }
        });
    };
    btnContainer.appendChild(deleteBtn);
    userEditDiv.appendChild(btnContainer);
}
async function deleteEntireUser(uid) {
    const [privateSnap, metadataSnap, messagesSnap] = await Promise.all([
        get(ref(db, "private")),
        get(ref(db, "metadata")),
        get(ref(db, "messages"))
    ]);
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
    if (metadataSnap.exists()) {
        const allMeta = metadataSnap.val();
        for (const otherUID in allMeta) {
            if (allMeta[otherUID]?.privateChats?.[uid]) {
                await remove(ref(db, `metadata/${otherUID}/privateChats/${uid}`));
            }
        }
    }
    if (messagesSnap.exists()) {
        const allChannels = messagesSnap.val();
        for (const channel in allChannels) {
            for (const msgId in allChannels[channel]) {
                if (allChannels[channel][msgId]?.sender === uid) {
                    await remove(ref(db, `messages/${channel}/${msgId}`));
                }
            }
        }
    }
    await remove(ref(db, `users/${uid}`));
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