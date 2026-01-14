let BACKEND = `${a}`;
let applyBK = `${a}`;
let MOVIE_CACHE = [];
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
async function uploadApply() {
    const file = document.getElementById("applyFile").files[0];
    if (!file) return showError("Choose A File");
    const uploadURL = applyBK + "/api/upload_apply_x9a7b2";
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    const bar = document.getElementById("progressBar");
    const container = document.getElementById("progressContainer");
    container.style.display = "block";
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const res = await fetch(uploadURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                "fileId": fileId,
                "chunkIndex": i,
                "totalChunks": totalChunks,
                "filename": file.name,
                "ngrok-skip-browser-warning": "true"
            },
            body: chunk
        });
        const data = await res.json();
        if (!data.ok) {
            document.getElementById("upload-status").innerText =
                "Upload Failed: " + data.message;
            return;
        }
        const percent = Math.round(((i + 1) / totalChunks) * 100 -1);
        bar.style.width = percent + "%";
        bar.innerText = percent + "%";
    }
    document.getElementById("upload-status").innerText =
        "Uploaded: " + file.name;
    setTimeout(() => {
        container.style.display = "none";
        bar.style.width = "0%";
        bar.innerText = "";
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
        renderMovies(data.videos);
    } catch (e) {
        box.innerHTML = "Could Not Reach Server.";
    }
}
function renderMovies(list) {
    const box = document.getElementById("movies");
    box.innerHTML = "";
    list.forEach(v => {
        const dlURL = `${BACKEND}/download/x9a7b2/${v.name}`;
        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `
            <b>${v.name}</b> — ${v.humanSize}<br><br>
            <button class="button" onclick="openWatchPanel('${v.name}')">Watch</button>
            <a href="${dlURL}">
                <button class="button">Download</button>
            </a>
        `;
        box.appendChild(div);
    });
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
    player.pause();
    player.src = "";
    panel.style.display = "none";
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
checkNetworkSpeed();
setInterval(checkNetworkSpeed, 5000);