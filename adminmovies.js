import { io, auth, db, onAuthStateChanged, ref, get, forceWebSockets } from "./imports.js";
forceWebSockets();
const expandEdit = document.getElementById('expandMoviesOrder');
const editOrderContainer = document.getElementById('editMoviesContainer');
const progressCache = new Map();
let isOpen = false;
const fileElements = new Map();
expandEdit.addEventListener("click", function () {
    if (isOpen) {
        editOrderContainer.style.right = '-500px';
        expandEdit.style.right = '-2px';
        expandEdit.innerHTML = '<i class="bi bi-chevron-left"></i>';
        isOpen = false;
        editOrderContainer.style.display = 'none';
    } else {
        editOrderContainer.style.right = '-2px';
        expandEdit.style.right = '496px';
        expandEdit.innerHTML = '<i class="bi bi-chevron-right"></i>';
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
            const userProfileRef = ref(db, `/users/${uid}/profile`);
            const profileSnapshot = await get(userProfileRef);
            if (!profileSnapshot.exists() || !(profileSnapshot.val().isOwner || profileSnapshot.val().isTester || profileSnapshot.val().isCoOwner || profileSnapshot.val().isHAdmin || profileSnapshot.val().isDev)) {
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
                const snap = await get(ref(db, `/users/${uploaderId}/profile/displayName`));
                if (snap.exists()) uploaderName = snap.val();
            } catch {}
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
                    order: data.order,
                    uploadedBy: data.uploadedBy,
                    db_id: data.db_id,
                    cover: data.cover
                }))
                .sort((a, b) => a.order - b.order);
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
    moviesData.forEach((movie, index) => {
        const item = document.createElement("div");
        item.className = "movie-item";
        item.draggable = true;
        item.dataset.index = index;
        item.innerHTML = `
            <span class="drag-handle"><i class="bi bi-grip-vertical"></i></span>
            <span class="movie-name" data-index="${index}">${movie.filename}</span>
        `;
        addDragEvents(item);
        const nameEl = item.querySelector(".movie-name");
        nameEl.addEventListener("click", (e) => {
            e.stopPropagation();
            openMovieEditor(index);
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
    const newOrder = [];
    items.forEach(item => {
        const index = parseInt(item.dataset.index);
        newOrder.push(moviesData[index]);
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
            formatted[movie.filename] = {
                order: (index + 1) * 10,
                uploadedBy: movie.uploadedBy || "jiEcu7wSifMalQxVupmQXRchA9k1",
                db_id: movie.db_id,
                cover: movie.cover
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