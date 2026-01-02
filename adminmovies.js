let BACKEND = `${a}`;
const socket = io(BACKEND, { 
    path: "/socket_io_realtime_x9a7b2",
    extraHeaders: { "ngrok-skip-browser-warning": "true" }
});
socket.on("connect", () => console.log("Server Connected:", socket.id));
socket.on("jobLog", data => appendLog(data.text));
socket.on("jobProgress", data => {
    if (data.percent !== undefined) {
        const bar = document.getElementById("acceptProgressBar");
        const wrap = document.getElementById("acceptProgress");
        wrap.style.display = "block";
        bar.style.width = data.percent + "%";
        let label = `${Math.floor(data.percent)}%`;
        if (data.remainingSec !== undefined) {
            label += ` — ${formatTime(data.remainingSec)} Left`;
        }
        bar.innerText = label;
    }
    if (data.text) appendLog(data.text);
});
socket.on("jobError", data => {
    appendLog("ERROR: " + data.message);
    hideAcceptProgress();
});
socket.on("jobStarted", data => {
    appendLog(`Accept Started: ${data.filename}`);
    showAcceptProgress();
});
socket.on("jobDone", data => {
    showSuccess(`File Accepted: ${data.finalName}`);
    appendLog(`✔ Accept Completed: ${data.finalName}`);
    hideAcceptProgress();
});
async function loadApply() {
    const box = document.getElementById("applyList");
    box.innerHTML = "Loading...";
    const res = await fetch(BACKEND + "/api/list_apply_x9a7b2", {
        headers: { "ngrok-skip-browser-warning": "true" }
    });
    const data = await res.json();
    if (!data.ok) {
        box.innerHTML = "Failed To Load Applicants";
        return;
    }
    box.innerHTML = "";
    data.list.forEach(f => {
        if (isCopyFile(f.file)) return;
        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `
            <b>${f.file}</b> — ${f.humanSize}<br><br>
            <button class="button" onclick="watchApply('${f.file}')">Watch</button>
            <button class="button" onclick="deleteApply('${f.file}')">Delete</button>
            <button class="button" onclick="acceptFile('${f.file}')">Accept</button>
            <div class="file-progress" id="progress-wrap-${f.file}" style="display:none;margin-top:8px;">
                <div class="file-progress-bar" id="progress-bar-${f.file}" style="width:0%;background:#4caf50;padding:2px;font-size:12px;">
                    0%
                </div>
            </div>
        `;
        box.appendChild(div);
    });
    data.list.forEach(f => {
        if (is360File(f.file)) {
            startProgressPolling(f.file);
        }
    });
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
const progressIntervals = new Map();
function startProgressPolling(filename) {
    if (progressIntervals.has(filename)) return;
    const wrap = document.getElementById(`progress-wrap-${filename}`);
    const bar = document.getElementById(`progress-bar-${filename}`);
    if (!wrap || !bar) return;
    const pollFilename = is360File(filename)
        ? getCopyNameFrom360(filename)
        : filename;
    const poll = async () => {
        try {
            const res = await fetch(
                BACKEND + "/accept_status/" + encodeURIComponent(pollFilename),
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const data = await res.json();
            if (!data.exists || data.status === "idle") {
                wrap.style.display = "none";
                stopProgressPolling(filename);
                return;
            }
            wrap.style.display = "block";
            const percent = data.percent ?? 0;
            bar.style.width = percent + "%";
            let label = `${percent}%`;
            if (data.remainingSec != null) {
                label += ` — ${formatTime(data.remainingSec)} left`;
            }
            bar.innerText = label;
            if (data.status === "completed" || data.status === "error") {
                stopProgressPolling(filename);
            }
        } catch (e) {
            console.error("Progress Poll Failed", e);
        }
    };
    poll();
    const id = setInterval(poll, 2000);
    progressIntervals.set(filename, id);
}
function stopProgressPolling(filename) {
    const id = progressIntervals.get(filename);
    if (id) {
        clearInterval(id);
        progressIntervals.delete(filename);
    }
}
function watchApply(filename) {
    const url = BACKEND + "/apply_stream_x9a7b2/" + filename;
    const vidplay = document.getElementById("videoPlayer");
    document.getElementById("before").style.display = "none";
    vidplay.src = url;
    vidplay.style.height = "50vh";
    vidplay.style.width = "min-content";
    document.getElementById("logs").style.display = "none";
    document.getElementById("watchPanel").style.display = "flex";
}
function closeWatch() {
    document.getElementById("videoPlayer").pause();
    document.getElementById("videoPlayer").src = "";
    document.getElementById("watchPanel").style.display = "none";
    document.getElementById("before").style.display = "block";
}
async function deleteApply(filename) {
    if (!confirm("Delete " + filename + "?")) return;
    const res = await fetch(BACKEND + "/api/delete_apply_x9a7b2", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ filename })
    });
    const data = await res.json();
    if (data.ok) {
        alert("Deleted.");
        loadApply();
    } else {
        alert("Failed: " + data.message);
    }
}
function acceptFile(filename) {
    const newName = prompt("Enter Name:", filename.replace(".mp4", ""));
    if (!newName) return;
    startProgressPolling(filename);
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
loadApply();