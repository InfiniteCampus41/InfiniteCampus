import { auth, db, ref, get } from "/imports.js";
let BACKEND = `${a}`;
let applyBK = `${a}`;
let MOVIE_CACHE = [];
let finishingTimeout = null;
let FIREBASE_AVAILABLE = true;
let MOVIE_LOAD_ID = 0;
let lastUploadTime = Date.now();
let currentlyOpenActions = null;
let finishingWatcher = null;
const currentfile = document.getElementById("currentFile");
const movies = document.getElementById("movies");
const section = document.getElementById("section");
document.getElementById("applyFile").addEventListener("change", () => {
    const file = document.getElementById("applyFile").files[0];
    const label = document.getElementById("selectedFileName");
    if (file) {
        label.innerText = "Selected: " + file.name;
    } else {
        label.innerText = "";
    }
});
function sanitizeUsername(name) {
    if (!name) return "An Anonymous User";
    return name
        .normalize("NFKD")
        .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "")
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "")
        .trim() || "An Anonymous User";
}
async function uploadApply() {
    const file = document.getElementById("applyFile").files[0];
    if (!file) return showError("Choose A File");
    const uploadURL = applyBK + "/api/upload_apply_x9a7b2";
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    const bar = document.getElementById("progressBar");
    const container = document.getElementById("progressContainer");
    const percentText = document.getElementById("progressPercent");
    const uploadingText = document.getElementById("uploadingText");
    container.style.display = "block";
    let dotCount = 0;
    const dotInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        uploadingText.innerText = "Uploading" + " .".repeat(dotCount);
    }, 500);
    finishingWatcher = setInterval(() => {
        const now = Date.now();
        if (now - lastUploadTime > 1500) {
            percentText.innerText = "Finishing Up, This May Take A While";
            document.getElementById("uploadingText").style.display = "none";
            clearInterval(finishingWatcher);
        }
    }, 300);
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const currentUser = auth.currentUser;
        let displayName = "User";
        let uid = "unknown";
        if (currentUser) {
            uid = currentUser.uid;
            try {
                const snap = await get(ref(db,"users/" + uid + "/profile/displayName"));
                if (snap.exists()) {
                    displayName = sanitizeUsername(snap.val());
                }
            } catch (err) {
                console.error("Failed To Fetch DisplayName:", err);
            }
        }
        const res = await fetch(uploadURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                fileId: fileId,
                chunkIndex: i,
                totalChunks: totalChunks,
                filename: file.name,
                uploadedBy: displayName,
                "x-user-id": uid,
                "ngrok-skip-browser-warning": "true"
            },
            body: chunk
        });
        const data = await res.json();
        lastUploadTime = Date.now();
        if (!data.ok) {
            clearInterval(dotInterval);
            if (finishingTimeout) clearTimeout(finishingTimeout);
            percentText.innerText = "Uploaded!";
            document.getElementById("upload-status").innerText =
                "Upload Failed: " + data.message;
            return;
        }
        let percent = Math.round(((i + 1) / totalChunks) * 100);
        if (percent < 1) percent = 0;
        bar.style.width = percent + "%";
        percentText.innerText = percent + "%";
    }
    clearInterval(dotInterval);
    uploadingText.innerText = "";
    if (finishingTimeout) clearTimeout(finishingTimeout);
    percentText.innerText = "Uploaded!";
    document.getElementById("upload-status").innerText =
        "Uploaded: " + file.name;
    setTimeout(() => {
        container.style.display = "none";
        bar.style.width = "0%";
        percentText.innerText = "";
    }, 1000);
    loadMovies();
    if (finishingWatcher) clearInterval(finishingWatcher);
}
async function loadMovies() {
    const url = BACKEND + "/api/list_videos_x9a7b2";
    const box = document.getElementById("movies");
    const loadId = ++MOVIE_LOAD_ID;
    box.innerHTML = "Loading...";
    try {
        const res = await fetch(url, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        const data = await res.json();
        if (loadId !== MOVIE_LOAD_ID) return;
        if (!data.ok) {
            box.innerHTML = "Failed To Load Movies";
            return;
        }
        MOVIE_CACHE = data.videos;
        await renderMovies(data.videos, loadId);
    } catch (e) {
        if (loadId !== MOVIE_LOAD_ID) return;
        showError("Failed To Load Movies, Check Server Status");
        box.innerHTML = "Could Not Reach Server.";
    }
}
function fitTextToWidth(element, maxFont = 16, minFont = 8) {
    let fontSize = maxFont;
    element.style.fontSize = fontSize + "px";
    while (element.scrollWidth > element.clientWidth && fontSize > minFont) {
        fontSize -= 0.5;
        element.style.fontSize = fontSize + "px";
    }
}
async function renderMovies(list, loadId = MOVIE_LOAD_ID) {
    const box = document.getElementById("movies");
    box.innerHTML = "";
    for (const v of list) {
        if (loadId !== MOVIE_LOAD_ID) return;
        let uploaderName = "";
        if (FIREBASE_AVAILABLE && v.uploadedBy && v.uploadedBy !== "") {
            try {
                const snap = await get(
                    ref(db, "users/" + v.uploadedBy + "/profile/displayName")
                );
                if (snap.exists()) {
                    uploaderName = `@${snap.val()}`;
                    showUploader = true;
                }
            } catch (err) {
                console.error("Firebase Connection Failed:", err);
                FIREBASE_AVAILABLE = false;
            }
        }
        const movieDiv = document.createElement("div");
        movieDiv.className = "movie-card";
        movieDiv.style.width = "200px";
        movieDiv.style.height = "300px";
        movieDiv.style.backgroundSize = "cover";
        movieDiv.style.backgroundPosition = "center";
        movieDiv.style.cursor = "pointer";
        movieDiv.style.position = "relative";
        movieDiv.style.marginBottom = "20px";
        movieDiv.style.color = "white";
        movieDiv.style.borderRadius = "12px";
        movieDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
        movieDiv.innerHTML = `
            <img src="${v.cover || ""}" alt="${v.name} Cover" style="height:300px;width:200px;border-radius:12px;position:absolute;z-index:3;display:flex;" />
            <div class="movie-actions" style="height:100%;width:100%;opacity:0;pointer-events:none;position:absolute;z-index:4;display:flex;flex-direction:column;transition:opacity 0.3s ease;">
                <div style="top:0px;position:absolute;width:100%;justify-content:center;align-items:center;display:flex;padding:0px 10px;background:rgba(0,0,0,0.8);height:40px;flex-direction:column;border-top-left-radius:12px;border-top-right-radius:12px;">
                    <span class="movie-title" style="display:block;width:100%;white-space:nowrap;">
                        ${v.name}
                    </span>
                    <small style=font-size:0.7em;">
                        ${v.humanSize}
                    </small>
                </div>
                <div style="bottom:0px;position:absolute;width:100%;display:flex;padding:0px 10px;background:rgba(0,0,0,0.8);height:40px;align-items:center;flex-direction:column;height:60px;border-bottom-left-radius:12px;border-bottom-right-radius:12px;">
                    <div style=padding:3px;display:flex;justify-content:space-between;width:100%;">
                        <button class="button watch-btn">
                            Watch
                        </button>
                        <a href="${BACKEND}/download/x9a7b2/${v.name}" target="_blank">
                            <button class="button download-btn">
                                Download
                            </button>
                        </a>
                    </div>
                    <small style="font-size:0.7em;color:#ccc;margin-top:-3px;">
                        <a href="InfiniteAccounts.html?user=${v.uploadedBy}" style="text-decoration:none;">
                            Uploaded By: ${uploaderName}
                        </a>
                    </small>
                </div>
            </div>
        `;
        movieDiv.addEventListener("click", (e) => {
            const actions = movieDiv.querySelector(".movie-actions");
            if (currentlyOpenActions && currentlyOpenActions !== actions) {
                currentlyOpenActions.style.opacity = "0";
                currentlyOpenActions.style.pointerEvents = "none";
            }
            const isOpen = actions.style.opacity === "1";
            if (isOpen) {
                actions.style.opacity = "0";
                actions.style.pointerEvents = "none";
                currentlyOpenActions = null;
            } else {
                actions.style.opacity = "1";
                actions.style.pointerEvents = "auto";
                currentlyOpenActions = actions;
            }
        });
        movieDiv.querySelector(".watch-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openWatchPanel(v.name);
        });
        box.appendChild(movieDiv);
        const titleEl = movieDiv.querySelector(".movie-title");
        fitTextToWidth(titleEl);
    }
}
function filterMovies() {
    const term = document.getElementById("search").value.toLowerCase();
    const filtered = MOVIE_CACHE.filter(m =>
        m.name.toLowerCase().includes(term)
    );
    renderMovies(filtered);
}
function openWatchPanel(name) {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const before = document.getElementById("before");
    const streamURL = BACKEND + "/movies/x9a7b2/" + name;
    section.style.display = "none";
    movies.style.display = "none";
    before.style.display = "none";
    currentfile.textContent = `Currently Watching: ${name}`
    currentfile.style.display = "block";
    player.src = streamURL;
    player.play();
    panel.style.display = "flex";
}
function closeWatchPanel() {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const before = document.getElementById("before");
    player.pause();
    player.src = "";
    panel.style.display = "none";
    before.style.display = "block";
    currentfile.style.display = "none";
    currentfile.textContent = "";
    section.style.display = "block";
    movies.style.display = "flex";
}
document.addEventListener("keydown", (e) => {
    const video = document.getElementById("watchVideo");
    const panel = document.getElementById("watchPanel");
    if (panel.style.display !== "flex") return;
    switch (e.key.toLowerCase()) {
        case "f":
            if (!document.fullscreenElement) {
                video.requestFullscreen().catch(err => console.log(err));
            } else {
                document.exitFullscreen();
            }
            break;
        case "m":
            video.muted = !video.muted;
            break;
        case "arrowright":
            video.currentTime += 5;
            break;
        case "arrowleft":
            video.currentTime -= 5;
            break;
        case "arrowup":
            video.volume = Math.min(1, video.volume + 0.05);
            break;
        case "arrowdown":
            video.volume = Math.max(0, video.volume - 0.05);
            break;
    }
});
loadMovies();
const networkWarning = document.getElementById("networkWarning");
const SPEED_THRESHOLD_MS = 750;
async function checkNetworkSpeed() {
    const testURL = BACKEND + "/api/list_videos_x9a7b2";
    const start = performance.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        await fetch(testURL, { signal: controller.signal });
        clearTimeout(timeout);
        const duration = performance.now() - start;
        if (duration > SPEED_THRESHOLD_MS) {
            networkWarning.style.display = "block";
        } else {
            networkWarning.style.display = "none";
        }
    } catch (err) {
        networkWarning.style.display = "block";
    }
}
window.openWatchPanel = openWatchPanel;
window.closeWatchPanel = closeWatchPanel;
window.loadMovies = loadMovies;
window.filterMovies = filterMovies;
window.uploadApply = uploadApply;
checkNetworkSpeed();
setInterval(checkNetworkSpeed, 5000);