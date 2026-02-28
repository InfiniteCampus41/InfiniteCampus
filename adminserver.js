import { auth, db, onAuthStateChanged, ref, get, set, forceWebSockets } from "./imports.js";
forceWebSockets();
let currentUser = null;
let isAuthInitialized = false;
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
    const userRef = ref(db, `users/${uid}/profile`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
        showError("Profile Data Not Found.");
        return false;
    }
    const userData = snapshot.val();
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
const loaderBtn = document.createElement("button");
loaderBtn.className = "button";
loaderBtn.id = "loaderConfigBtn";
loaderBtn.textContent = "Loader Config";
document.getElementById("lockdowndisc").after(loaderBtn);
const loaderPanel = document.createElement("div");
loaderPanel.id = "loaderPanel";
loaderPanel.style.display = "none";
loaderPanel.style.position = "fixed";
loaderPanel.style.top = "50%";
loaderPanel.style.left = "50%";
loaderPanel.style.transform = "translate(-50%, -50%)";
loaderPanel.style.background = "#111";
loaderPanel.style.padding = "20px";
loaderPanel.style.border = "1px solid #444";
loaderPanel.style.zIndex = "9999";
loaderPanel.style.width = "300px";
loaderPanel.style.borderRadius = "20px";
loaderPanel.innerHTML = `
    <h3 class="btxt">Mode</h3>
    <select class="button" id="loaderModeSelect" style="width:100%; margin-bottom:10px;">
        <option value="infinite">Infinite</option>
        <option value="time">Time</option>
        <option value="auto">Auto</option>
        <option value="maint">Maint</option>
    </select>
    <label class="btxt">Message</label>
    <input class="button" id="loaderMessageInput" type="text" placeholder="Message" style="width:100%; margin-bottom:10px;" />
    <button class="button" id="saveLoaderConfig">Save</button>
    <button class="button" id="closeLoaderPanel" style="margin-top:10px;">Close</button>
`;
document.body.appendChild(loaderPanel);
loaderBtn.addEventListener("click", async () => {
    if (!await checkPermissions()) return;
    await loadLoaderConfig();
    loaderPanel.style.display = "block";
});
document.getElementById("closeLoaderPanel").addEventListener("click", () => {
    loaderPanel.style.display = "none";
});
document.getElementById("saveLoaderConfig").addEventListener("click", async () => {
    if (!await checkPermissions()) return;
    const mode = document.getElementById("loaderModeSelect").value;
    const message = document.getElementById("loaderMessageInput").value.trim();
    try {
        await set(ref(db, "site/loader"), {
            mode: mode,
            message: message
        });
        showSuccess("Loader Configuration Saved.");
        loaderPanel.style.display = "none";
    } catch (err) {
        showError("Failed To Save Loader Configuration.");
        console.error(err);
    }
});
async function loadLoaderConfig() {
    try {
        const snapshot = await get(ref(db, "site/loader"));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const modeSelect = document.getElementById("loaderModeSelect");
            const messageInput = document.getElementById("loaderMessageInput");
            modeSelect.value = data.mode || "auto";
            messageInput.value = data.message || "";
        } else {
            document.getElementById("loaderModeSelect").value = "auto";
            document.getElementById("loaderMessageInput").value = "";
        }
    } catch (err) {
        console.error("Failed To Load Loader Config:", err);
    }
}
async function fetchLogs() {
    if (!await checkPermissions()) return;
    const res = await adminFetch(`${a}/admin/logs`, { headers: NGROK_HEADERS });
    if (!res.ok) return;
    const logs = await res.json();
    const logsContainer = document.getElementById("logs");
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