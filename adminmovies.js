import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, ref, get, forceWebSockets } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { firebaseConfig } from "./firebase.js";
forceWebSockets();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
let BACKEND = `https://api.infinitecampus.xyz`;
let ADMIN_PASS = sessionStorage.getItem("a_pass") || null;
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
            sessionStorage.removeItem("a_pass");
            ADMIN_PASS = null;
        }
        const entered = prompt("Enter Admin Password:");
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
                sessionStorage.setItem("a_pass", ADMIN_PASS);
                return true;
            }
        } catch (e) {}
        alert("Incorrect Password.");
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
                alert('You Must Be Logged In To View This Content.');
                resolve(false);
                return;
            }
            const uid = user.uid;
            const userProfileRef = ref(db, `/users/${uid}/profile`);
            const profileSnapshot = await get(userProfileRef);
            if (!profileSnapshot.exists() || !(profileSnapshot.val().isOwner || profileSnapshot.val().isTester || profileSnapshot.val().isCoOwner)) {
                alert('You Do Not Have The Necessary Permissions To View Or Interact With This Content.');
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
async function loadApply() {
    const isAuthenticated = await checkUserAuthentication();
    if (!isAuthenticated) return;
    const box = document.getElementById("applyList");
    box.innerHTML = "Loading...";
    const res = await adminFetch(BACKEND + "/api/list_apply_x9a7b2", {
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
async function deleteApply(filename) {
    const isAuthenticated = await checkUserAuthentication();
    if (!isAuthenticated) return;
    if (!confirm("Delete " + filename + "?")) return;
    const res = await adminFetch(BACKEND + "/api/delete_apply_x9a7b2", {
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
async function acceptFile(filename) {
    const isAuthenticated = await checkUserAuthentication();
    if (!isAuthenticated) return;
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
function handleJobProgress(data) {
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
    video.src = `${BACKEND}/api/watch_apply_x9a7b2/${encodeURIComponent(filename)}`;
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
    appendLog(`✔ Accept Completed: ${data.finalName}`);
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
(async () => {
    await verifyAdminPassword();
    loadApply();
})();
window.acceptFile = acceptFile;
window.loadApply = loadApply;
window.deleteApply = deleteApply;
window.watchApply = watchApply;
window.closeWatch = closeWatch;