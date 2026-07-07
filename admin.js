import { auth, onAuthStateChanged, forceWebSockets, io, getToken, signOut, signInWithCustomToken } from "./imports.js";
const kdsuhPage = window.location.pathname;
const kdsuhParams = new URLSearchParams(window.location.search);
if (kdsuhPage == "/InfiniteAdmins.html") {
    const adminPages = document.getElementById("adminPages");
    const adminChat = document.getElementById("adminChat");
    const adminMovies = document.getElementById("adminMovies");
    const adminRules = document.getElementById("adminRules");
    const adminServer = document.getElementById("adminServer");
    const adminEmail = document.getElementById("adminEmail");
    const adminChatParams = kdsuhParams.get("chat");
    const adminMovieParams = kdsuhParams.get("movies");
    const adminRuleParams = kdsuhParams.get("rules");
    const adminServerParams = kdsuhParams.get("server");
    const adminEmailParams = kdsuhParams.get("email");
    if (adminChatParams) {
        adminChat.style.display = 'block';
        adminPages.style.display = 'none';
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                scrollbar-width: thin;
                scrollbar-color: #555 transparent;
            }
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-track {
                background: transparent !important;
            }
            ::-webkit-scrollbar-thumb {
                background: #555 !important;
                border-radius: 10px;
            }
            textarea, select {
                background: #1b1b1b !important;
                border: 1px solid #444 !important;
                color: #fff !important;
                border-radius: 6px !important;
            }
            ::placeholder {
                color:grey !important;
            }
            @media (max-width: 900px) {
                body {
                    padding-right: 0;
                }
            }
            #adminChat {
                color:white;
            }
        `;
        document.head.appendChild(style);
        const toggleBtn = document.getElementById("rightToggleBtn");
        const rightPanel = document.getElementById("right");
        toggleBtn.onclick = () => {
            if (window.innerWidth <= 900) {
                rightPanel.classList.toggle("open");
                toggleBtn.classList.toggle("open");
                toggleBtn.innerHTML = rightPanel.classList.contains("open") ? "<i class='ic ic-chevron-right'></i>" : "<i class='ic ic-chevron-left'></i>";
            }
        };
        const privateChatsDiv = document.getElementById("privateChats");
        const groupChatsDiv = document.getElementById("groupChats");
        const groupChatView = document.getElementById("groupChatView");
        const groupChatTitle = document.getElementById("groupChatTitle");
        const groupChatMeta = document.getElementById("groupChatMeta");
        const groupChatMessages = document.getElementById("groupChatMessages");
        const groupChatBackButton = document.getElementById("groupChatBackButton");
        const deleteGroupChatBtn = document.getElementById("deleteGroupChatBtn");
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
        function dbListen(path, callback) {
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
                };
                return ws;
            });
        }
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
            const snap = await dbGet("users");
            if (snap !== null && snap !== undefined) return;
            const data = snap;
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
                    dbGet("mutedUsers"),
                    dbGet("users")
                ]);
                if (mutedSnap == null && mutedSnap == undefined) {
                    if (muteSection) muteSection.textContent = "";
                    return;
                }
                const mutedData = mutedSnap;
                const usersData = usersSnap !== null && usersSnap !== undefined ? usersSnap : {};
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
                    unmuteBtn.onclick = () => fetchAPI("delete", { path: pathToArray(`mutedUsers/${uid}`) });
                    userDiv.appendChild(unmuteBtn);
                    muteSection.appendChild(userDiv);
                }
            } catch (err) {
                console.error(err);
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
            const typingVal = snapshot !== null && snapshot !== undefined ? snapshot : null;
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
            if (typingListenerUnsub) {
            }
            dbListen("typing", (data) => {
                updateTypingUI({
                    exists: () => data !== null,
                    val: () => data
                });
            });
        }
        function listenForUnverifiedUsers() {
            dbListen("users", (data) => {
                if (!data) return;
                const all = data;
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
                                dbSet(`users/${uid}/profile/verified`, true);
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
                        await dbSet(`users/${uid}/profile/verified`, true);
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
                            fetchAPI("delete", { path: pathToArray("typing") });
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
            const ownerSnap = await dbGet(`users/${uid}/profile/isOwner`);
            const testerSnap = await dbGet(`users/${uid}/profile/isTester`);
            const coOwnerSnap = await dbGet(`users/${uid}/profile/isCoOwner`);
            const hAdminSnap = await dbGet(`users/${uid}/profile/isHAdmin`);
            const devSnap = await dbGet(`users/${uid}/profile/isDev`);
            let isOwner = ownerSnap !== null && ownerSnap !== undefined && ownerSnap === true;
            currentIsOwner = isOwner;
            let isCoOwner = coOwnerSnap !== null && coOwnerSnap !== undefined && coOwnerSnap === true;
            let isTester = testerSnap !== null && testerSnap !== undefined && testerSnap === true;
            let isHAdmin = hAdminSnap !== null && hAdminSnap !== undefined && hAdminSnap === true;
            let isDev = devSnap !== null && devSnap !== undefined && devSnap === true; 
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
            await loadGroupChats();
            const usersRefRealtime = "users";
            dbGet(usersRefRealtime).then(() => listenForUnverifiedUsers());
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
            const data = await dbGet("users");
            if (data) {
                for (const uid in data) {
                    userMetaCache[uid] = {
                        profile: data[uid].profile || {},
                        settings: data[uid].settings || {}
                    };
                }
            }
        }
        async function loadPrivateChats() {
            privateChatsDiv.innerHTML = "Loading...";
            const data = await dbGet("private");
            if (!data) {
                privateChatsDiv.innerHTML = "No Messages";
                return;
            }
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
        async function loadGroupChats() {
            if (!groupChatsDiv) return;
            groupChatsDiv.innerHTML = "Loading...";
            try {
                const token = await getAuthToken();
                const res = await adminFetch(`${BACKEND}/admin/groups`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed To Load Groups");
                const groups = json.groups || [];
                if (!groups.length) {
                    groupChatsDiv.innerHTML = "No Groups";
                    return;
                }
                groupChatsDiv.innerHTML = "";
                for (const group of groups) {
                    const ownerName = userProfiles[group.ownerUid]?.displayName || group.ownerUid;
                    const div = document.createElement("div");
                    div.className = "user-item";
                    div.textContent = `#${group.id} ${group.name} (Owner: ${ownerName}, ${group.members.length} Members)`;
                    div.onclick = () => viewGroupChat(group.id);
                    groupChatsDiv.appendChild(div);
                }
            } catch (e) {
                groupChatsDiv.innerHTML = "Failed To Load Groups";
            }
        }
        async function viewGroupChat(groupId) {
            groupChatsDiv.style.display = "none";
            privateChatsDiv.style.display = "none";
            groupChatView.style.display = "block";
            groupChatMessages.innerHTML = "Loading...";
            try {
                const token = await getAuthToken();
                const res = await adminFetch(`${BACKEND}/admin/groups/${groupId}`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed To Load Group");
                const group = json.group;
                const ownerName = userProfiles[group.ownerUid]?.displayName || group.ownerUid;
                groupChatTitle.textContent = `Group: ${group.name} (#${group.id})`;
                groupChatMeta.innerHTML = `Owner: ${ownerName}<br>Invite Code: ${group.inviteCode}<br>Members: ${group.members.map(m => userProfiles[m]?.displayName || m).join(", ")}`;
                const entries = Object.entries(group.messages || {}).sort((x, y) => Number(x[1].timestamp || x[0]) - Number(y[1].timestamp || y[0]));
                groupChatMessages.innerHTML = "";
                for (const [id, msg] of entries) {
                    const senderName = msg.system ? "System" : (userProfiles[msg.s]?.displayName || msg.s);
                    const line = document.createElement("div");
                    line.style.padding = "4px 0";
                    line.style.borderBottom = "1px solid #333";
                    const time = new Date(msg.timestamp || Number(id)).toLocaleString();
                    line.innerHTML = `<strong>${senderName}</strong> <span style="color:#888;font-size:0.8em;">${time}</span><br><span style="white-space:pre-wrap;">${(msg.t || "").replace(/</g, "&lt;")}</span>`;
                    groupChatMessages.appendChild(line);
                }
                deleteGroupChatBtn.onclick = () => {
                    showConfirm(`Delete Group "${group.name}"? This Cannot Be Undone.`, async (ok) => {
                        if (!ok) return;
                        try {
                            const delToken = await getAuthToken();
                            const delRes = await fetch(`${BACKEND}/groups/${groupId}`, {
                                method: "DELETE",
                                headers: { "Authorization": "Bearer " + delToken }
                            });
                            if (!delRes.ok) {
                                const err = await delRes.json().catch(() => ({}));
                                throw new Error(err.error || "Delete Failed");
                            }
                            groupChatView.style.display = "none";
                            groupChatsDiv.style.display = "block";
                            privateChatsDiv.style.display = "block";
                            loadGroupChats();
                        } catch (e) {
                            showError(e?.message || "Could Not Delete Group.");
                        }
                    });
                };
            } catch (e) {
                groupChatMessages.innerHTML = "Failed To Load Group";
            }
        }
        if (groupChatBackButton) groupChatBackButton.onclick = () => {
            groupChatView.style.display = "none";
            groupChatsDiv.style.display = "block";
            privateChatsDiv.style.display = "block";
        };
        async function viewPrivateChat(uid, secondUid) {
            const sorted = [uid, secondUid].sort();
            const userDisplayName = userProfiles[uid]?.displayName || uid;
            const partnerDisplayName = userProfiles[secondUid]?.displayName || secondUid;
            currentChatPath = `private/${sorted[0]}`;
            privateChatsDiv.style.display = "none";
            chatView.style.display = "block";
            chatTitle.textContent = `Private Chat: ${userDisplayName} & ${partnerDisplayName}`;
            chatMessages.innerHTML = "Loading...";
            populateSendAsOptions();
            const res = await dbGet(`${currentChatPath}`);
            const rootData = res?.data ?? res;
            const data = rootData?.[secondUid];
                if (!data) {
                    chatMessages.innerHTML = "<p>No Messages Found.</p>";
                    return;
                }
                const messages = data;
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
                    mutedBadge.innerHTML = '<i class="ic ic-volume-mute-fill"></i>';
                    dbListen(`mutedUsers/${senderUid}`, async (data) => {
                        if (!data) {
                            mutedBadge.style.display = "none";
                            return;
                        }
                        if (data.expires === "Never") {
                            mutedBadge.style.display = "inline";
                            return;
                        }
                        if (data.expires && Date.now() > data.expires) {
                            await fetchAPI("delete", { path: pathToArray(`mutedUsers/${senderUid}`) });
                            mutedBadge.style.display = "none";
                            return;
                        }
                        mutedBadge.style.display = "inline";
                    });
                    let dontShowOthers = false;
                    if (badgeText === "Sus") {
                        dontShowOthers = true;
                        badgeContainer.innerHTML = '<i class="ic ic-shield-exclamation"></i>';
                        badgeContainer.style.color = 'red';
                        badgeContainer.title = 'This User Is Currently Under Investigation';
                    } else if (badgeText === "OWNR") {
                        badgeContainer.innerHTML = '<i class="ic ic-shield-plus"></i>';
                        badgeContainer.style.color = "lime";
                    } else if (badgeText === "TSTR") {
                        badgeContainer.innerHTML = '<i class="ic ic-cogs"></i>';
                        badgeContainer.style.color = "DarkGoldenRod";
                    } else if (badgeText === "COWNR") {
                        badgeContainer.innerHTML = '<i class="ic ic-shield-fill"></i>';
                        badgeContainer.style.color = "lightblue";
                    } else if (badgeText === "HADMIN") {
                        badgeContainer.innerHTML = '<i class="ic ic-shield-halved"></i>';
                        badgeContainer.style.color = "#00cc99";
                    } else if (badgeText === "ADMN") {
                        badgeContainer.innerHTML = '<i class="ic ic-shield"></i>';
                        badgeContainer.style.color = "dodgerblue";
                    }
                    if (profile.isDev) {
                        const i = document.createElement("i");
                        i.className = "ic ic-code-square";
                        i.style.color = "green";
                        badgeContainer.appendChild(i);
                    }
                    if (profile.premuim3) badgeContainer.innerHTML += '<i class="ic ic-hearts" style="color:red"></i>';
                    if (profile.premium2) badgeContainer.innerHTML += '<i class="ic ic-heart-fill" style="color:orange"></i>';
                    if (profile.premium1) badgeContainer.innerHTML += '<i class="ic ic-heart-half" style="color:yellow"></i>';
                    if (profile.isDonater) badgeContainer.innerHTML += '<i class="ic ic-balloon-heart" style="color:#00E5FF"></i>';
                    if (profile.isPartner) badgeContainer.innerHTML += '<i class="ic ic-handshake" style="color:cornflowerblue"></i>';
                    if (profile.isUploader) badgeContainer.innerHTML += '<i class="ic ic-film" style="color:grey"></i>';
                    if (profile.mileStone) badgeContainer.innerHTML += '<i class="ic ic-award" style="color:yellow"></i>';
                    if (profile.isGuesser) badgeContainer.innerHTML += '<i class="ic ic-stopwatch" style="color:red"></i>';
                    if (profile.dUsername && profile.dUsername.trim() !== "") {
                        badgeContainer.innerHTML += '<i class="ic ic-discord" style="color:#5865F2"></i>';
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
                    deleteBtn.onclick = () => fetchAPI("delete", { path: pathToArray(`${currentChatPath}/${msgId}`) });
                    content.appendChild(header);
                    content.appendChild(text);
                    content.appendChild(deleteBtn);
                    msgDiv.appendChild(content);
                    chatMessages.appendChild(msgDiv);
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
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
                            fetchAPI("delete", { path: pathToArray(`private/${uid}/${secondUid}`) });
                            fetchAPI("delete", { path: pathToArray(`private/${secondUid}/${uid}`) });
                            fetchAPI("delete", { path: pathToArray(`metadata/${uid}/privateChats/${secondUid}`) });
                            fetchAPI("delete", { path: pathToArray(`metadata/${secondUid}/privateChats/${uid}`) });
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
            const usersRef = "users";
            const snapshot = await dbGet(usersRef);
            const users = snapshot;
            const keys = Object.keys(users);
            const userCount = keys.length;
            const userCountH = document.getElementById('userCount');
            userCountH.textContent = `Users: ${userCount}`;
            if (snapshot == null && snapshot == undefined) {
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
            const data = snapshot;
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
                                const res = await adminFetch(BACKEND + "/admin/createCustomToken", {
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
                dbGet("private"),
                dbGet("metadata"),
                dbGet("messages")
            ]);
            if (privateSnap !== null && privateSnap !== undefined) {
                const allPrivate = privateSnap;
                for (const userA in allPrivate) {
                    for (const userB in allPrivate[userA]) {
                        if (userA === uid || userB === uid) {
                            await fetchAPI("delete", { path: pathToArray(`private/${userA}/${userB}`) });
                        }
                    }
                }
            }
            if (metadataSnap) {
                const allMeta = metadataSnap;
                for (const otherUID in allMeta) {
                    if (allMeta[otherUID]?.privateChats?.[uid]) {
                        await fetchAPI("delete", { path: pathToArray(`metadata/${otherUID}/privateChats/${uid}`) });
                    }
                }
            }
            if (messagesSnap) {
                const allChannels = messagesSnap;
                for (const channel in allChannels) {
                    for (const msgId in allChannels[channel]) {
                        if (allChannels[channel][msgId]?.sender === uid) {
                            await fetchAPI("delete", { path: pathToArray(`messages/${channel}/${msgId}`) });
                        }
                    }
                }
            }
            await fetchAPI("delete", { path: pathToArray(`users/${uid}`) });
        }
        saveUserBtn.onclick = async () => {
            if (!currentUserEditUID) return;
            try {
                const newData = JSON.parse(userDataTextarea.value);
                await dbSet(`users/${currentUserEditUID}`, newData);
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
                await dbSet(`${currentChatPath}/${key}`, newMsg);
                adminMsgInput.value = "";
            } catch (err) {
                showError("Send Failed: " + err.message);
            }
        };
    } else if (adminMovieParams) {
        adminMovies.style.display = 'block';
        adminPages.style.display = 'none';
        forceWebSockets();
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
        const expandEdit = document.getElementById('expandMoviesOrder');
        const editOrderContainer = document.getElementById('editMoviesContainer');
        const progressCache = new Map();
        let isOpen = false;
        const fileElements = new Map();
        expandEdit.addEventListener("click", function () {
            if (isOpen) {
                editOrderContainer.style.right = '-500px';
                expandEdit.style.right = '-2px';
                expandEdit.innerHTML = '<i class="ic ic-chevron-left"></i>';
                isOpen = false;
                editOrderContainer.style.display = 'none';
            } else {
                editOrderContainer.style.right = '-2px';
                expandEdit.style.right = '496px';
                expandEdit.innerHTML = '<i class="ic ic-chevron-right"></i>';
                isOpen = true;
                loadMoviesOrder();
                editOrderContainer.style.display = 'block';
            }
        });
        let BACKEND = `${a}`;
        let ADMIN_PASS = localStorage.getItem("a_pass") || null;
        const socket = io(BACKEND, { 
            path: "/socket_io_realtime_x9a7b2",
            extraHeaders: {
                "ngrok-skip-browser-warning": "true",
                "x-admin-password": ADMIN_PASS || ""
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
        socket.on("connect", () => console.log("Server Connected:", socket.id));
        const progressIntervals = new Map();
        async function checkUserAuthentication() {
            return new Promise((resolve, reject) => {
                onAuthStateChanged(auth, async (user) => {
                    if (!user) {
                        showError('You Must Be Logged In To View This Content.');
                        resolve(false);
                        return;
                    }
                    const uid = user.uid;
                    const userProfileRef = `/users/${uid}/profile`
                    const profile = await dbGet(userProfileRef);
                    if (!profile || !(profile.isOwner || profile.isTester || profile.isCoOwner || profile.isHAdmin || profile.isDev)) {
                        showError('You Do Not Have The Necessary Permissions To View Or Interact With This Content.');
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
        }
        socket.on("jobLog", data => appendLog(data.text));
        socket.on("jobProgress", data => handleJobProgress(data));
        socket.on("jobError", data => handleJobError(data));
        socket.on("jobStarted", data => handleJobStarted(data));
        socket.on("jobDone", data => handleJobDone(data));
        let currentStatus = "";
        let percent = null;
        function find360Version(files, targetFile) {
            const base = targetFile
                .replace("_copy", "")
                .replace("_360", "")
                .replace(/\.[^/.]+$/, "");
            return files.find(f => {
                const compareBase = f.file
                    .replace("_copy", "")
                    .replace("_360", "")
                    .replace(/\.[^/.]+$/, "");
                return compareBase === base && is360File(f.file);
            }) || null;
        }
        async function loadApply() {
            const isAuthenticated = await checkUserAuthentication();
            if (!isAuthenticated) return;
            const box = document.getElementById("applyList");
            const res = await adminFetch(BACKEND + `/api/list_apply_x9a7b2?t=${Date.now()}`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            });
            const data = await res.json();
            const applyDataRaw = data.apply || {};
            const applyData = Array.isArray(applyDataRaw)
                ? applyDataRaw
                : Object.entries(applyDataRaw).map(([file, val]) => ({
                    file,
                    ...val
                }));
            for (const key in applyData) {
                const info = applyData[key];
                if (info.id) {
                    progressCache.set(info.id, {
                        percent: info.percent || 0,
                        status: info.status || "",
                        eta: info.eta
                    });
                }
            }
            const applyByMessageId = {};
            for (const key in applyData) {
                const info = applyData[key];
                if (info.messageId) {
                    applyByMessageId[info.messageId] = info;
                }
            }
            if (!data.ok) {
                box.innerHTML = "Failed To Load Applicants";
                return;
            }
            const seenFiles = new Set();
            for (const f of data.files) {
                if (isCopyFile(f.file)) continue;
                if (is360File(f.file)) continue;
                if (f.file.toLowerCase().endsWith(".json")) continue;
                seenFiles.add(f.file);
                let existing = fileElements.get(f.file);
                const file360 = find360Version(data.files, f.file);
                let displaySize = f.humanSize;
                const applyInfo = applyData.find(a => a.file === f.file);
                if (applyInfo?.status && applyInfo.status.toLowerCase().includes("accept")) {
                    if (file360 && file360.humanSize) {
                        displaySize = file360.humanSize;
                    }
                }
                let progress = applyInfo?.percent || 0;
                let statusText = applyInfo?.status || "";
                if (applyInfo?.id && progressCache.has(applyInfo.id)) {
                    const cached = progressCache.get(applyInfo.id);
                    progress = cached.percent;
                    statusText = cached.status;
                    if (cached.eta !== undefined) {
                        statusText += ` — ${formatTime(cached.eta)} left`;
                    }
                }
                if (existing) {
                    const sizeEl = existing.querySelector(`#size-${f.file}`);
                    if (sizeEl) sizeEl.innerText = displaySize;
                    const statusEl = existing.querySelector(".btxt");
                    if (statusEl) statusEl.innerText = statusText;
                    const bar = existing.querySelector(".file-progress-bar");
                    if (bar) {
                        bar.style.width = progress + "%";
                        bar.innerText = `${Math.floor(progress)}%`;
                    }
                    continue;
                }
                let uploaderName = "Unknown";
                const uploaderId = applyInfo?.uploader || f.uploadedBy;
                if (uploaderId) {
                    try {
                        const displayName = await dbGet(`/users/${uploaderId}/profile/displayName`);
                        if (displayName) {
                            uploaderName = displayName;
                        }
                    } catch (e) {
                        console.error("Failed Loading Display Name", e);
                    }
                }
                const div = document.createElement("div");
                div.className = "file-item";
                div.style.position = "relative";
                div.innerHTML = `
                    <div style="display:inline-flex; width:100%;">
                        <span style="width:100%; text-align:center">
                            <b>${f.file}</b> — 
                            <span id="size-${f.file}">${displaySize}</span>
                        </span>
                    </div>
                    <br>
                    <span class="btxt">${statusText}</span>
                    <br>
                    <button class="button" onclick="watchApply('${f.file}')">Watch</button>
                    <button class="button" onclick="deleteApply('${f.file}')">Delete</button>
                    <button class="button" onclick="acceptFile('${f.file}')">Accept</button>
                    <div class="file-progress" style="margin-top:8px;text-align:left;">
                        <div class="file-progress-bar" data-filename="${f.file}"
                            style="width:${progress}%;background:#4caf50;padding:2px;font-size:12px;text-align:left;">
                            ${Math.floor(progress)}%
                        </div>
                    </div>
                `;
                box.appendChild(div);
                fileElements.set(f.file, div);
            }
            for (const [file, el] of fileElements.entries()) {
                if (!seenFiles.has(file)) {
                    el.remove();
                    fileElements.delete(file);
                }
            }
        }
        async function updateSizesFromListApply() {
            try {
                const res = await adminFetch(BACKEND + `/api/list_apply_x9a7b2?t=${Date.now()}`, {
                    headers: { "ngrok-skip-browser-warning": "true" }
                });
                const data = await res.json();
                if (!data.ok || !data.files) return;
                for (const f of data.files) {
                    if (is360File(f.file)) continue;
                    const span = document.getElementById(`size-${f.file}`);
                    if (!span) continue;
                    let displaySize = f.humanSize;
                    const file360 = find360Version(data.files, f.file);
                    if (file360 && file360.humanSize) {
                        displaySize = file360.humanSize;
                    }
                    span.innerText = displaySize;
                }
            } catch (err) {
                console.error("Size Update Error:", err);
            }
        }
        async function deleteApply(filename) {
            const isAuthenticated = await checkUserAuthentication();
            if (!isAuthenticated) return;
            showConfirm("Delete" + filename + "?", function(result) {
                if (result) {
                    const res = adminFetch(BACKEND + "/api/delete_apply_x9a7b2", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "ngrok-skip-browser-warning": "true"
                        },
                        body: JSON.stringify({ filename })
                    });
                    const data = res.json();
                    if (data.ok) {
                        showSuccess("Deleted.");
                        loadApply();
                    } else {
                        showError("Failed: " + data.message);
                    }
                } else {
                    showSuccess("Canceled");
                }
            })
        }
        async function acceptFile(filename) {
            const isAuthenticated = await checkUserAuthentication();
            if (!isAuthenticated) return;
            const newName = await customPrompt("Enter Name:", false, filename.replace(".mp4", ""));
            if (!newName) return;
            const lg = document.getElementById("logs");
            document.getElementById("before").style.display = "none";
            lg.innerText = "";
            lg.style.height = "70vh";
            lg.style.display = "block";
            document.getElementById("watchPanel").style.display = "none";
            showAcceptProgress();
            appendLog("Accepting");
            socket.emit("acceptApplicant", {
                filename,
                targetName: newName
            });
        }
        function handleJobProgress(data) {
            if (data.percent !== undefined) {
                const bar = document.getElementById("acceptProgressBar");
                const wrap = document.getElementById("acceptProgress");
                const parent = bar?.closest(".file-item");
                if (parent) {
                    const statusEl = parent.querySelector(".btxt");
                    if (statusEl && cached.status) {
                        let txt = cached.status;
                        if (cached.eta !== undefined) {
                            txt += ` — ${formatTime(cached.eta)} Left`;
                        }
                        statusEl.innerText = txt;
                    }
                }
                wrap.style.display = "block";
                bar.style.width = data.percent + "%";
                let label = `${Math.floor(data.percent)}%`;
                if (data.remainingSec !== undefined) {
                    label += ` — ${formatTime(data.remainingSec)} Left`;
                }
                bar.innerText = label;
            }
            if (data.text) appendLog(data.text);
            if (data.id) {
                if (!progressCache.has(data.id)) {
                    progressCache.set(data.id, {});
                }
                const cached = progressCache.get(data.id);
                cached.percent = data.percent ?? cached.percent ?? 0;
                cached.eta = data.remainingSec ?? cached.eta;
                cached.status = data.status ?? cached.status ?? "";
                const bar = document.querySelector(`[data-filename="${data.filename}"]`);
                if (bar) {
                    bar.style.width = cached.percent + "%";
                    bar.innerText = `${Math.floor(cached.percent)}%`;
                }
            }
        }
        function handleJobError(data) {
            appendLog("ERROR: " + data.message);
            hideAcceptProgress();
        }
        function watchApply(filename) {
            const video = document.getElementById("videoPlayer");
            const panel = document.getElementById("watchPanel");
            const before = document.getElementById("before");
            const logs = document.getElementById("logs");
            before.style.display = "none";
            logs.style.display = "none";
            panel.style.display = "block";
            video.src = `${BACKEND}/apply_stream_x9a7b2/${encodeURIComponent(filename)}`;
            video.load();
            video.play();
        }
        function closeWatch() {
            const video = document.getElementById("videoPlayer");
            const panel = document.getElementById("watchPanel");
            const before = document.getElementById("before");
            const logs = document.getElementById("logs");
            video.pause();
            video.src = "";
            panel.style.display = "none";
            before.style.display = "block";
            logs.style.display = "none";
        }
        function handleJobStarted(data) {
            appendLog(`Accept Started: ${data.filename}`);
            showAcceptProgress();
        }
        function handleJobDone(data) {
            showSuccess(`File Accepted: ${data.finalName}`);
            appendLog(`Accept Completed: ${data.finalName}`);
            hideAcceptProgress();
        }
        function isCopyFile(name) {
            return name.endsWith("_copy") || name.includes("_copy.");
        }
        function is360File(name) {
            return name.endsWith("_360") || name.includes("_360.");
        }
        function getCopyNameFrom360(name) {
            return name.replace("_360", "_copy");
        }
        function formatTime(seconds) {
            seconds = Math.max(0, Math.floor(seconds));
            const days = Math.floor(seconds / 86400);
            seconds %= 86400;
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0) parts.push(`${minutes}m`);
            if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
            return parts.join(" ");
        }
        let logCounter = 0;
        const MAX_LOGS = 100;
        function appendLog(msg) {
            logCounter++;
            const logs = document.getElementById("logs");
            const line = document.createElement("div");
            line.textContent = msg;
            line.style.color = (logCounter % 4 === 0) ? "lime" : "white";
            logs.appendChild(line);
            while (logs.children.length > MAX_LOGS) {
                logs.removeChild(logs.firstChild);
            }
            logs.scrollTop = logs.scrollHeight;
        }
        function showAcceptProgress() {
            const wrap = document.getElementById("acceptProgress");
            const bar = document.getElementById("acceptProgressBar");
            wrap.style.display = "block";
            bar.style.width = "0%";
            bar.innerText = "0%";
        }
        function hideAcceptProgress() {
            const wrap = document.getElementById("acceptProgress");
            wrap.style.display = "none";
        }
        let moviesData = null;
        let draggedEl = null;
        async function loadMoviesOrder() {
            const isAuthenticated = await checkUserAuthentication();
            if (!isAuthenticated) return;
            const container = document.getElementById("moviesOrder");
            if (!container) return;
            container.innerHTML = "Loading Movies...";
            try {
                const res = await adminFetch(BACKEND + "/api/movies-json", {
                    headers: { "ngrok-skip-browser-warning": "true" }
                });
                const rawData = await res.json();
                if (rawData && !Array.isArray(rawData)) {
                    moviesData = Object.entries(rawData)
                        .map(([filename, data]) => ({
                            filename,
                            ...data
                        }))
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                } else {
                    moviesData = rawData;
                }
                renderMoviesList();
            } catch (err) {
                container.innerHTML = "Failed To Load Movies";
                console.error(err);
            }
        }
        function renderMoviesList() {
            const container = document.getElementById("moviesOrder");
            container.innerHTML = "";
            if (!moviesData || !Array.isArray(moviesData)) {
                container.innerHTML = "Movies Must Be In An Array.";
                return;
            }
            moviesData.forEach((movie) => {
                const item = document.createElement("div");
                item.className = "movie-item";
                item.draggable = true;
                item.dataset.filename = movie.filename;
                item.innerHTML = `
                    <span class="drag-handle"><i class="ic ic-grip-vertical"></i></span>
                    <span class="movie-name">${movie.filename}</span>
                `;
                addDragEvents(item);
                const nameEl = item.querySelector(".movie-name");
                nameEl.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const currentIndex = moviesData.findIndex(m => m.filename === item.dataset.filename);
                    openMovieEditor(currentIndex);
                });
                container.appendChild(item);
            });
            addSaveButton();
        }
        function addDragEvents(item) {
            const handle = item.querySelector(".drag-handle");
            handle.addEventListener("mousedown", () => {
                item.draggable = true;
            });
            item.addEventListener("dragstart", () => {
                if (!item.draggable) return;
                draggedEl = item;
                item.classList.add("dragging");
            });
            item.addEventListener("dragend", () => {
                item.classList.remove("dragging");
                draggedEl = null;
                item.draggable = false;
                updateMoviesFromDOM();
            });
            item.addEventListener("dragover", (e) => {
                e.preventDefault();
                const container = document.getElementById("moviesOrder");
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedEl);
                } else {
                    container.insertBefore(draggedEl, afterElement);
                }
            });
        }
        let currentEditIndex = null;
        function openMovieEditor(index) {
            const movie = moviesData[index];
            if (!movie) return;
            currentEditIndex = index;
            const modal = document.getElementById("jsonEditorModal");
            const textarea = document.getElementById("jsonEditorTextarea");
            const title = document.getElementById("jsonEditorTitle");
            const errorBox = document.getElementById("jsonEditorError");
            title.innerText = `Editing: ${movie.filename}`;
            textarea.value = JSON.stringify(movie, null, 2);
            errorBox.innerText = "";
            modal.style.display = "flex";
        }
        document.getElementById("closeJsonEditor").onclick = closeJsonEditor;
        document.getElementById("cancelJsonBtn").onclick = closeJsonEditor;
        document.getElementById("formatJsonBtn").onclick = () => {
            const textarea = document.getElementById("jsonEditorTextarea");
            const errorBox = document.getElementById("jsonEditorError");
            try {
                const parsed = JSON.parse(textarea.value);
                textarea.value = JSON.stringify(parsed, null, 2);
                errorBox.innerText = "";
            } catch (err) {
                errorBox.innerText = "Invalid JSON.";
            }
        };
        document.getElementById("saveJsonBtn").onclick = () => {
            const textarea = document.getElementById("jsonEditorTextarea");
            const errorBox = document.getElementById("jsonEditorError");
            try {
                const parsed = JSON.parse(textarea.value);
                if (!parsed.filename) {
                    parsed.filename = moviesData[currentEditIndex].filename;
                }
                parsed.filename = moviesData[currentEditIndex].filename;
                moviesData[currentEditIndex] = parsed;
                showSuccess("Movie Updated (Not Saved Yet)");
                closeJsonEditor();
                renderMoviesList();
            } catch (err) {
                errorBox.innerText = "Invalid JSON.";
            }
        };
        function closeJsonEditor() {
            document.getElementById("jsonEditorModal").style.display = "none";
            currentEditIndex = null;
        }
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll(".movie-item:not(.dragging)")];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        function updateMoviesFromDOM() {
            const items = document.querySelectorAll("#moviesOrder .movie-item");
            const moviesByFilename = new Map(moviesData.map(m => [m.filename, m]));
            const newOrder = [];
            items.forEach(item => {
                const movie = moviesByFilename.get(item.dataset.filename);
                if (movie) newOrder.push(movie);
            });
            moviesData = newOrder;
        }
        function addSaveButton() {
            const container = document.getElementById("moviesOrder");
            let existing = document.getElementById("saveMoviesOrderBtn");
            if (existing) return;
            const btn = document.createElement("button");
            btn.id = "saveMoviesOrderBtn";
            btn.className = "button";
            btn.style.marginTop = "10px";
            btn.innerText = "Save Order";
            btn.onclick = saveMoviesOrder;
            container.parentNode.appendChild(btn);
        }
        async function saveMoviesOrder() {
            const isAuthenticated = await checkUserAuthentication();
            if (!isAuthenticated) return;
            try {
                const formatted = {};
                moviesData.forEach((movie, index) => {
                    const { filename, ...rest } = movie;
                    formatted[filename] = {
                        ...rest,
                        order: (index + 1) * 10,
                        uploadedBy: movie.uploadedBy || "jiEcu7wSifMalQxVupmQXRchA9k1"
                    };
                });
                const res = await adminFetch(BACKEND + "/api/movies-json", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify(formatted)
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess("Movies Order Saved.");
                    loadMoviesOrder();
                } else {
                    showError("Failed To Save Movies.");
                }
            } catch (err) {
                console.error(err);
                showError("Failed To Save Movies.");
            }
        }
        (async () => {
            await verifyAdminPassword();
            loadApply();
        })();
        setInterval(loadApply, 5000);
        window.acceptFile = acceptFile;
        window.loadApply = loadApply;
        window.deleteApply = deleteApply;
        window.watchApply = watchApply;
        window.closeWatch = closeWatch;
    } else if (adminRuleParams) {
        adminRules.style.display = 'block';
        adminPages.style.display = 'none';
        forceWebSockets();
        const BACKEND = `${a}`;
        const bk2 = `https://infinitecampus.xyz`;
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
        let ADMIN_PASS = localStorage.getItem("a_pass") || null;
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
            const token = await getAuthToken();
            options.headers = Object.assign({}, options.headers, {
                "x-admin-password": ADMIN_PASS,
                "ngrok-skip-browser-warning": "true"
            });
            if (token) options.headers["Authorization"] = "Bearer " + token;
            return fetch(url, options);
        }
        async function checkUserPermissions(user) {
            if (!user) {
                showError("You Must Be Logged In To Access This Page.");
                window.location.href = "/InfiniteLogins.html";
                return false;
            }
            const snapshot = await dbGet(`users/${user.uid}/profile`);
            if (snapshot == null || snapshot == undefined) {
                showError("User Profile Not Found.");
                return false;
            }
            if (snapshot.isOwner || snapshot.isTester || snapshot.isCoOwner || snapshot.isHAdmin || snapshot.isDev) {
                return true;
            } else {
                showError("You Do Not Have The Required Permissions To Access This Page.");
                return false;
            }
        }
        async function checkOwnerPermissions(user) {
            if (!user) return false;
            const snapshot = await dbGet(`users/${user.uid}/profile`);
            return !!(snapshot && snapshot.isOwner);
        }
        async function fetchUrls() {
            const user = auth.currentUser;
            if (!user) {
                showError("You Must Be Logged In To Fetch URLs.");
                return;
            }
            const hasPermission = await checkUserPermissions(user);
            if (!hasPermission) return;
            const res = await adminFetch(bk2 + "/edit-urls", {
                headers: { "ngrok-skip-browser-warning": "true" }
            });
            const data = await res.json();
            populateBlockedList(data);
        }
        function populateBlockedList(data) {
            const list = document.getElementById("blocked-list");
            const search = document.getElementById("search");
            const query = search.value.toLowerCase();
            list.innerHTML = "";
            for (const url in data) {
                if (!url.toLowerCase().includes(query)) continue;
                const reason = data[url];
                const div = document.createElement("div");
                div.className = "blocked-item";
                div.innerHTML = `
                    <div class="url">${url}</div>
                    <div class="reason">${reason}</div>
                    <button class="delete-small button">Delete</button>
                `;
                div.querySelector(".delete-small").onclick = () => deleteUrl(url);
                list.appendChild(div);
            }
        }
        window.addUrl = addUrl;
        async function addUrl() {
            const user = auth.currentUser;
            if (!user) {
                showError("You Must Be Logged In To Add URLs.");
                return;
            }
            const hasPermission = await checkUserPermissions(user);
            if (!hasPermission) return;
            const url = document.getElementById("add-url-input").value.trim();
            const reason = document.getElementById("add-reason-input").value.trim();
            const error = document.getElementById("add-error");
            if (!url || !reason) {
                error.textContent = "URL And Reason Required.";
                return;
            }
            const res = await adminFetch(BACKEND + "/edit-urls/add", {
                method: "POST",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                body: JSON.stringify({ url, reason })
            });
            const data = await res.json();
            if (!res.ok) {
                error.textContent = data.error || "Failed To Add URL.";
                return;
            }
            document.getElementById("add-url-input").value = "";
            document.getElementById("add-reason-input").value = "";
            document.getElementById("add-panel").classList.remove("open");
            fetchUrls();
        }
        async function deleteUrl(url) {
            const user = auth.currentUser;
            if (!user) {
                showError("You Must Be Logged In To Delete URLs.");
                return;
            }
            const hasPermission = await checkUserPermissions(user);
            if (!hasPermission) return;
            showConfirm("Delete This URL?", function(result) {
                if (result) {
                    adminFetch(BACKEND + "/edit-urls/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                        body: JSON.stringify({ url })
                    });
                    fetchUrls();
                } else {
                    showSuccess("Canceled");
                }
            });
        }
        function escAttr(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
        function syntaxHighlightCollapsible(json, editorId) {
            const lines = json.split("\n");
            return lines.map(line => highlightLineText(line, editorId)).join("\n");
        }
        function highlightLineText(line, editorId) {
            const isRules = editorId === "rules-editor";
            const escaped = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            return escaped.replace(
                /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
                function(match) {
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            const keyName = match.replace(/"/g, "").replace(/:$/, "");
                            if (isRules) {
                                if ([".read", ".write", ".validate", ".indexOn"].includes(keyName)) {
                                    return `<span class="hl-rule-key">${match}</span>`;
                                }
                                if (keyName.startsWith("$")) {
                                    return `<span class="hl-wildcard">${match}</span>`;
                                }
                                if (keyName === "rules") {
                                    return `<span class="hl-rules-root">${match}</span>`;
                                }
                            }
                            return `<span class="hl-key">${match}</span>`;
                        }
                        const inner = match.replace(/^"|"$/g, "");
                        if (isRules && /\bauth\b/.test(inner)) return `<span class="hl-auth">${match}</span>`;
                        if (isRules && /\b(data|newData|root)\b/.test(inner)) return `<span class="hl-data">${match}</span>`;
                        return `<span class="hl-string">${match}</span>`;
                    }
                    if (/true|false/.test(match)) return `<span class="hl-bool">${match}</span>`;
                    if (/null/.test(match)) return `<span class="hl-null">${match}</span>`;
                    return `<span class="hl-number">${match}</span>`;
                }
            );
        }
        function syntaxHighlight(json) {
            return syntaxHighlightCollapsible(json, "rules-editor");
        }
        function updateLineNumbers(editorId) {
            const gutterMap = { "rules-editor": "rules-gutter", "data-editor": "data-gutter", "words-editor": "words-gutter", "users-editor": "users-gutter" };
            const editor = document.getElementById(editorId);
            const gutter = document.getElementById(gutterMap[editorId]);
            if (!editor || !gutter) return;
            const lineCount = editor.innerText.split("\n").length;
            gutter.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join("");
        }
        function reRenderEditor(editorId) {
            const editor = document.getElementById(editorId);
            if (!editor) return;
            const raw = editor.innerText;
            editor.innerHTML = syntaxHighlightCollapsible(raw, editorId);
            updateLineNumbers(editorId);
        }
        let _rulesOriginal = "";
        async function fetchRules() {
            const user = auth.currentUser;
            if (!user) return;
            const hasPermission = await checkUserPermissions(user);
            if (!hasPermission) return;
            const statusEl = document.getElementById("rules-status");
            statusEl.textContent = "Loading...";
            statusEl.style.color = "";
            try {
                const res = await adminFetch(BACKEND + "/admin/modify-rules", {
                    method: "GET",
                    headers: { "ngrok-skip-browser-warning": "true" }
                });
                const data = await res.json();
                if (!res.ok) {
                    statusEl.textContent = data.error || "Failed to load rules.";
                    return;
                }
                const pretty = JSON.stringify(data.rules, null, 2);
                _rulesOriginal = pretty;
                document.getElementById("rules-editor").innerHTML = syntaxHighlightCollapsible(pretty, "rules-editor");
                updateLineNumbers("rules-editor");
                statusEl.textContent = "Loaded.";
            } catch (err) {
                statusEl.textContent = "Error: " + err.message;
            }
        }
        async function saveRules() {
            const user = auth.currentUser;
            if (!user) { showError("Not logged in."); return; }
            const hasPermission = await checkUserPermissions(user);
            if (!hasPermission) return;
            const raw = document.getElementById("rules-editor").innerText;
            const statusEl = document.getElementById("rules-status");
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                showError(`Invalid JSON ${e.message}`);
                return;
            }
            statusEl.textContent = "Saving...";
            statusEl.style.color = "";
            try {
                const res = await adminFetch(BACKEND + "/admin/modify-rules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                    body: JSON.stringify({ rules: parsed })
                });
                const data = await res.json();
                if (!res.ok) {
                    showError(data.error || "Save Failed");
                    return;
                }
                _rulesOriginal = JSON.stringify(parsed, null, 2);
                showSuccess(`Saved. Total modifications: ${data.timesRulesModified}`);
                document.getElementById("rules-editor").innerHTML = syntaxHighlightCollapsible(_rulesOriginal, "rules-editor");
                updateLineNumbers("rules-editor");
                statusEl.textContent = "Saved.";
            } catch (err) {
                showError(err.message);
            }
        }
        let _dataOriginal = "";
        let _isOwner = false;
        async function fetchData() {
            const user = auth.currentUser;
            if (!user) return;
            const statusEl = document.getElementById("data-status");
            statusEl.textContent = "Checking permissions...";
            _isOwner = await checkOwnerPermissions(user);
            if (!_isOwner) {
                statusEl.textContent = "Owner access required.";
                document.getElementById("data-editor").contentEditable = "false";
                document.getElementById("data-editor").style.opacity = "0.5";
                document.getElementById("data-save-btn").disabled = true;
                return;
            }
            statusEl.textContent = "Loading...";
            statusEl.style.color = "";
            try {
                const res = await adminFetch(BACKEND + "/admin/modify-data", {
                    method: "GET",
                    headers: { "ngrok-skip-browser-warning": "true" }
                });
                const result = await res.json();
                if (!res.ok) {
                    statusEl.textContent = result.error || "Failed to load data.";
                    return;
                }
                const pretty = JSON.stringify(result.data, null, 2);
                _dataOriginal = pretty;
                document.getElementById("data-editor").innerHTML = syntaxHighlightCollapsible(pretty, "data-editor");
                updateLineNumbers("data-editor");
                statusEl.textContent = "Loaded.";
            } catch (err) {
                statusEl.textContent = "Error: " + err.message;
            }
        }
        function collectLeafPaths(obj, prefix, out) {
            if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
                out[prefix] = obj;
                return;
            }
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                out[prefix] = obj;
                return;
            }
            for (const k of keys) {
                collectLeafPaths(obj[k], prefix ? prefix + "/" + k : k, out);
            }
        }
        function diffJSON(oldObj, newObj) {
            const oldLeaves = {};
            const newLeaves = {};
            collectLeafPaths(oldObj, "", oldLeaves);
            collectLeafPaths(newObj, "", newLeaves);
            const patches = [];
            for (const p in newLeaves) {
                if (JSON.stringify(newLeaves[p]) !== JSON.stringify(oldLeaves[p])) {
                    patches.push({ path: p, value: newLeaves[p] });
                }
            }
            for (const p in oldLeaves) {
                if (!(p in newLeaves)) {
                    patches.push({ path: p, value: null });
                }
            }
            return patches;
        }
        async function saveData() {
            const user = auth.currentUser;
            if (!user) { showError("Not Logged In."); return; }
            if (!_isOwner) { showError("Owner Access Required."); return; }
            const raw = document.getElementById("data-editor").innerText;
            const statusEl = document.getElementById("data-status");
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                showError(`Invalid JSON: ${e.message}`);
                return;
            }
            let oldParsed;
            try {
                oldParsed = _dataOriginal ? JSON.parse(_dataOriginal) : {};
            } catch {
                oldParsed = {};
            }
            const patches = diffJSON(oldParsed, parsed);
            if (patches.length === 0) {
                showSuccess("No Changes Detected.");
                statusEl.textContent = "No Changes.";
                return;
            }
            showConfirm(`This Will Apply ${patches.length} Change(s) To data.json. Are You Sure?`, async (confirmed) => {
                if (!confirmed) return;
                statusEl.textContent = "Saving...";
                statusEl.style.color = "";
                try {
                    const res = await adminFetch(BACKEND + "/admin/modify-data", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                        body: JSON.stringify({ patches })
                    });
                    const result = await res.json();
                    if (!res.ok) {
                        showError(result.error || "Save Failed");
                        statusEl.textContent = "Save failed.";
                        return;
                    }
                    _dataOriginal = JSON.stringify(parsed, null, 2);
                    showSuccess(`data.json saved (${patches.length} change(s) applied).`);
                    document.getElementById("data-editor").innerHTML = syntaxHighlightCollapsible(_dataOriginal, "data-editor");
                    updateLineNumbers("data-editor");
                    statusEl.textContent = "Saved.";
                } catch (err) {
                    showError(err.message);
                    statusEl.textContent = "Error.";
                }
            });
        }
        async function fetchWords() {
            document.getElementById("words-status").textContent = "Loading...";
            try {
                const res = await adminFetch(BACKEND + "/admin/modify-restricted-words", { method: "GET" });
                if (!res.ok) throw new Error(await res.text());
                const { words } = await res.json();
                const pretty = JSON.stringify(words, null, 2);
                document.getElementById("words-editor").textContent = pretty;
                updateLineNumbers("words-editor");
                document.getElementById("words-status").textContent = "Loaded ✓";
            } catch (err) {
                document.getElementById("words-status").textContent = "Error: " + err.message;
            }
        }
        async function saveWords() {
            document.getElementById("words-status").textContent = "Saving...";
            const raw = document.getElementById("words-editor").innerText || document.getElementById("words-editor").textContent;
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                document.getElementById("words-status").textContent = "Invalid JSON: " + e.message;
                return;
            }
            try {
                const res = await adminFetch(BACKEND + "/admin/modify-restricted-words", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ words: parsed })
                });
                if (!res.ok) throw new Error(await res.text());
                document.getElementById("words-status").textContent = "Saved ✓";
            } catch (err) {
                document.getElementById("words-status").textContent = "Error: " + err.message;
            }
        }
        let _dataLoaded = false;
        let _wordsLoaded = false;
        let _usersLoaded = false;
        let _usersOriginal = "";
        let _isUsersOwner = false;
        async function fetchUsers() {
            const user = auth.currentUser;
            if (!user) return;
            const statusEl = document.getElementById("users-status");
            statusEl.textContent = "Checking permissions...";
            _isUsersOwner = await checkOwnerPermissions(user);
            if (!_isUsersOwner) {
                statusEl.textContent = "Owner access required.";
                document.getElementById("users-editor").contentEditable = "false";
                document.getElementById("users-editor").style.opacity = "0.5";
                document.getElementById("users-save-btn").disabled = true;
                return;
            }
            statusEl.textContent = "Loading...";
            statusEl.style.color = "";
            try {
                const res = await adminFetch(BACKEND + "/admin/modify-users", {
                    method: "GET",
                    headers: { "ngrok-skip-browser-warning": "true" }
                });
                const result = await res.json();
                if (!res.ok) {
                    statusEl.textContent = result.error || "Failed to load users.";
                    return;
                }
                const pretty = JSON.stringify(result.users, null, 2);
                _usersOriginal = pretty;
                document.getElementById("users-editor").innerHTML = syntaxHighlightCollapsible(pretty, "users-editor");
                updateLineNumbers("users-editor");
                statusEl.textContent = "Loaded.";
            } catch (err) {
                statusEl.textContent = "Error: " + err.message;
            }
        }
        async function saveUsers() {
            const user = auth.currentUser;
            if (!user) { showError("Not Logged In."); return; }
            if (!_isUsersOwner) { showError("Owner Access Required."); return; }
            const raw = document.getElementById("users-editor").innerText;
            const statusEl = document.getElementById("users-status");
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                showError(`Invalid JSON: ${e.message}`);
                return;
            }
            let oldParsed;
            try {
                oldParsed = _usersOriginal ? JSON.parse(_usersOriginal) : {};
            } catch {
                oldParsed = {};
            }
            const patches = diffJSON(oldParsed, parsed);
            if (patches.length === 0) {
                showSuccess("No Changes Detected.");
                statusEl.textContent = "No Changes.";
                return;
            }
            showConfirm(`This Will Apply ${patches.length} Change(s) To users.json. Are You Sure?`, async (confirmed) => {
                if (!confirmed) return;
                statusEl.textContent = "Saving...";
                statusEl.style.color = "";
                try {
                    const res = await adminFetch(BACKEND + "/admin/modify-users", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                        body: JSON.stringify({ patches })
                    });
                    const result = await res.json();
                    if (!res.ok) {
                        showError(result.error || "Save Failed");
                        statusEl.textContent = "Save failed.";
                        return;
                    }
                    _usersOriginal = JSON.stringify(parsed, null, 2);
                    showSuccess(`users.json saved (${patches.length} change(s) applied).`);
                    document.getElementById("users-editor").innerHTML = syntaxHighlightCollapsible(_usersOriginal, "users-editor");
                    updateLineNumbers("users-editor");
                    statusEl.textContent = "Saved.";
                } catch (err) {
                    showError(err.message);
                    statusEl.textContent = "Error.";
                }
            });
        }
        document.querySelectorAll(".editor-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".editor-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                const target = tab.dataset.tab;
                document.getElementById("rules-section").classList.toggle("visible", target === "rules");
                document.getElementById("data-section").classList.toggle("visible", target === "data");
                document.getElementById("words-section").classList.toggle("visible", target === "words");
                document.getElementById("users-section").classList.toggle("visible", target === "users");
                if (target === "data" && !_dataLoaded) {
                    _dataLoaded = true;
                    fetchData();
                }
                if (target === "words" && !_wordsLoaded) {
                    _wordsLoaded = true;
                    fetchWords();
                }
                if (target === "users" && !_usersLoaded) {
                    _usersLoaded = true;
                    fetchUsers();
                }
            });
        });
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                fetchUrls();
                fetchRules();
            } else {
                window.location.href = "/InfiniteLogins.html";
            }
        });
        const panelBtn = document.getElementById("panel-btn");
        const panel = document.getElementById("panel");
        panelBtn.onclick = () => {
            panel.classList.add("open");
            panelBtn.style.display = "none";
        };
        document.getElementById("panel-back").onclick = () => {
            panel.classList.remove("open");
            panelBtn.style.display = "inline";
        };
        document.getElementById("add-url-btn").onclick = () =>
            document.getElementById("add-panel").classList.add("open");
        document.getElementById("add-close").onclick = () =>
            document.getElementById("add-panel").classList.remove("open");
        document.getElementById("search").oninput = fetchUrls;
        document.getElementById("rules-save-btn").onclick = saveRules;
        document.getElementById("rules-refresh-btn").onclick = fetchRules;
        document.getElementById("rules-editor").addEventListener("input", () => {
            updateLineNumbers("rules-editor");
        });
        document.getElementById("rules-editor").addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertText", false, "  ");
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveRules();
            }
        });
        document.getElementById("data-save-btn").onclick = saveData;
        document.getElementById("data-refresh-btn").onclick = fetchData;
        document.getElementById("data-editor").addEventListener("input", () => {
            updateLineNumbers("data-editor");
        });
        document.getElementById("data-editor").addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertText", false, "  ");
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveData();
            }
        });
        document.getElementById("words-save-btn").onclick = saveWords;
        document.getElementById("words-refresh-btn").onclick = fetchWords;
        document.getElementById("words-editor").addEventListener("input", () => {
            updateLineNumbers("words-editor");
        });
        document.getElementById("words-editor").addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertText", false, "  ");
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveWords();
            }
        });
        document.getElementById("users-save-btn").onclick = saveUsers;
        document.getElementById("users-refresh-btn").onclick = fetchUsers;
        document.getElementById("users-editor").addEventListener("input", () => {
            updateLineNumbers("users-editor");
        });
        document.getElementById("users-editor").addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertText", false, "  ");
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveUsers();
            }
        });
        document.getElementById("words-collapse-all-btn").onclick = () => collapseAll("words-editor");
        document.getElementById("words-expand-all-btn").onclick = () => expandAll("words-editor");
        document.getElementById("users-collapse-all-btn").onclick = () => collapseAll("users-editor");
        document.getElementById("users-expand-all-btn").onclick = () => expandAll("users-editor");
        (async () => {
            await verifyAdminPassword();
        })();
    } else if (adminServerParams) {
        adminServer.style.display = 'block';
        adminPages.style.display = 'none';
        forceWebSockets();
        let currentUser = null;
        let isAuthInitialized = false;
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
        const BACKEND = `${a}`;
        const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };
        let ADMIN_PASS = localStorage.getItem("a_pass") || null;
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            isAuthInitialized = true;
        });
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
            const userRef = `users/${uid}/profile`;
            const snapshot = await dbGet(userRef);
            if (snapshot == null || snapshot == undefined) {
                showError("Profile Data Not Found.");
                return false;
            }
            const userData = snapshot;
            const { isOwner, isTester, isCoOwner, isHAdmin, isDev } = userData;
            if (isOwner || isTester || isCoOwner || isHAdmin || isDev ) {
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
        async function fetchFiles() {
            if (!await checkPermissions()) return;
            const res = await adminFetch(`${a}/admin/files`, { headers: NGROK_HEADERS });
            const files = await res.json();
            const tbody = document.querySelector("#fileTable tbody");
            tbody.innerHTML = "";
            files.forEach(f => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${f.number}</td>
                    <td>${f.name}</td>
                    <td>${formatBytes(f.size)}</td>
                    <td>${f.remainingSec}s</td>
                    <td>
                        <button class="button" onclick="downloadFile('${f.name}')">Download</button>
                        <button class="button" onclick="deleteFile('${f.name}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        async function deleteFile(filename) {
            if (!await checkPermissions()) return;
            showConfirm(`Delete ${filename}?`, function(result) {
                if (result) {
                    const res = adminFetch(`${a}/admin/files/${encodeURIComponent(filename)}`, {
                        method: "DELETE",
                        headers: NGROK_HEADERS
                    });
                    if (res.ok) fetchFiles();
                    else showError("Failed To Delete File");
                } else {
                    showSuccess("Canceled");
                }
            })
        }
        async function downloadFile(filename) {
            if (!await checkPermissions()) return;
            const link = document.createElement("a");
            link.href = `${a}/files/${encodeURIComponent(filename)}`;
            link.download = filename;
            link.click();
        }
        function formatBytes(bytes) {
            const units = ["B", "KB", "MB", "GB"];
            let i = 0;
            while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
            return bytes.toFixed(1) + " " + units[i];
        }
        document.getElementById("lockdownBtn").addEventListener("click", async () => {
            if (!await checkPermissions()) return;
            const res = await adminFetch(`${a}/admin/lockdown`, {
                method: "POST",
                headers: NGROK_HEADERS
            });
            if (res.ok) {
                const state = await res.json();
                showSuccess("Lockdown Is Now " + (state.lockdown ? "ENABLED" : "DISABLED"));
                document.getElementById("lockdownBtn").textContent = `Lockdown ` + (state.lockdown ? "ON" : "OFF");
            } else {
                showError("Failed To Toggle Lockdown");
            }
        });
        document.getElementById("lockdowndisc").addEventListener("click", async () => {
            if (!await checkPermissions()) return;
            const res = await adminFetch(`${a}/admin/discord_toggle`, {
                method: "POST",
                headers: NGROK_HEADERS
            });
            if (res.ok) {
                const state = await res.json();
                showSuccess("Discord Lockdown Is Now " + (state.lockdown ? "ENABLED" : "DISABLED"));
                document.getElementById("lockdowndisc").textContent = `Discord Lockdown ` + (state.lockdown ? "ON" : "OFF");
            } else {
                showError("Failed To Toggle Discord Lockdown");
            }
        });
        document.getElementById("restartServerBtn").addEventListener("click", async () => {
            if (!await checkPermissions()) return;
            showConfirm("Restart the server? Active accepts will be waited on first.", async function(result) {
                if (!result) return;
                try {
                    const token = await (async () => {
                        await authReadyPromise;
                        return currentUser ? await currentUser.getIdToken() : null;
                    })();
                    const headers = { ...NGROK_HEADERS };
                    if (token) headers["Authorization"] = "Bearer " + token;
                    headers["x-admin-password"] = ADMIN_PASS;
                    const res = await fetch(`${a}/admin/restart`, {
                        method: "POST",
                        headers
                    });
                    const data = await res.json();
                    if (res.ok) {
                        if (data.status === "pending") {
                            showSuccess("Restart queued: " + data.message);
                        } else {
                            showSuccess("Server restarting... you may need to refresh in a moment.");
                        }
                    } else {
                        showError(data.error || "Failed to restart server");
                    }
                } catch (e) {
                    showError("Restart request failed: " + e.message);
                }
            });
        });
        async function fetchLogs() {
            if (!await checkPermissions()) return;
            const res = await adminFetch(`${a}/admin/logs`, { headers: NGROK_HEADERS });
            if (!res.ok) return;
            const logs = await res.json();
            const logsContainer = document.getElementById("serverLogs");
            logsContainer.innerHTML = "";
            const formatTime = ts => {
                const d = new Date(ts);
                let hours = d.getHours();
                const minutes = d.getMinutes().toString().padStart(2, "0");
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12;
                return `${hours}:${minutes} ${ampm}`;
            };
            const uploadSection = document.createElement("div");
            uploadSection.innerHTML = "<h3>Upload Logs</h3>";
            if (logs.uploadLogs?.length) {
                const ul = document.createElement("ul");
                logs.uploadLogs.forEach(l => {
                    const li = document.createElement("li");
                    li.textContent = `[${formatTime(l.ts)}] ${l.message}`;
                    ul.appendChild(li);
                });
                uploadSection.appendChild(ul);
            } else {
                uploadSection.innerHTML += "<p>No Upload Logs</p>";
            }
            logsContainer.appendChild(uploadSection);
            const rateSection = document.createElement("div");
            rateSection.innerHTML = "<h3>Rate Limit Logs</h3>";
            if (logs.rateLimitLogs?.length) {
                const ul = document.createElement("ul");
                logs.rateLimitLogs.forEach(l => {
                    const li = document.createElement("li");
                    li.textContent = `[${formatTime(l.ts)}] ${l.message}`;
                    ul.appendChild(li);
                });
                rateSection.appendChild(ul);
            } else {
                rateSection.innerHTML += "<p>No Rate Limit Logs</p>";
            }
            logsContainer.appendChild(rateSection);
            const linksSection = document.createElement("div");
            linksSection.innerHTML = "<h3>Active Links</h3>";
            if (logs.activeLinks?.length) {
                const ul = document.createElement("ul");
                logs.activeLinks.forEach(l => {
                    const li = document.createElement("li");
                    li.textContent = `[${formatTime(l.ts)}] ${l.url}`;
                    ul.appendChild(li);
                });
                linksSection.appendChild(ul);
            } else {
                linksSection.innerHTML += "<p>No Active Links</p>";
            }
            logsContainer.appendChild(linksSection);
        }
        setInterval(() => {
            fetchFiles();
            fetchLogs();
        }, 1000);
        (async () => {
            await verifyAdminPassword();
        })();
        fetchFiles();
        fetchLogs();
        window.deleteFile = deleteFile;
        window.downloadFile = downloadFile;
    } else if (adminEmailParams) {
        const style = document.createElement("style");
        style.innerHTML = `
            body {
    			display: flex;
    			flex-direction: column;
  			}
  			main {
    			z-index: 1;
    			display: grid;
    			grid-template-columns: 300px 1fr;
    			gap: 0;
    			flex: 1;
                padding-top:25px;
    			overflow: hidden;
  			}
            #adminEmail {
                height:calc(100vh - var(--headerHeight));
            }
  			.user-item {
    			display: flex;
    			align-items: center;
    			gap: 10px;
    			padding: 8px 14px;
    			cursor: pointer;
    			transition: background 0.2s;
    			user-select: none;
    			background: #222;
    			border-bottom: 1px solid #333;
  			}
  			.user-item:hover { 
				background: #333; 
			}
  			.user-item.selected { 
				background: #2a2a2a; 
			}
  			.user-checkbox {
    			width: 14px;
    			height: 14px;
    			border: 1px solid white;
    			border-radius: 3px;
    			flex-shrink: 0;
    			display: flex;
    			align-items: center;
    			justify-content: center;
    			transition: all 0.1s;
    			background: black;
  			}
  			.user-checkbox::after {
   	 			content: '';
    			width: 7px;
    			height: 5px;
    			border-left: 1.5px solid #fff;
    			border-bottom: 1.5px solid #fff;
    			transform: rotate(-45deg) translate(0px, -1px);
    			opacity: 0;
    			transition: opacity 0.1s;
  			}
  			.user-item.selected .user-checkbox::after { 
				opacity: 1; 
			}
  			.user-info { 
				flex: 1; 
				min-width: 0; 
			}
  			.user-name { 
				font-size: 12px; 
				color: white; 
				white-space: nowrap; 
				overflow: hidden; 
				text-overflow: ellipsis; 
			}
  			.user-email { 
				font-size: 10px; 
				color: #aaa; 
				white-space: nowrap; 
				overflow: hidden; 
				text-overflow: ellipsis; 
			}
  			.user-role-dot {
    			width: 6px;
    			height: 6px;
    			border-radius: 50%;
    			flex-shrink: 0;
    			background: #3a4055;
  			}
  			.role-owner {
				background: lime;
			}
  			.role-tester { 
				background: darkgoldenrod;
			}
  			.role-coowner { 
				background: lightblue; 
			}
  			.role-headadmin { 
				background: #00cc99;
			}
  			.role-dev { 
				background: green;
			}
  			.role-admin { 
				background: dodgerblue; 
			}
  			.role-p1 {
				background:yellow;
			}
  			.role-p2 { 
				background:orange;
			}
  			.role-p3 { 
				background:red;
			}
  			.role-partner { 
				background: cornflowerblue; 
			}
  			.role-verified { 
				background: #64748b; 
			}
  			.composer {
    			display: flex;
    			flex-direction: column;
    			overflow: hidden;
  			}
  			.composer-head {
    			padding: 14px 20px;
    			border-bottom: 1px solid #444;
    			display: flex;
    			align-items: center;
    			gap: 12px;
  			}
  			.composer-title {
    			font-weight: 700;
    			font-size: 11px;
    			letter-spacing: 0.12em;
    			text-transform: uppercase;
    			color: white;
  			}
  			.selected-tags {
    			display: flex;
    			flex-wrap: wrap;
    			gap: 5px;
    			align-items: center;
    			flex: 1;
  			}
  			.selected-tag {
    			display: flex;
    			align-items: center;
    			gap: 5px;
    			background: #222;
    			border: 1px solid white;
    			border-radius: 7px;
    			padding: 2px 8px;
    			font-size: 11px;
    			color: white;
    			cursor: pointer;
    			transition: all 0.3s;
  			}
  			.composer-body {
    			flex: 1;
    			overflow-y: auto;
    			padding: 16px 20px;
    			display: flex;
    			flex-direction: column;
    			gap: 14px;
    			height: fit-content;
  			}
  			.composer-body::-webkit-scrollbar { 
				width: 4px;
			}
  			.composer-body::-webkit-scrollbar-thumb { 
				background: #3a4055; 
				border-radius: 2px; 
			}
  			.field-group {
    			display: flex;
    			flex-direction: column;
    			gap: 5px;
  			}
  			.field-label {
    			font-size: 10px;
    			letter-spacing: 0.1em;
    			text-transform: uppercase;
    			color: white;
    			display: flex;
    			align-items: center;
    			gap: 6px;
  			}
  			.field-hint {
                font-size: 10px;
                color: white;
                font-style: italic;
                margin-left: auto;
            }
            .field-row { 
                display: flex; 
                gap: 10px; 
            }
            .field-row .field-group { 
                flex: 1; 
            }
            .multi-email-input {
                position: relative;
            }
            .email-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                padding: 7px 10px;
                background: black;
                border: 1px solid white;
                border-radius: 7px;
                min-height: 38px;
                cursor: text;
                transition: border-color 0.15s;
            }
            .email-tag {
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(79,156,249,0.12);
                border: 1px solid rgba(79,156,249,0.25);
                border-radius: 3px;
                padding: 1px 6px;
                font-size: 11px;
                color: var(--accent);
            }
            .email-tag .rm { 
                cursor: pointer; 
                opacity: 0.6;
            }
            .email-tag .rm:hover { 
                opacity: 1; 
                color: #f87171; 
            }
            .email-tags input {
                border: none;
                background: transparent;
                outline: none;
                color: #e8ecf5;
                font-family: 'DM Mono', monospace;
                font-size: 12px;
                min-width: 140px;
                flex: 1;
                padding: 1px 2px;
            }
            .body-editor {
                position: relative;
            }
            .toolbar {
                display: flex;
                gap: 4px;
                padding: 6px 8px;
                background: #222;
                border: 1px solid white;
                border-bottom: none;
                border-radius: 7px 7px 0 0;
                flex-wrap: wrap;
                align-items: center;
            }
            .tb-btn {
                padding: 3px 8px;
                background: black;
                border: 1px solid white;
                border-radius: 7px;
                color: white;
                font-family: 'DM Mono', monospace;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .tb-sep {
                width: 1px;
                height: 16px;
                background: #444;
                margin: 0 2px;
            }
            .body-textarea {
                border-radius: 0 0 6px 6px;
                min-height: 200px;
                font-size: 13px;
                line-height: 1.7;
                width: 100%;
            }
            .preview-box {
                background: #222;
                border: 1px solid white;
                border-radius: 7px;
                padding: 16px;
                font-size: 13px;
                line-height: 1.7;
                min-height: 120px;
                color: white;
            }
            .tabs {
                display: flex;
                gap: 2px;
                padding: 2px;
                background: #222;
                border-radius: 7px;
                border: 1px solid white;
                width: fit-content;
            }
            .tab-btn {
                padding: 4px 12px;
                border-radius: 5px;
                border: none;
                background: transparent;
                color: white;
                font-family: 'DM Mono', monospace;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .tab-btn.active { 
                background: black; 
                color: white; 
                border: 1px solid white; 
            }
            .composer-footer {
                padding: 14px 20px;
                border-top: 1px solid #444;
                display: flex;
                align-items: center;
                gap: 12px;
                background: #1a1a1a;
            }
            .send-info {
                font-size: 11px;
                color: #aaa;
                flex: 1;
            }
            .send-info strong { 
                color: white; 
            }
            .send-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 9px 20px;
                background: black;
                color: #fff;
                border: 1px solid white;
                border-radius: 7px;
                font-family: 'Syne', sans-serif;
                font-weight: 700;
                font-size: 12px;
                letter-spacing: 0.05em;
                cursor: pointer;
                transition: all 0.3s;
            }
            .send-btn:hover { 
                filter: invert(0.9);
                transform: translateY(-1px); 
            }
            .send-btn:disabled { 
                opacity: 0.4; 
                cursor: not-allowed; 
                transform: none; 
                filter: none; 
            }
            #progress-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.85);
                z-index: 300;
                display: none;
                align-items: center;
                justify-content: center;
            }
            #progress-modal.active { 
                display: flex; 
            }
            .progress-card {
                background: #222;
                border: 1px solid white;
                border-radius: 10px;
                padding: 28px 32px;
                width: 380px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .progress-card h3 {
                font-family: 'Syne', sans-serif;
                font-weight: 700;
                font-size: 14px;
            }
            .progress-bar-track {
                height: 4px;
                background: #333;
                border-radius: 2px;
                overflow: hidden;
            }
            .progress-bar-fill {
                height: 100%;
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
            }
            .progress-log {
                font-size: 11px;
                color: white;
                height: 80px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .progress-log span { 
                display: block; 
            }
            .progress-log .ok { 
                color: #34d399; 
            }
            .progress-log .err { 
                color: #f87171; 
            }
            .no-email-badge {
                font-size: 9px;
                padding: 1px 5px;
                border-radius: 2px;
                background: rgba(251,191,36,0.1);
                border: 1px solid rgba(251,191,36,0.25);
                color: #fbbf24;
                letter-spacing: 0.04em;
                flex-shrink: 0;
            }
            .unsub-badge {
                font-size: 9px;
                padding: 1px 5px;
                border-radius: 2px;
                background: rgba(248,113,113,0.1);
                border: 1px solid rgba(248,113,113,0.3);
                color: #f87171;
                letter-spacing: 0.04em;
                flex-shrink: 0;
            }
            .loading-users {
                padding: 24px 14px;
                text-align: center;
                color: white;
                font-size: 11px;
            }
            .select-all-row {
                padding: 7px 14px;
                border-bottom: 1px solid #444;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 11px;
                color: #aaa;
                transition: color 0.2s;
                user-select: none;
                background: #1a1a1a;
            }
            .select-all-row:hover { 
                color: white; 
                background: #2a2a2a; 
            }
            hr.divider {
                border: none;
                border-top: 1px solid #444;
                margin: 0;
            }
            .sidebar {
                overflow:scroll;
            }
            .template-picker-row {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-bottom: 1px solid #333;
                background: #111;
                flex-shrink: 0;
            }
            .template-picker-label {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #888;
                white-space: nowrap;
            }
            .template-picker-select {
                flex: 1;
                background: #1b1b1b !important;
                border: 1px solid #444 !important;
                color: #fff !important;
                border-radius: 6px !important;
                font-size: 11px;
                padding: 5px 8px;
                cursor: pointer;
            }
            .template-picker-select:focus {
                outline: none;
                border-color: #888 !important;
            }
            .template-vars-row {
                display: none;
                flex-wrap: wrap;
                gap: 6px;
                padding: 8px 20px;
                border-bottom: 1px solid #333;
                background: #0d0d0d;
            }
            .template-vars-row.visible {
                display: flex;
            }
            .template-var-field {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .template-var-field label {
                font-size: 9px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
            .template-var-field input {
                background: #1b1b1b;
                border: 1px solid #444;
                color: #fff;
                border-radius: 4px;
                font-size: 11px;
                padding: 4px 7px;
                width: 130px;
            }
            .template-var-field input:focus {
                outline: none;
                border-color: #888;
            }
            .template-hint {
                font-size: 10px;
                color: #666;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
        adminPages.style.display = "none";
        adminEmail.style.display = "flex";
        let currentUser = null;
        let authReady = false;
        const authReadyPromise = new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                currentUser = user;
                authReady = true;
                init()
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
                throw new Error(json?.error || "Request Failed");
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
        let allUsers = [];
        let selectedUids = new Set();
        let ccEmails = [];
        let bccEmails = [];
        let currentTab = 'write';
        let availableTemplates = [];
        let selectedTemplate = null;
        async function loadTemplates() {
            try {
                const token = await getAuthToken();
                const res = await fetch(`${a}/email/templates`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await res.json();
                if (data.success) {
                    availableTemplates = data.templates;
                    renderTemplatePicker();
                }
            } catch (e) {
                console.warn("Could not load email templates:", e.message);
            }
        }
        function renderTemplatePicker() {
            const sel = document.getElementById('template-select');
            if (!sel) return;
            sel.innerHTML = '<option value="">— No Template (Custom) —</option>' +
                availableTemplates.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
        }
        window.onTemplateChange = function() {
            const sel = document.getElementById('template-select');
            const varsRow = document.getElementById('template-vars-row');
            const varsContainer = document.getElementById('template-vars-container');
            const id = sel.value;
            if (!id) {
                selectedTemplate = null;
                varsRow.classList.remove('visible');
                return;
            }
            selectedTemplate = availableTemplates.find(t => t.id === id) || null;
            if (!selectedTemplate) return;
            document.getElementById('email-subject').value = selectedTemplate.defaultSubject;
            const editableVars = selectedTemplate.vars.filter(v => v !== 'DISPLAYNAME');
            if (editableVars.length) {
                varsContainer.innerHTML = editableVars.map(v => `
                    <div class="template-var-field">
                        <label>{{${v}}}</label>
                        <input type="text" id="tvar-${v}" placeholder="${v}" oninput="window.updateTemplatePreview()" />
                    </div>
                `).join('') + `<span class="template-hint">These Fill Template Variables. {{DISPLAYNAME}} Is Filled Automatically Per Recipient.</span>`;
                varsRow.classList.add('visible');
            } else {
                varsContainer.innerHTML = `<span class="template-hint">No Extra Variables Needed. {{DISPLAYNAME}} Is Filled Automatically Per Recipient.</span>`;
                varsRow.classList.add('visible');
            }
            document.getElementById('email-body').value = `[Using template: ${selectedTemplate.label}]\n\nThis email will use the "${selectedTemplate.id}" server-side template.\nEdit the fields above to customize variables.\n\nYou can still edit the subject line freely.`;
            document.getElementById('email-body').disabled = true;
            document.querySelector('.toolbar').style.pointerEvents = 'none';
            document.querySelector('.toolbar').style.opacity = '0.3';
            updateSendBtn();
        };
        window.clearTemplate = function() {
            document.getElementById('template-select').value = '';
            selectedTemplate = null;
            document.getElementById('template-vars-row').classList.remove('visible');
            document.getElementById('email-body').disabled = false;
            document.getElementById('email-body').value = '';
            document.querySelector('.toolbar').style.pointerEvents = '';
            document.querySelector('.toolbar').style.opacity = '';
            updateSendBtn();
        };
        function getTemplateVars() {
            if (!selectedTemplate) return null;
            const vars = {};
            selectedTemplate.vars.filter(v => v !== 'DISPLAYNAME').forEach(v => {
                const el = document.getElementById(`tvar-${v}`);
                if (el) vars[v] = el.value;
            });
            return vars;
        }
        async function init() {
            await authReady;
            const user = currentUser;
            if (!user) {
                window.location = "/infiniteLogins.html";
                return;
            }
            try {
                const res = await dbGet(`users/${currentUser.uid}/profile`);
                console.log(res);
                if (!res.isOwner) {
                    window.location = "/InfiniteLogins.html";
                    return;
                }
                await loadUsers();
                await loadTemplates();
                injectTemplatePicker();
            } catch (e) {
                window.location = "/InfiniteLogins.html";
            }
        }
        function injectTemplatePicker() {
            const bodyEl = document.getElementById('email-body');
            if (!bodyEl || document.getElementById('template-select')) return;
            const pickerRow = document.createElement('div');
            pickerRow.className = 'template-picker-row';
            pickerRow.innerHTML = `
                <span class="template-picker-label">Template</span>
                <select id="template-select" class="template-picker-select" onchange="window.onTemplateChange()">
                    <option value="">— No Template (Custom) —</option>
                </select>
                <button onclick="window.clearTemplate()" title="Clear template selection" style="background:transparent;border:1px solid #555;color:#aaa;border-radius:5px;padding:4px 9px;font-size:10px;cursor:pointer;">✕ Clear</button>
            `;
            const varsRow = document.createElement('div');
            varsRow.className = 'template-vars-row';
            varsRow.id = 'template-vars-row';
            varsRow.innerHTML = `<div id="template-vars-container" style="display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;"></div>`;
            const toolbar = document.querySelector('.toolbar');
            const parent = toolbar ? toolbar.parentNode : bodyEl.parentNode;
            const insertBefore = toolbar || bodyEl;
            parent.insertBefore(varsRow, insertBefore);
            parent.insertBefore(pickerRow, varsRow);
            renderTemplatePicker();
        }
        async function loadUsers() {
            const res = await dbGet('users');
            parseUsers(res || {});
            renderUserList();
        }
        function parseUsers(usersRaw) {
            allUsers = [];
            for (const [uid, userData] of Object.entries(usersRaw || {})) {
                const profile = userData?.profile || {};
                const settings = userData?.settings || {};
                const email = settings.userEmail || profile.email || null;
                const displayName = profile.displayName || uid;
                const subbed = settings.subbed !== false;
                let role = 'user';
                if (profile.isOwner) role = 'owner';
                else if (profile.isTester) role = 'tester';
                else if (profile.isCoOwner) role = 'coowner';
                else if (profile.isHAdmin) role = 'headadmin';
                else if (profile.isDev) role = 'dev';
                else if (profile.isAdmin) role = 'admin';
                else if (profile.premium3) role = 'p3';
                else if (profile.premium2) role = 'p2';
                else if (profile.premium1) role = 'p1';
                else if (profile.isPartner) role = 'partner';
                else if (profile.verified) role = 'verified';
                allUsers.push({ uid, displayName, email, role, subbed });
            }
            allUsers.sort((a, b) => {
                const rOrder = { owner:0, tester:1, coowner:2, headadmin:3, dev:4, admin:5, p3:6, p2:7, p1:8, partner:9, verified:10, user:11 };
                if (rOrder[a.role] !== rOrder[b.role]) return rOrder[a.role] - rOrder[b.role];
                return a.displayName.localeCompare(b.displayName);
            });
            document.getElementById('user-count').textContent = allUsers.length + ' users';
        }
        window.filterUsers = function() { renderUserList(); };
        function getFilteredUsers() {
            const q = document.getElementById('user-search').value.toLowerCase();
            if (!q) return allUsers;
            return allUsers.filter(u =>
                u.displayName.toLowerCase().includes(q) ||
                (u.email && u.email.toLowerCase().includes(q))
            );
        }
        const roleClass = { owner:'role-owner', tester:'role-tester', coowner:'role-coowner', headadmin:'role-headadmin', dev:'role-dev', admin:'role-admin', p3:'role-p3', p2:'role-p2', p1:'role-p1', partner:'role-partner', verified:'role-verified' };
        function renderUserList() {
            const list = document.getElementById('user-list');
            const filtered = getFilteredUsers();
            if (!filtered.length) {
                list.innerHTML = '<div class="loading-users">No Users Found.</div>';
                return;
            }
            list.innerHTML = filtered.map(u => `
                <div class="user-item ${selectedUids.has(u.uid) ? 'selected' : ''} ${!u.subbed ? 'unsubscribed-user' : ''}" onclick="window.toggleUser('${u.uid}')" style="${!u.subbed ? 'opacity:0.55;' : ''}">
                    <div class="user-checkbox">
                    </div>
                    <div class="user-info">
                        <div class="user-name">
                            ${escHtml(u.displayName)}
                        </div>
                        <div class="user-email">
                            ${u.email ? escHtml(u.email) : '<span style="color:#fbbf24">No Email</span>'}
                        </div>
                    </div>
                    ${!u.subbed ? '<span class="unsub-badge">UNSUBSCRIBED</span>' : ''}
                    ${u.email ? '' : '<span class="no-email-badge">NO EMAIL</span>'}
                    <div class="user-role-dot ${roleClass[u.role] || ''}">
                    </div>
                </div>
            `).join('');
            updateSelectAllBox();
        }
        window.toggleUser = function(uid) {
            if (selectedUids.has(uid)) selectedUids.delete(uid);
            else selectedUids.add(uid);
            renderUserList();
            updateSelectedTags();
            updateSendBtn();
        };
        window.toggleSelectAll = function() {
            const filtered = getFilteredUsers();
            const uidsWithEmail = filtered.filter(u => u.email && u.subbed).map(u => u.uid);
            const allSelected = uidsWithEmail.every(uid => selectedUids.has(uid));
            if (allSelected) {
                uidsWithEmail.forEach(uid => selectedUids.delete(uid));
                document.getElementById('select-all-label').textContent = 'Select All';
            } else {
                uidsWithEmail.forEach(uid => selectedUids.add(uid));
                document.getElementById('select-all-label').textContent = 'Deselect All';
            }
            renderUserList();
            updateSelectedTags();
            updateSendBtn();
        };
        function updateSelectAllBox() {
            const filtered = getFilteredUsers().filter(u => u.email && u.subbed);
            const box = document.getElementById('select-all-box');
            if (!filtered.length) { box.style.background = ''; box.style.borderColor = ''; return; }
        }
        function updateSelectedTags() {
            const container = document.getElementById('selected-tags');
            const selected = allUsers.filter(u => selectedUids.has(u.uid));
            if (!selected.length) {
                container.innerHTML = '<span style="font-size:11px;color:white;">No Recipients Selected</span>';
                return;
            }
            const shown = selected.slice(0, 6);
            const rest = selected.length - shown.length;
            container.innerHTML = shown.map(u => `
                <div class="selected-tag" onclick="window.toggleUser('${u.uid}')" title="${escHtml(u.email || 'No Email')}">
                    ${escHtml(u.displayName)} 
                    <span class="remove">
                        ✕
                    </span>
                </div>
            `).join('') + (rest > 0 ? `<span style="font-size:11px;color:white;">+${rest} More</span>` : '');
        }
        window.handleEmailInput = function(e, type) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const inp = document.getElementById(type + '-input');
                const val = inp.value.replace(/,/g, '').trim();
                if (val && isValidEmail(val)) {
                    if (type === 'cc') { ccEmails.push(val); renderEmailTags('cc'); }
                    else { bccEmails.push(val); renderEmailTags('bcc'); }
                    inp.value = '';
                } else if (val) {
                    showError('Invalid Email: ' + val);
                }
            } else if (e.key === 'Backspace') {
                const inp = document.getElementById(type + '-input');
                if (!inp.value) {
                    if (type === 'cc' && ccEmails.length) { ccEmails.pop(); renderEmailTags('cc'); }
                    else if (type === 'bcc' && bccEmails.length) { bccEmails.pop(); renderEmailTags('bcc'); }
                }
            }
        };
        window.focusCcInput = function() { document.getElementById('cc-input').focus(); };
        window.focusBccInput = function() { document.getElementById('bcc-input').focus(); };
        window.removeEmailTag = function(type, idx) {
            if (type === 'cc') ccEmails.splice(idx, 1);
            else bccEmails.splice(idx, 1);
            renderEmailTags(type);
        };
        function renderEmailTags(type) {
            const arr = type === 'cc' ? ccEmails : bccEmails;
            const container = document.getElementById(type + '-tags');
            const inp = document.getElementById(type + '-input');
            container.innerHTML = arr.map((e, i) => `
                <span class="email-tag">
                    ${escHtml(e)}
                    <span class="rm" onclick="window.removeEmailTag('${type}',${i})">
                        ✕
                    </span>
                </span>
            `).join('');
            container.appendChild(inp);
        }
        window.wrapText = function(before, after) {
            const ta = document.getElementById('email-body');
            const start = ta.selectionStart, end = ta.selectionEnd;
            const sel = ta.value.slice(start, end);
            ta.value = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
            ta.selectionStart = start + before.length;
            ta.selectionEnd = end + before.length;
            ta.focus();
        };
        window.insertLine = function(prefix) {
            const ta = document.getElementById('email-body');
            const start = ta.selectionStart;
            const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
            ta.value = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
            ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
            ta.focus();
        };
        window.insertDisplayName = function() {
            const ta = document.getElementById('email-body');
            const start = ta.selectionStart;
            const placeholder = '{{DISPLAYNAME}}';
            ta.value = ta.value.slice(0, start) + placeholder + ta.value.slice(start);
            ta.selectionStart = ta.selectionEnd = start + placeholder.length;
            ta.focus();
        };
        window.switchTab = function(tab) {
            currentTab = tab;
            document.getElementById('tab-write').classList.toggle('active', tab === 'write');
            document.getElementById('tab-preview').classList.toggle('active', tab === 'preview');
            document.getElementById('email-body').style.display = tab === 'write' ? '' : 'none';
            document.querySelector('.toolbar').style.display = tab === 'write' ? '' : 'none';
            const preview = document.getElementById('email-preview');
            preview.style.display = tab === 'preview' ? '' : 'none';
            if (tab === 'preview') {
                const body = document.getElementById('email-body').value;
                const sampleName = selectedUids.size > 0
                    ? allUsers.find(u => selectedUids.has(u.uid))?.displayName || 'User'
                    : 'User';
                preview.innerHTML = renderEmailBodyPreview(body, sampleName);
            }
        };
        function renderEmailBodyPreview(body, displayName) {
            return body
                .replace(/\{\{DISPLAYNAME\}\}/g, `<strong style="color:var(--accent2)">${escHtml(displayName)}</strong>`)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                .replace(/\n---\n/g, '<hr style="border:none;border-top:1px solid #232730;margin:12px 0;">')
                .replace(/^# (.+)$/gm, '<h1 style="font-family:Syne,sans-serif;font-size:18px;margin:8px 0;">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 style="font-family:Syne,sans-serif;font-size:14px;margin:8px 0;">$1</h2>')
                .replace(/^- (.+)$/gm, '• $1')
                .replace(/\n/g, '<br>');
        }
        function buildEmailHtml(body, displayName) {
            const rendered = body
                .replace(/\{\{DISPLAYNAME\}\}/g, escHtml(displayName))
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                .replace(/\n---\n/g, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">')
                .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:12px 0;">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;margin:10px 0;">$1</h2>')
                .replace(/^- (.+)$/gm, '• $1')
                .replace(/\n/g, '<br>');
            return `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                    </head>
                    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
                            <tr>
                                <td align="center">
                                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                                        <tr>
                                            <td style="padding:0;background:#0a0b0d;height:4px;">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:28px 32px;font-size:15px;line-height:1.7;color:#1e293b;">
                                                ${rendered}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="color:lime;text-decoration:underline;">
                                                <a href="https://www.infinitecampus.xyz/InfiniteAccounts.html?unsub=true">
                                                    Unsubscribe
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
            `;
        }
        function updateSendBtn() {
            const btn = document.getElementById('send-btn');
            const recipientsWithEmail = allUsers.filter(u => selectedUids.has(u.uid) && u.email && u.subbed).length;
            const hasRecipients = selectedUids.size > 0;
            btn.disabled = !hasRecipients || recipientsWithEmail === 0;
            const info = document.getElementById('send-info');
            if (!hasRecipients) {
                info.innerHTML = 'Select Recipients To Send.';
            } else {
                const noEmail = allUsers.filter(u => selectedUids.has(u.uid) && !u.email).length;
                const unsubbed = allUsers.filter(u => selectedUids.has(u.uid) && u.email && !u.subbed).length;
                info.innerHTML = `
                    <strong>
                        ${recipientsWithEmail}
                    </strong>
                    Email${recipientsWithEmail !== 1 ? 's' : ''} To Send
                ` +
                (noEmail ? ` <span style="color:#fbbf24">(${noEmail} Skipped — No Email)</span>` : '') +
                (unsubbed ? ` <span style="color:#f87171">(${unsubbed} Skipped — Unsubscribed)</span>` : '') +
                (recipientsWithEmail > 1 ? ` · 5s Delay Between Each Send` : '');
            }
        }
        window.sendEmails = async function() {
            const subject = document.getElementById('email-subject').value.trim();
            const isTemplate = !!selectedTemplate;
            const body = isTemplate ? '' : document.getElementById('email-body').value.trim();
            if (!subject) { showError('Subject Is Required'); return; }
            if (!isTemplate && !body) { showError('Body Is Required'); return; }
            const recipients = allUsers.filter(u => selectedUids.has(u.uid) && u.email && u.subbed);
            if (!recipients.length) { showError('No Recipients With Email Addresses'); return; }
            const baseTemplateVars = isTemplate ? getTemplateVars() : null;
            const modal = document.getElementById('progress-modal');
            const fill = document.getElementById('prog-fill');
            const progText = document.getElementById('prog-text');
            const progCount = document.getElementById('prog-count');
            const progLog = document.getElementById('prog-log');
            const progClose = document.getElementById('prog-close');
            modal.classList.add('active');
            progLog.innerHTML = '';
            progClose.style.display = 'none';
            fill.style.width = '0%';
            let sent = 0, failed = 0;
            for (let i = 0; i < recipients.length; i++) {
                const user = recipients[i];
                progText.textContent = `Sending To ${user.displayName}`;
                progCount.textContent = `${i} / ${recipients.length}`;
                fill.style.width = ((i / recipients.length) * 100) + '%';
                let payload;
                if (isTemplate) {
                    const vars = { ...baseTemplateVars, DISPLAYNAME: user.displayName, EMAIL: user.email, UID: user.uid };
                    payload = { to: user.email, subject, templateName: selectedTemplate.id, templateVars: vars };
                } else {
                    const personalizedBody = body.replace(/\{\{DISPLAYNAME\}\}/g, user.displayName);
                    const htmlBody = buildEmailHtml(body, user.displayName);
                    payload = { to: user.email, subject, html: htmlBody, text: personalizedBody };
                }
                if (ccEmails.length) payload.cc = ccEmails;
                if (bccEmails.length) payload.bcc = bccEmails;
                try {
                    const token = await getAuthToken();
                    const res = await fetch(`${a}/email`, {
                        method: 'POST',
                        headers:{"Content-Type": "application/json","Authorization": "Bearer " + token},
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error || 'Send Failed');
                    sent++;
                    addLog(progLog, `✓ ${user.displayName} <${user.email}>`, 'ok');
                } catch (e) {
                    failed++;
                    addLog(progLog, `✗ ${user.displayName}: ${e.message}`, 'err');
                }
                if (i < recipients.length - 1) {
                    for (let s = 5; s > 0; s--) {
                        progText.textContent = `Next Email In ${s}s...`;
                        await sleep(1000);
                    }
                }
            }
            fill.style.width = '100%';
            progText.textContent = `Done — ${sent} Sent, ${failed} Failed.`;
            progCount.textContent = `${recipients.length} / ${recipients.length}`;
            progClose.style.display = 'block';
            if (sent > 0) showSuccess(`${sent} Email${sent !== 1 ? 's' : ''} Sent Successfully`);
            if (failed > 0) showError(`${failed} Failed To Send`);
        };
        function addLog(container, msg, cls) {
            const span = document.createElement('span');
            span.className = cls;
            span.textContent = msg;
            container.appendChild(span);
            container.scrollTop = container.scrollHeight;
        }
        window.closeProgress = function() {
            document.getElementById('progress-modal').classList.remove('active');
        };
        window.clearComposer = function() {
            document.getElementById('email-subject').value = '';
            document.getElementById('email-body').value = '';
            document.getElementById('email-body').disabled = false;
            document.querySelector('.toolbar').style.pointerEvents = '';
            document.querySelector('.toolbar').style.opacity = '';
            document.getElementById('template-select').value = '';
            document.getElementById('template-vars-row').classList.remove('visible');
            selectedTemplate = null;
            ccEmails = [];
            bccEmails = [];
            renderEmailTags('cc');
            renderEmailTags('bcc');
            showSuccess('Composer Cleared');
        };
        function escHtml(str) {
            return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }
        function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
        document.getElementById('email-body').addEventListener('input', () => {
            if (currentTab === 'preview') window.switchTab('preview');
            updateSendBtn();
        });
        document.getElementById('email-subject').addEventListener('input', updateSendBtn);
    } else {
        adminPages.style.display = 'block';
    }
}