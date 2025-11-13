const AUTO_DELETE_MS = 5 * 60 * 1000;
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };
async function fetchFiles() {
    const res = await fetch("https://included-touched-joey.ngrok-free.app/admin/files", { headers: NGROK_HEADERS });
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
    if (!confirm(`Delete ${filename}?`)) return;
    const res = await fetch(`https://included-touched-joey.ngrok-free.app/admin/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: NGROK_HEADERS
    });
    if (res.ok) fetchFiles();
    else alert("Failed To Delete File");
}
function downloadFile(filename) {
    const link = document.createElement("a");
    link.href = `https://included-touched-joey.ngrok-free.app/files/${encodeURIComponent(filename)}`;
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
    const res = await fetch("https://included-touched-joey.ngrok-free.app/admin/lockdown", {
        method: "POST",
        headers: NGROK_HEADERS
    });
    if (res.ok) {
        const state = await res.json();
        alert("Lockdown Is Now " + (state.lockdown ? "ENABLED" : "DISABLED"));
    } else {
        alert("Failed To Toggle Lockdown");
    }
});
async function fetchLogs() {
    const res = await fetch("https://included-touched-joey.ngrok-free.app/admin/logs", { headers: NGROK_HEADERS });
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
fetchFiles();
fetchLogs();