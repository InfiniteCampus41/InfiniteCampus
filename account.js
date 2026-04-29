import { messaging, getToken, auth, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile, sendEmailVerification, applyActionCode, confirmPasswordReset } from './imports.js';
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const oobCode = urlParams.get('oobCode');
const continueUrl = urlParams.get('continueUrl') || "/InfiniteAccounts.html";
const uid = urlParams.get("user");
const notif = urlParams.get("notif");
const settingsPage = document.getElementById('settingsPage');
const profileView = document.getElementById('profileView');
const authcontainer = document.getElementById('authContainer');
const enableNotifBtn = document.getElementById('enableNotifBtn');
let pfpDomain = "/pfps";
if (!(e.includes(window.location.host))) {
    pfpDomain = "https://raw.githubusercontent.com/InfiniteCampus41/InfiniteCampus/refs/heads/main/pfps"; 
}
try {
    if (Notification) {
        if (Notification.permission === "granted") {
            enableNotifBtn.style.setProperty("display", "none", "important");
        }
    }   
} catch {
    console.error("Notification System Error")
}
let profileImages = [];
async function loadProfileImages() {
    try {
        const res = await fetch(`${pfpDomain}/index.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const files = await res.json();
        return files.map(f => `${pfpDomain}/` + f);
    } catch (e) {
        console.error("Failed To Load Profile Images:", e);
        return [`${pfpDomain}/1.jpeg`];
    }
}
let currentUser = null;
let authReady = false;
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
function dbListen(path, callback) {
    const isIosSafari = /iphone|ipad|ipod/i.test(navigator.userAgent);
    let reconnectTimer = null;
    function connect() {
        return getAuthToken().then(token => {
            const pathArray = pathToArray(path);
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
            };
            ws.onclose = () => {
                if (isIosSafari) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => connect(), 3000);
                }
            };
            return ws;
        });
    }
    return connect();
}
if (notif) {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    async function enableNotifications() {
        if (!("Notification" in window)) {
            showError("Your Browser Does Not Support Notifications.");
            return;
        }
        if (!("serviceWorker" in navigator)) {
            showError("Your Browser Does Not Support Service Workers Required For Notifications.");
            return;
        }
        if (isIos && !isInStandaloneMode) {
            showError("To Enable Notifications On iPhone Or iPad, Please Add This App To Your Home Screen First, Then Try Again.");
            return;
        }
        try {
            const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                const token = await getToken(messaging, {
                    vapidKey: "BFzJJQnddg7dRJlByA9q76_jhw5XHgSydywvChgLXI6a6jSUimHA3vhMLRS0VtBRMWl_EfZx6BSvNVtTdVbXhOg",
                    serviceWorkerRegistration: registration
                });
                const user = auth.currentUser;
                if (user) {
                    dbSet("pushTokens/" + user.uid + "/" + token, true);
                    showSuccess("Notifications Have Been Enabled");
                } else {
                    window.location.href = 'InfiniteLogins.html';
                    return;
                }
                window.location.href = 'InfiniteAccounts.html';
            } else {
                showError("Notification Permission Was Denied.");
            }
        } catch (err) {
            showError("Failed To Enable Notifications: " + err.message);
        }
    }
    if (enableNotifBtn) {
        enableNotifBtn.style.removeProperty("display");
        enableNotifBtn.addEventListener("click", enableNotifications);
    } else {
        if (!isIos) {
            enableNotifications();
        }
    }
} else if (mode) {
    authcontainer.style.display = 'block';
    settingsPage.style.display = 'none';
    const resetPasswordContainer = document.getElementById('resetPasswordContainer');
    const verifyEmailContainer = document.getElementById('verifyEmailContainer');
    async function handleResetPassword(newPassword) {
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            showSuccess("Password Has Been Reset!");
            window.location.href = continueUrl;
        } catch (error) {
            showError("Error: " + error.message);
        }
    }
    async function handleVerifyEmail() {
        try {
            await applyActionCode(auth, oobCode);
            showSuccess("Email Verification Successful!");
            window.location.href = continueUrl;
        } catch (error) {
            showError("Error: " + error.message);
        }
    }
    if (mode === "resetPassword") {
        resetPasswordContainer.style.display = "block";
        document.getElementById('resetPasswordBtn').addEventListener('click', () => {
            const newPassword = document.getElementById('newPasswordInput').value.trim();
            const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();
            if (!newPassword) return showError("Password Is Required.");
            if (newPassword.length < 8) return showError("Password Must Be At Least 8 Characters.");
            if (!confirmPassword) return showError("Please Confirm Your Password.");
            if (newPassword !== confirmPassword) return showError("Passwords Do Not Match.");
            handleResetPassword(newPassword);
        });
    } else if (mode === "verifyEmail") {
        verifyEmailContainer.style.display = "block";
        document.getElementById('verifyEmailBtn2').addEventListener('click', handleVerifyEmail);
    } else {
        showError("Unknown Mode:", mode);
        verifyEmailContainer.style.display = "block";
        document.getElementById('verifyEmailBtn2').addEventListener('click', handleVerifyEmail);
    }
    document.addEventListener("click", (e) => {
        if (!e.target.classList.contains("revealBtn")) return;
        const input = document.getElementById(e.target.dataset.target);
        if (!input) return;
        if (input.type === "password") {
            input.type = "text";
            e.target.textContent = "Hide";
        } else {
            input.type = "password";
            e.target.textContent = "Show";
        }
    });
} else if (uid) {
    settingsPage.style.display = 'none';
    profileView.style.display = 'block';
    const style = document.createElement("style");
    style.innerHTML = `
        body {
            font-family: sans-serif;
        }
        .displayName {
            font-size:1.6em;
            font-weight:bold;
            margin-bottom:8px;
        }
        img {
            transition:0.3s all;
        }
        .bio {
            margin-bottom:12px;
            color:#ccc;
            white-space:pre-wrap;
        }
        .bio::before {
            content: "Bio: ";
        }
        .uid {
            font-size:0.9em;
            color:#777;
            margin-top:10px;
        }
        .error {
            color:red;
            font-weight:bold;
        }
    `;
    let currentUser = null;
    document.head.appendChild(style);
    const displayNameEl = document.getElementById("displayName");
    const bioEl = document.getElementById("bio");
    const uidEl = document.getElementById("uid");
    const loadingEl = document.getElementById("loading");
    const profileContent = document.getElementById("profileContent");
    const errorEl = document.getElementById("error");
    const messageBtn = document.getElementById("messageUserBtn");
    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get("user");
    function createBadge(profile, isVerified, dUsername) {
        const badgeContainer = document.createElement("span");
        badgeContainer.style.display = "flex";
        badgeContainer.style.alignItems = "center";
        badgeContainer.style.gap = "6px";
        badgeContainer.style.marginLeft = "6px";
        const roles = [
            { key: "isSus", icon: "bi bi-shield-exclamation", title: "This User Is Currently Under Investigation, Please Do Not Interact With This User", color: "red" },
            { key: "isOwner", icon: "bi bi-shield-plus", title: "Owner", color: "lime" },
            { key: "isTester", icon: "fa-solid fa-cogs", title: "Tester", color: "DarkGoldenRod" },
            { key: "isCoOwner", icon: "bi bi-shield-fill", title: "Co-Owner", color: "lightblue" },
            { key: "isHAdmin", icon: "fa-solid fa-shield-halved", title: "Head Admin", color: "#00cc99" },
            { key: "isAdmin", icon: "bi bi-shield", title: "Admin", color: "dodgerblue" },
            { key: "isPartner", icon: "fa fa-handshake", title: "This User Is A Partner Of Infinite Campus", color: "cornflowerblue" },
            { key: "isDev", icon: "bi bi-code-square", title: "This User Is A Developer For Infinitecampus.xyz", color: "green" },
            { key: "premium3", icon: "bi bi-hearts", title: "This User Has Infinite Campus Premium T3", color: "red" },
            { key: "premium2", icon: "bi bi-heart-fill", title: "This User Has Infinite Campus Premium T2", color: "orange" },
            { key: "premium1", icon: "bi bi-heart-half", title: "This User Has Infinite Campus Premium T1", color: "yellow" },
            { key: "isDonater", icon: "bi bi-balloon-heart", title: "This User Has Donated To Infinite Campus", color: "#00E5FF"},
            { key: "isUploader", icon: "bi bi-film", title: "This User Has Uploaded A Movie To Infinite Campus", color: "grey"},
            { key: "mileStone", icon: "bi bi-award", title: "This User Is The 100th Signed Up User", color: "yellow" },
            { key: "isGuesser", icon: "bi bi-stopwatch", title: "This User Has A Lot Of Freetime", color: "#FF0000" },
            { key: "isLink", icon: "bi bi-link", title: "This Use Has Shared Lots Of Links In The Links Channel", color: "#4fa3ff"},
            { key: "secure", icon: "bi ic ic-securely", title: "This User Has Securely At School", color: "dodgerblue"},
            { key: "guardian", icon: "bi ic ic-goguardian", title: "This User Has GoGuardian At School", color: "grey"},
            { key: "lanschool", icon: "bi ic ic-lanschool", title: "This User Has Lanschool At School", color: "greenyellow"},
            { key: "linewize", icon: "bi ic ic-linewize", title: "This User Has Linewize At School", color: "lightskyblue"},
            { key: "blocksi", icon: "bi ic ic-blocksi", title: "This User Has Blocksi At School", color: "cadetblue"}
        ];
        roles.forEach(r => {
            if (profile?.[r.key] === true) {
                const badge = document.createElement("i");
                badge.className = `${r.icon}`;
                badge.title = r.title;
                badge.style.color = r.color;
                badge.style.fontSize = "1.1em";
                badgeContainer.appendChild(badge);
            }
        });
        if (dUsername && dUsername.trim() !== "") {
            const discordBadge = document.createElement("i");
            discordBadge.className = "bi bi-discord";
            discordBadge.title = `Known As @${dUsername} On The Infinite Campus Discord Server`;
            discordBadge.style.color = "#5865F2";
            badgeContainer.appendChild(discordBadge);
        }
        if (isVerified === true) {
            const verified = document.createElement("i");
            verified.className = "bi bi-shield-check";
            verified.title = "Verified User";
            verified.style.color = "white";
            verified.style.fontSize = "1.1em";
            badgeContainer.appendChild(verified);
        }
        return badgeContainer;
    }
    if (!uid) {
      	showError("Invalid URL");
    } else {
      	loadUserProfile(uid);
    }
    async function loadUserProfile(uid) {
        await authReadyPromise;
        try {
            const userSnap = await fetchAPI("read", { path: ["users", uid] });
            if (!userSnap?.data) {
                showError(`User With ID "${uid}" Not Found.`);
                return;
            }
            const foundUser = userSnap.data;
            const user = currentUser;
            let viewerIsOwner = false;
            try {
                if (currentUser) {
                    const me = await fetchAPI("read", {
                        path: ["users", currentUser.uid, "profile"]
                    });
                    const p = me?.data;
                    if (p?.isOwner || p?.isCoOwner || p?.isHAdmin || p?.isDev) {
                        viewerIsOwner = true;
                    }
                }
            } catch {}
            const color = foundUser.settings?.color || "#ffffff";
            const displayNameRaw = foundUser.profile?.displayName;
            const displayName = displayNameRaw?.trim() ? displayNameRaw : "Spam Account";
            const bio = foundUser.profile?.bio || "No Bio Set.";
            const email = foundUser.settings?.userEmail || "(Hidden)";
            const picValue = foundUser.profile?.pic ?? 0;
            const profileImages = await loadProfileImages();
            const rawSrc = profileImages[picValue] || profileImages[0];
            const imgSrc = rawSrc.split("?")[0] + "?t=" + Date.now();
            loadingEl.style.display = "none";
            errorEl.style.display = "none";
            profileContent.style.display = "block";
            displayNameEl.innerHTML = "";
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.gap = "10px";
            const img = document.createElement("img");
            img.src = imgSrc;
            img.alt = "Profile Icon";
            img.style.width = "60px";
            img.style.height = "60px";
            img.style.marginLeft = "20px";
            img.style.borderRadius = "50%";
            img.style.border = "2px solid white";
            img.style.objectFit = "cover";
            const nameSpan = document.createElement("span");
            nameSpan.textContent = `@${displayName}`;
            nameSpan.style.color = color;
            nameSpan.style.fontSize = "1.2em";
            nameSpan.style.fontWeight = "600";
            container.appendChild(img);
            container.appendChild(nameSpan);
            const isVerified = foundUser.profile?.verified === true;
            const dUsername = foundUser.profile?.dUsername || "";
            const badgeEl = createBadge(foundUser.profile, isVerified, dUsername);
            container.appendChild(badgeEl);
            displayNameEl.appendChild(container);
            bioEl.textContent = bio;
            uidEl.innerHTML = `User ID: ${uid}`;
            if (viewerIsOwner && foundUser.settings?.userEmail) {
                const emailEl = document.createElement("div");
                emailEl.style.marginTop = "5px";
                emailEl.textContent = `Email: ${email}`;
                uidEl.appendChild(emailEl);
            }
            if (messageBtn) {
                messageBtn.style.display = "inline-block";
                messageBtn.onclick = () => {
                    localStorage.setItem("openPrivateChatUid", uid);
                    window.location.href = "InfiniteChatters.html";
                };
            }
        } catch (err) {
            showError("Error Loading Profile: " + err.message);
        }
    }
} else {
    const style = document.createElement("style");
    style.innerHTML = `
        textarea {
            resize: none;
        }
        .card {
            background-color: #111 !important;
            border-color: #222;
        }
        .form-control, .form-control-color {
            background-color: #000;
            border: 1px solid transparent;
        }
        .form-control:disabled {
            background:transparent;
        }
        .form-control:focus {
            background-color: transparent;
            color: #fff;
            border-color: #0d6efd;
            box-shadow: none;
        }
        .list-group-item {
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: none;
        }
        .icon-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .text-center, label {
            color:#777;
            text-align:center;
        }
        .btn {
            border:none;
        }
        .btn:hover {
            color:#888 !important;
        }
        .btn:active {
            border:none;
        }
    `;
    document.head.appendChild(style);
    profileView.style.display = 'none';
    const statusEl = document.getElementById('status');
    const updateDisplayNameBtn = document.getElementById('updateDisplayNameBtn');
    const userIdDisplay = document.getElementById('userIdDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const adminBadge = document.getElementById('adminBadge');
    const localStorageList = document.getElementById('localStorageList');
    const nameColorInput = document.getElementById("nameColorInput");
    const saveNameColorBtn = document.getElementById("saveNameColorBtn");
    const resetPasswordBtnAcc = document.getElementById("resetPasswordBtnAcc");
    const logoutBtn = document.getElementById("logoutBtn");
    let currentUser = null;
    const displayNameInput = document.getElementById("displayNameInput");
    const editDisplayBtn = document.getElementById("editDisplayBtn");
    const saveDisplayBtn = document.getElementById("saveDisplayBtn");
    const cancelDisplayBtn = document.getElementById("cancelDisplayBtn");
    const displayCharCount = document.getElementById("displayCharCount");
    const panelPic = document.getElementById('pfp');
    panelPic.src = `${pfpDomain}/1.jpeg?t=${Date.now()}`;
    panelPic.style.height = '100px';
    panelPic.style.width = '100px';
    panelPic.style.border = '1px solid white';
    panelPic.style.borderRadius = '50%';
    let selectedFile = null;
    let removeRequested = false;
    let currentServerPicUrl = null;
    const pfpWrapper = document.createElement("div");
    pfpWrapper.style.position = "relative";
    pfpWrapper.style.height = "fit-content";
    pfpWrapper.style.display = "inline-block";
    panelPic.parentNode.insertBefore(pfpWrapper, panelPic);
    pfpWrapper.appendChild(panelPic);
    const hoverOverlay = document.createElement("div");
    hoverOverlay.style.position = "absolute";
    hoverOverlay.style.top = "0";
    hoverOverlay.style.left = "0";
    hoverOverlay.style.width = "100px";
    hoverOverlay.style.height = "100px";
    hoverOverlay.style.borderRadius = "50%";
    hoverOverlay.style.background = "rgba(111,111,111,0.6)";
    hoverOverlay.style.display = "flex";
    hoverOverlay.style.alignItems = "center";
    hoverOverlay.style.justifyContent = "center";
    hoverOverlay.style.opacity = "0";
    hoverOverlay.style.cursor = "pointer";
    hoverOverlay.style.transition = "0.2s";
    hoverOverlay.innerHTML = `<i class="bi bi-pencil-fill" style="color:white;font-size:24px;"></i>`;
    pfpWrapper.appendChild(hoverOverlay);
    pfpWrapper.addEventListener("mouseenter", () => {
        hoverOverlay.style.opacity = "1";
    });
    pfpWrapper.addEventListener("mouseleave", () => {
        hoverOverlay.style.opacity = "0";
    });
    const pfpModalBg = document.createElement("div");
    pfpModalBg.style.position = "fixed";
    pfpModalBg.style.top = "0";
    pfpModalBg.style.left = "0";
    pfpModalBg.style.width = "100%";
    pfpModalBg.style.height = "100%";
    pfpModalBg.style.background = "rgba(0,0,0,0.8)";
    pfpModalBg.style.display = "none";
    pfpModalBg.style.alignItems = "center";
    pfpModalBg.style.justifyContent = "center";
    pfpModalBg.style.zIndex = "9999";
    document.body.appendChild(pfpModalBg);
    const pfpModal = document.createElement("div");
    pfpModal.style.background = "#111";
    pfpModal.style.padding = "30px";
    pfpModal.style.borderRadius = "10px";
    pfpModal.style.textAlign = "center";
    pfpModal.style.width = "300px";
    pfpModalBg.appendChild(pfpModal);
    const previewImg = document.createElement("img");
    previewImg.style.width = "120px";
    previewImg.style.height = "120px";
    previewImg.style.borderRadius = "50%";
    previewImg.style.objectFit = "cover";
    previewImg.style.marginBottom = "20px";
    pfpModal.appendChild(previewImg);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    pfpModal.appendChild(fileInput);
    const uploadBtn = document.createElement("button");
    uploadBtn.className = "btn btn-primary";
    uploadBtn.textContent = "Upload";
    uploadBtn.style.display = "block";
    uploadBtn.style.margin = "10px auto";
    pfpModal.appendChild(uploadBtn);
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "Remove";
    removeBtn.style.display = "block";
    removeBtn.style.margin = "10px auto";
    pfpModal.appendChild(removeBtn);
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-success";
    saveBtn.textContent = "Save Changes";
    saveBtn.style.display = "block";
    saveBtn.style.margin = "20px auto 0";
    pfpModal.appendChild(saveBtn);
    hoverOverlay.addEventListener("click", () => {
        previewImg.src = panelPic.src;
        selectedFile = null;
        removeRequested = false;
        pfpModalBg.style.display = "flex";
    });
    pfpModalBg.addEventListener("click", (e) => {
        if (e.target === pfpModalBg) {
            pfpModalBg.style.display = "none";
        }
    });
    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        selectedFile = file;
        removeRequested = false;
        const reader = new FileReader();
        reader.onload = () => {
            previewImg.src = reader.result;
        };
        reader.readAsDataURL(file);
    };
    removeBtn.onclick = () => {
        selectedFile = null;
        removeRequested = true;
        previewImg.src = `${pfpDomain}/1.jpeg?t=${Date.now()}`;
    };
    saveBtn.onclick = async () => {
        if (!currentUser) return;
        try {
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("uid", currentUser.uid);
                const token = getAuthToken();
                if (token) headers["Authorization"] = "Bearer " + token;
                pfpModalBg.style.display = "none";
                showSuccess("Uploading...");
                const res = await fetch(`${a}/upload-pfp`, {
                    method: "POST",
                    body: formData,
                    Authorization: `Bearer ${token}` 
                });
                const data = await res.json();
                if (!data.success) {
                    showError("Upload Failed");
                    return;
                }
                const newUrl = `${pfpDomain}/` + data.file;
                panelPic.src = newUrl + "?t=" + Date.now();
                currentServerPicUrl = newUrl;
                showSuccess("Profile Picture Updated!");
            }
            if (removeRequested) {
                await dbSet(`users/${currentUser.uid}/profile/pic`, 0);
                panelPic.src = `${pfpDomain}/1.jpeg?t=${Date.now()}`;
                showSuccess("Profile Picture Removed!");
            }
            pfpModalBg.style.display = "none";
        } catch (err) {
            console.error(err);
            showError("Failed To Save Picture");
        }
    };
    const userpanel = document.getElementById('userpanel');
    const params = new URLSearchParams(window.location.search);
    const chaturl = params.get("chat");
    const donUrl = params.get("donate");
    const pollUrl = params.get("poll");
    const donBtn = document.getElementById('donBtn');
    const adminBtn = document.getElementById('adminBtn');
    const chatBtn = document.getElementById('chatBtn');
    const pollBtn = document.getElementById('pollBtn');
    if (donUrl) {
        donBtn.style.display = 'block';
    }
    if (chaturl) {
        chatBtn.style.display = 'block';
    }
    if (pollUrl) {
        pollBtn.style.display = 'block';
    }
    let currentDisplay = "";
    window.appSettings = {
        nameColor: "#ffffff",
        bio: "No Bio Set",
        displayName: "User",
        pic: `${pfpDomain}/1.jpeg?t=${Date.now()}`
    };
    function setSetting(key, value) {
        window.appSettings[key] = value;
        window[key] = value;
    }
    window.appReady = new Promise(resolve => {
        window.__appResolve = resolve;
    });
    function autoResizeDisplay() {
        displayNameInput.style.height = "auto";
        displayNameInput.style.height = displayNameInput.scrollHeight + "px";
    }
    async function loadDisplayName(uid) {
        const displayRef = `users/${uid}/profile/displayName`;
        const snap = await dbGet(displayRef);
        if (snap != null) {
            currentDisplay = snap || "";
            displayNameInput.value = currentDisplay;
            setSetting("displayName", currentDisplay);
        } else {
            displayNameInput.value = "";
            displayNameInput.placeholder = "Enter Display Name Here";
        }
        displayCharCount.textContent = `${displayNameInput.value.length} / 20`;
        autoResizeDisplay();
    }
    function enableDisplayEditing() {
        displayNameInput.disabled = false;
        editDisplayBtn.style.display = "none";
        saveDisplayBtn.style.display = "inline";
        cancelDisplayBtn.style.display = "inline";
        displayNameInput.focus();
    }
    function disableDisplayEditing(resetValue = false) {
        if (resetValue) displayNameInput.value = currentDisplay || "";
        displayNameInput.disabled = true;
        editDisplayBtn.style.display = "inline";
        saveDisplayBtn.style.display = "none";
        cancelDisplayBtn.style.display = "none";
        autoResizeDisplay();
    }
    async function saveDisplayName() {
        if (!currentUser) return;
        const newDisplay = displayNameInput.value.trim();
        if (!/^[a-zA-Z0-9 _-]*$/.test(newDisplay)) {
            return showError("Display Name Can Only Contain Letters, Numbers, Spaces, Underscores, And Dashes.");
        }
        const usersSnap = await dbGet('users');
        if (usersSnap) {
            let taken = false;
            for (const uid in usersSnap) {
                const p = usersSnap[uid]?.profile;
                if (p?.displayName === newDisplay) {
                    taken = true;
                    break;
                }
            }
            if (taken) return showError("Display Name Already Taken.");
        }
        if (newDisplay.length === 0) return showError("Display Name Cannot Be Empty.");
        if (newDisplay.length > 20) return showError("Display Name Cannot Exceed 20 Characters.");
        await dbSet(`users/${currentUser.uid}/profile/displayName`, newDisplay);
        setSetting("displayName", newDisplay);
        await updateProfile(currentUser, { displayName: newDisplay });
        currentDisplay = newDisplay;
        disableDisplayEditing();
        showSuccess("Display Name Saved!");
    }
    editDisplayBtn.addEventListener("click", enableDisplayEditing);
    saveDisplayBtn.addEventListener("click", saveDisplayName);
    cancelDisplayBtn.addEventListener("click", () => disableDisplayEditing(true));
    displayNameInput.addEventListener("input", () => {
        displayNameInput.value = displayNameInput.value.replace(/[^a-zA-Z0-9 _-]/g, "");
        autoResizeDisplay();
        if (displayNameInput.value.length > 20) {
            displayNameInput.value = displayNameInput.value.slice(0, 20);
        }
        displayCharCount.textContent = `${displayNameInput.value.length} / 20`;
    });
    displayNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveDisplayName();
        }
    });
    async function loadSettings(uid) {
        const userSettingsRef = `users/${uid}/settings`;
        const settings = (await dbGet(userSettingsRef)) || {};
        let storedColor = settings.color || localStorage.getItem("color") || "#ffffff";
        const rgb = hexToRgb(storedColor);
        if (colorDistance(rgb, darkGray) < darkThreshold) {
            storedColor = lightGray;
            await dbSet(`users/${uid}/settings/color`, storedColor);
        }
        nameColorInput.value = storedColor;
        localStorage.setItem("color", storedColor);
        setSetting("nameColor", storedColor);
        dbListen(`users/${uid}/settings/color`, (color) => {
            if (!color) return;
            nameColorInput.value = color;
            localStorage.setItem("color", color);
            setSetting("nameColor", color);
        });
        userpanel.style.display = 'flex';
        statusEl.textContent = ``;
    }
    async function setDisplayNameEverywhere(user, name) {
        await dbUpdate(`users/${user.uid}/profile`, { displayName: name });
        await updateProfile(user, { displayName: name });
    }
    async function updateDisplayName() {
        if (!currentUser) return;
        const newName = displayNameInput.value.trim();
        if (!newName) return showError("Display Name Cannot Be Empty.");
        if (newName.length > 20) return showError("Display Name Cannot Exceed 20 Characters.");
        if (!/^[a-zA-Z0-9 _-]+$/.test(newName)) return showError("Invalid Display Name.");
        const usersSnap = await dbGet('users');
        if (usersSnap) {
            let taken = false;
            for (const uid in usersSnap) {
                const p = usersSnap[uid]?.profile;
                if (p?.displayName === newName) {
                    taken = true;
                    break;
                }
            }
            if (taken) return showError("Display Name Already Taken.");
        }
        await setDisplayNameEverywhere(currentUser, newName);
        showSuccess("Display Name Updated!");
    }
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return [num >> 16, (num >> 8) & 255, num & 255];
    }
    function colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1[0] - c2[0], 2) +
            Math.pow(c1[1] - c2[1], 2) +
            Math.pow(c1[2] - c2[2], 2)
        );
    }
    const darkThreshold = 100;
    const darkGray = hexToRgb("#121212");
    const lightGray = "#555752";
    saveNameColorBtn.addEventListener("click", async () => {
        if (!currentUser) return;
        let color = nameColorInput.value || "#ffffff";
        const rgb = hexToRgb(color);
        if (colorDistance(rgb, darkGray) < darkThreshold) {
            color = lightGray;
            nameColorInput.value = lightGray;
            showError("Color Too Dark! Changed To Light Grey.");
        }
        await dbSet(`users/${currentUser.uid}/settings/color`, color);
        localStorage.setItem("color", color);
        setSetting("nameColor", color);
        showSuccess("Name Color Saved!");
    });
    const bioInput = document.getElementById("bioInput");
    const editBioBtn = document.getElementById("editBioBtn");
    const saveBioBtn = document.getElementById("saveBioBtn");
    const cancelBioBtn = document.getElementById("cancelBioBtn");
    const bioCharCount = document.getElementById("bioCharCount");
    let currentBio = "";
    function autoResizeBio() {
        bioInput.style.height = "auto";
        bioInput.style.height = "52px";
    }
    async function loadUserBio(uid) {
        const bioRef = `users/${uid}/profile/bio`;
        const snap = await dbGet(bioRef);
        if (snap != null) {
            currentBio = snap || "";
            setSetting("bio", currentBio);
            bioInput.value = currentBio;
            bioInput.style.color = "white";
            autoResizeBio();
        } else {
            bioInput.value = "";
            bioInput.placeholder = "Enter Bio Here";
        }
        bioCharCount.textContent = `${bioInput.value.length} / 50`;
    }
    function enableBioEditing() {
        bioInput.disabled = false;
        editBioBtn.style.display = "none";
        saveBioBtn.style.display = "inline";
        cancelBioBtn.style.display = "inline";
        bioInput.focus();
    }
    function disableBioEditing(resetValue = false) {
        if (resetValue) bioInput.value = currentBio || "";
        bioInput.disabled = true;
        bioInput.style.color = "white";
        editBioBtn.style.display = "inline";
        saveBioBtn.style.display = "none";
        cancelBioBtn.style.display = "none";
        autoResizeBio();
    }
    async function saveUserBio() {
        if (!currentUser) return;
        const newBio = bioInput.value.trim();
        if (newBio.length > 50) return showError("Bio Cannot Exceed 50 Characters.");
        await dbSet(`users/${currentUser.uid}/profile/bio`, newBio);
        currentBio = newBio;
        disableBioEditing();
        setSetting("bio", newBio);
        showSuccess("Bio Saved!");
    }
    editBioBtn.addEventListener("click", enableBioEditing);
    saveBioBtn.addEventListener("click", saveUserBio);
    cancelBioBtn.addEventListener("click", () => disableBioEditing(true));
    bioInput.addEventListener("input", () => {
        autoResizeBio();
        if (bioInput.value.length > 50) {
            bioInput.value = bioInput.value.slice(0, 50);
        }
        bioCharCount.textContent = `${bioInput.value.length} / 50`;
    });
    const disInput = document.getElementById("disInput");
    const editDisBtn = document.getElementById("editDisBtn");
    const saveDisBtn = document.getElementById("saveDisBtn");
    const cancelDisBtn = document.getElementById("cancelDisBtn");
    let currentDis = "";
    function autoResizeDis() {
        disInput.style.height = "auto";
        disInput.style.height = disInput.scrollHeight + "px";
    }
    async function loadUserDis(uid) {
        const disRef = `users/${uid}/profile/dUsername`;
        const snap = await dbGet(disRef);
        if (snap != null) {
            currentDis = snap || "";
            setSetting("dUsername", currentDis);
            disInput.value = currentDis;
            disInput.style.color = "white";
        } else {
            disInput.value = "";
            disInput.placeholder = "Enter Discord Username Here";
        }
        autoResizeDis();
    }
    function enableDisEditing() {
        disInput.disabled = false;
        editDisBtn.style.display = "none";
        saveDisBtn.style.display = "inline";
        cancelDisBtn.style.display = "inline";
        disInput.focus();
    }
    function disableDisEditing(resetValue = false) {
        if (resetValue) disInput.value = currentDis || "";
        disInput.disabled = true;
        disInput.style.color = "white";
        editDisBtn.style.display = "inline";
        saveDisBtn.style.display = "none";
        cancelDisBtn.style.display = "none";
        autoResizeDis();
    }
    async function saveUserDis() {
        if (!currentUser) return;
        const newDis = disInput.value.trim();
        if (!newDis) return showError("Discord Username Cannot Be Empty.");
        if (newDis.length > 50) return showError("Discord Username Cannot Exceed 50 Characters.");
        try {
            const res = await fetch(`${a}/discordVerify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: newDis,
                    uid: currentUser.uid
                })
            });
            const data = await res.json();
            if (!data.success) {
                if (data.message === "Not In Server") {
                    return showError("You Are Not In The Discord Server.");
                }
                return showError(data.error || "Verification Failed.");
            }
            showSuccess("A Verification Code Was Sent To Your Discord DMs.");
            const code = prompt("Enter The 6 Digit Code Sent To Your Discord:");
            if (!code) {
                await fetch(`${a}/discordVerifyCancel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: currentUser.uid })
                });
                return showError("Verification Cancelled.");
            }
            const confirmRes = await fetch(`${a}/discordVerifyConfirm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: currentUser.uid,
                    code: code.trim()
                })
            });
            const confirmData = await confirmRes.json();
            if (confirmData.success) {
                currentDis = newDis;
                disableDisEditing();
                setSetting("dUsername", newDis);
                showSuccess("Discord Account Verified!");
            } else {
                showError(confirmData.error || "Invalid Code.");
            }
        } catch (err) {
            console.error(err);
            showError("Failed To Verify Discord Username.");
        }
    }
    editDisBtn.addEventListener("click", enableDisEditing);
    saveDisBtn.addEventListener("click", saveUserDis);
    cancelDisBtn.addEventListener("click", () => disableDisEditing(true));
    disInput.addEventListener("input", () => {
        autoResizeDis();
        if (disInput.value.length > 50) {
            disInput.value = disInput.value.slice(0, 50);
        }
    });
    const extCheckboxes = document.querySelectorAll(".extCheck");
    extCheckboxes.forEach(cb => {
        cb.addEventListener("change", async () => {
            if (!currentUser) return;
            extCheckboxes.forEach(other => {
                if (other !== cb) other.checked = false;
            });
            const updates = {};
            updates[cb.dataset.key] = cb.checked ? true : null;
            await dbUpdate(`users/${currentUser.uid}/profile`, updates);
            showSuccess("Extension Updated!");
        });
    });
    resetPasswordBtnAcc.addEventListener("click", async () => {
        const email = currentUser?.email;
        if (!email) return showError("No Email Found. Please Log In Again.");
        try {
            await sendPasswordResetEmail(auth, email);
            showSuccess("Password Reset Email Sent To " + email);
        } catch (e) {
            showError("Failed To Send Reset Email: " + e.message);
        }
    });
    logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        localStorage.clear();
        location.href = "InfiniteLogins.html";
    });
    const verifyEmailBtn = document.getElementById("verifyEmailBtn");
    verifyEmailBtn.addEventListener("click", async () => {
        if (!currentUser) return showError("No User Logged In.");
        try {
            await sendEmailVerification(currentUser);
            showSuccess("Verification Email Sent To " + currentUser.email + ". Please Check Your Inbox.");
        } catch (err) {
            console.error(err);
            showError("Failed To Send Verification Email: " + err.message);
        }
    });
    async function loadUserProfilePic(uid) {
        try {
            const snap = await dbGet(`users/${uid}/profile/pic`);
            let picIndex = 0;
            if (snap != null) {
                picIndex = snap;
            }
            if (!profileImages || profileImages.length === 0) {
                profileImages = await loadProfileImages();
            }
            const baseUrl = profileImages[picIndex] || profileImages[0] || `${pfpDomain}/1.jpeg`;
            const cleanBase = baseUrl.split("?")[0];
            panelPic.src = cleanBase + "?t=" + Date.now();
            setSetting("pic", cleanBase);
        } catch (err) {
            console.error("Failed To Load Profile Picture:", err);
            panelPic.src = `${pfpDomain}/1.jpeg?t=${Date.now()}`;
        }
    }
    function loadExtensionCheckbox(profile) {
        extCheckboxes.forEach(cb => {
            cb.checked = profile?.[cb.dataset.key] === true;
        });
    }
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            userIdDisplay.textContent = user.uid;
            userEmailDisplay.textContent = user.email;
            let verifiedDisplay = document.getElementById("verifiedDisplay");
            if (!verifiedDisplay) {
                verifiedDisplay = document.createElement("div");
                verifiedDisplay.id = "verifiedDisplay";
                verifiedDisplay.style.marginTop = "5px";
                verifiedDisplay.style.fontWeight = "bold";
                userEmailDisplay.insertAdjacentElement("afterend", verifiedDisplay);
            }
            if (user.emailVerified) {
                userEmailDisplay.style.color = "limegreen";
                verifyEmailBtn.style.setProperty("display", "none", "important");
            } else {
                userEmailDisplay.style.color = "yellow";
                verifyEmailBtn.style.display = "inline";
                verifyEmailBtn.style.border = "1px solid white";
                verifyEmailBtn.style.borderRadius = "5px";
            }
            await loadSettings(user.uid);
            await loadDisplayName(user.uid);
            await loadUserBio(user.uid);
            await loadUserDis(user.uid);
            profileImages = await loadProfileImages();
            await loadUserProfilePic(user.uid);
            dbListen(`users/${user.uid}/profile`, (profile) => {
                if (!profile) return;
                loadExtensionCheckbox(profile);
                const badges = document.getElementById('badges');
                badges.innerHTML = "";
                function addBadge(name, color, icon) {
                    const badge = document.createElement("span");
                    const badgeContainer = document.getElementById('badgeContainer');
                    badgeContainer.style.display = 'flex';
                    badgeContainer.style.flexDirection = 'column';
                    badge.style.color = color;
                    badge.style.fontSize = '1.5em';
                    badge.style.fontWeight = "600";
                    badge.innerHTML = `
                        <i class="${icon}" style="margin-right:6px;" title="${name}"></i>
                    `;
                    badges.appendChild(badge);
                }
                let hasAnyRole = false;
                if (profile.isSus) {
                    addBadge("This User Is Currently Under Investigation, Please Do Not Interact With This User", "red", "bi bi-shield-exclamation");
                    hasAnyRole = true;
                }
                if (profile.isOwner) {
                    addBadge("Owner", "lime", "bi bi-shield-plus");
                    adminBtn.style.display = 'block';
                    hasAnyRole = true;
                }
                if (profile.isTester) {
                    addBadge("Tester", "DarkGoldenRod", "fa-solid fa-cogs");
                    adminBtn.style.display = 'block';
                    hasAnyRole = true;
                }
                if (profile.isCoOwner) {
                    addBadge("Co-Owner", "lightblue", "bi bi-shield-fill");
                    adminBtn.style.display = 'block';
                    hasAnyRole = true;
                }
                if (profile.isHAdmin) {
                    addBadge("Head Admin", "#00cc99", "fa-solid fa-shield-halved");
                    adminBtn.style.display = 'block';
                    hasAnyRole = true;
                }
                if (profile.isAdmin) {
                    addBadge("Admin", "dodgerblue", "bi bi-shield");
                    hasAnyRole = true;
                }
                if (profile.isPartner) {
                    addBadge("This User Is A Partner Of Infinite Campus", "cornflowerblue", "fa fa-handshake");
                    hasAnyRole = true;
                }
                if (profile.isDev) {
                    addBadge("This User Is A Developer For Infinitecampus.xyz", "green", "bi bi-code-square");
                    adminBtn.style.display = 'block';
                    hasAnyRole = true;
                }
                if (profile.premium3) {
                    addBadge("This User Has Infinite Campus Premium T3", "red", "bi bi-hearts");
                    hasAnyRole = true;
                }
                if (profile.premium2) {
                    addBadge("This User Has Infinite Campus Premium T2", "orange", "bi bi-heart-fill");
                    hasAnyRole = true;
                }
                if (profile.premium1) {
                    addBadge("This User Has Infinite Campus Premium", "yellow", "bi bi-heart-half");
                    hasAnyRole = true;
                }
                if (profile.isDonater) {
                    addBadge("This User Has Donated To Infinite Campus", "#00E5FF", "bi bi-balloon-heart");
                    hasAnyRole = true;
                }
                if (profile.isUploader) {
                    addBadge("This User Has Uploaded A Movie To Infinite Campus", "grey", "bi bi-film");
                    hasAnyRole = true
                }
                if (profile.mileStone) {
                    addBadge("This User Is The 100th Signed Up User", "yellow", "bi bi-award");
                    hasAnyRole = true;
                }
                if (profile.isGuesser) {
                    addBadge("This User Has A Lot Of Freetime", "#FF0000", "bi bi-stopwatch");
                    hasAnyRole = true;
                }
                if (profile.dUsername) {
                    const discordUser = profile.dUsername;
                    addBadge(`Known As @${discordUser} On Discord`, "#5865F2", "bi bi-discord");
                    hasAnyRole = true;
                }
                if (profile.isLink) {
                    addBadge("This User Has Shared A Lot Of Links In The Links Channel", "#4fa3ff", "bi bi-link");
                    hasAnyRole = true;
                }
                if (profile.secure) {
                    addBadge("This User Has Securely At School", "dodgerblue", "bi ic ic-securely");
                    hasAnyRole = true;
                }
                if (profile.guardian) {
                     addBadge("This User Has GoGuardian At School", "grey", "bi ic ic-goguardian");
                    hasAnyRole = true;
                }
                if (profile.lanschool) {
                    addBadge("This User Has Lanschool At School", "greenyellow", "bi ic ic-lanschool");
                    hasAnyRole = true;
                }
                if (profile.linewize) {
                    addBadge("This User Has Linewize At School", "lightskyblue", "bi ic ic-linewize");
                    hasAnyRole = true;
                }
                if (profile.blocksi) {
                    addBadge("This User Has Blocksi At School", "cadetblue", "bi ic ic-blocksi");
                    hasAnyRole = true;
                }
                if (profile.verified) {
                    addBadge("Verified User", "white", "bi bi-shield-check");
                    hasAnyRole = true;
                }
                if (!hasAnyRole) {
                }
            });
            statusEl.textContent = `Logged In As ${user.email}`;
            const userSettingsRef = `users/${user.uid}/settings`;
            const userSettingsSnap = await dbGet(userSettingsRef);
            let settings = userSettingsSnap || {};
            let storedEmail = settings.userEmail;
            if (!storedEmail) {
                await dbSet(`users/${user.uid}/settings/userEmail`, user.email);
            }
        } else {
            statusEl.textContent = "Not Logged In.";
            setTimeout(() => location.href = "InfiniteLogins.html", 1000);
        }
        if (user) {
            currentUser = user;
            await loadSettings(user.uid);
            await loadDisplayName(user.uid);
            await loadUserBio(user.uid);
            await loadUserDis(user.uid);
            await loadUserProfilePic(user.uid);
            window.__appResolve();
        }
    });
    setInterval(async () => {
        if (currentUser) {
            await currentUser.reload();
            const verifiedDisplay = document.getElementById("verifiedDisplay");
            if (currentUser.emailVerified) {
                verifyEmailBtn.style.display = "none";
                verifyEmailBtn.classList.remove('apbtn');
                if (verifiedDisplay) {
                    userEmailDisplay.style.color = "limegreen";
                    userEmailDisplay.classList.remove('text-info');
                }
            } else {
                verifyEmailBtn.style.display = "inline";
                verifyEmailBtn.style.border = "1px solid white";
                verifyEmailBtn.style.borderRadius = "5px";
                if (verifiedDisplay) {
                    verifiedDisplay.style.color = "white";
                }
            }
        }
    }, 10000);
    appReady.then(() => {
        panelPic.src = pic;
        panelPic.style.borderColor = nameColor;
        displayNameInput.style.color = nameColor;
        displayNameInput.style.fontSize = '2em';
    });
}