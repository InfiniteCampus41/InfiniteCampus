import { auth, db, ref, get } from "/firebase.js";
let BACKEND = `${a}`;
let applyBK = `${a}`;
let MOVIE_CACHE = [];
let finishingTimeout = null;
const currentfile = document.getElementById("currentFile");
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
    if (!name) return "User";
    return name
        .normalize("NFKD")
        .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "")
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "")
        .trim() || "User";
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
        if (percent >= 99) {
            bar.style.width = "99%";
            percentText.innerText = "Finishing Up, This May Take A While";
            const uploadText = document.getElementById("uploadingText");
            uploadText.style.display = "none";
            let finishingTimeout = setTimeout(() => {
                percentText.innerText = "Uploaded!";
                showSuccess('Uploaded File Successfully');
            }, 120000);
        } else {
            bar.style.width = percent + "%";
            percentText.innerText = percent + "%";
        }
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
}
async function loadMovies() {
    const url = BACKEND + "/api/list_videos_x9a7b2";
    const box = document.getElementById("movies");
    box.innerHTML = "Loading...";
    try {
        const res = await fetch(url, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        const data = await res.json();
        if (!data.ok) {
            box.innerHTML = "Failed To Load Movies";
            return;
        }
        MOVIE_CACHE = data.videos;
        await renderMovies(data.videos);
    } catch (e) {
        showError("Failed To Load Movies, Check Server Status")
        box.innerHTML = "Could Not Reach Server.";
    }
}
async function renderMovies(list) {
    const box = document.getElementById("movies");
    box.innerHTML = "Loading...";
    box.innerHTML = "";
    for (const v of list) {
        const dlURL = `${BACKEND}/download/x9a7b2/${v.name}`;
        let uploaderName = "User";
        if (v.uploadedBy && v.uploadedBy !== "") {
            try {
                const snap = await get(
                    ref(db, "users/" + v.uploadedBy + "/profile/displayName")
                );
                if (snap.exists()) {
                    uploaderName = snap.val();
                }
            } catch (err) {
                console.error("Failed To Fetch Uploader Name:", err);
            }
        }
        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `
            <div style="display:inline-flex; width:100%;">
                <span style="width:100%; text-align:center">
                    <b>
                        ${v.name}
                    </b> 
                    — 
                    ${v.humanSize}
                </span>
                <span id="upByIcon" style="width:0; margin-left:-20px;">
                    <i class="bi bi-question-circle" title="Uploaded By: @${uploaderName}">
                    </i>
                </span>
            </div>
            <br>
            <br>
            <button class="button" onclick="openWatchPanel('${v.name}')">
                Watch
            </button>
            <a href="${dlURL}">
                <button class="button">
                    Download
                </button>
            </a>
            <br>
            <small id="upByTxt" style="display:none;">
                Uploaded By: @${uploaderName}
            </small>
        `;
        box.appendChild(div);
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