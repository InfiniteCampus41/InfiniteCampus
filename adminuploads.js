const AUTO_DELETE_MS = 5 * 60 * 1000;
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

async function fetchFiles() {
    const res = await fetch("http://localhost:4000/admin/files", { headers: NGROK_HEADERS });
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
                <button onclick="downloadFile('${f.name}')">Download</button>
                <button onclick="deleteFile('${f.name}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteFile(filename) {
    if (!confirm(`Delete ${filename}?`)) return;
    const res = await fetch(`http://localhost:4000/admin/files/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: NGROK_HEADERS
    });
    if (res.ok) fetchFiles();
    else alert("Failed To Delete File");
}

function downloadFile(filename) {
    const link = document.createElement("a");
    link.href = `http://localhost:4000/files/${encodeURIComponent(filename)}`;
    link.download = filename;
    link.click();
}

function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return bytes.toFixed(1) + " " + units[i];
}

// --- LOCKDOWN TOGGLE ---
document.getElementById("lockdownBtn").addEventListener("click", async () => {
    const res = await fetch("http://localhost:4000/admin/lockdown", {
        method: "POST", // Assuming POST toggles lockdown
        headers: NGROK_HEADERS
    });
    if (res.ok) {
        const state = await res.json(); // assuming {lockdown: true/false}
        alert("Lockdown is now " + (state.lockdown ? "ENABLED" : "DISABLED"));
    } else {
        alert("Failed to toggle lockdown");
    }
});

// --- FETCH LOGS ---
// --- FETCH LOGS ---
async function fetchLogs() {
    const res = await fetch("http://localhost:4000/admin/logs", { headers: NGROK_HEADERS });
    if (!res.ok) return;
    const logs = await res.json(); // Now expecting JSON

    // Clear previous logs
    const logsContainer = document.getElementById("logs");
    logsContainer.innerHTML = "";

    // Helper to format timestamp
    const formatTime = ts => {
        const d = new Date(ts);
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    // --- Upload Logs ---
    const uploadSection = document.createElement("div");
    uploadSection.innerHTML = "<h3>Upload Logs</h3>";
    if (logs.uploadLogs?.length) {
        const ul = document.createElement("ul");
        logs.uploadLogs.forEach(l => {
            const li = document.createElement("li");
            li.textContent = `[${formatTime(l.timestamp)}] ${l.message}`;
            ul.appendChild(li);
        });
        uploadSection.appendChild(ul);
    } else {
        uploadSection.innerHTML += "<p>No upload logs</p>";
    }
    logsContainer.appendChild(uploadSection);

    // --- Rate Limit Logs ---
    const rateSection = document.createElement("div");
    rateSection.innerHTML = "<h3>Rate Limit Logs</h3>";
    if (logs.rateLimitLogs?.length) {
        const ul = document.createElement("ul");
        logs.rateLimitLogs.forEach(l => {
            const li = document.createElement("li");
            li.textContent = `[${formatTime(l.timestamp)}] ${l.message}`;
            ul.appendChild(li);
        });
        rateSection.appendChild(ul);
    } else {
        rateSection.innerHTML += "<p>No rate limit logs</p>";
    }
    logsContainer.appendChild(rateSection);

    // --- Active Links ---
    const linksSection = document.createElement("div");
    linksSection.innerHTML = "<h3>Active Links</h3>";
    if (logs.activeLinks?.length) {
        const ul = document.createElement("ul");
        logs.activeLinks.forEach(l => {
            const li = document.createElement("li");
            li.textContent = `[${formatTime(l.timestamp)}] ${l.url}`;
            ul.appendChild(li);
        });
        linksSection.appendChild(ul);
    } else {
        linksSection.innerHTML += "<p>No active links</p>";
    }
    logsContainer.appendChild(linksSection);
}


// --- AUTO REFRESH ---
setInterval(() => {
    fetchFiles();
    fetchLogs();
}, 1000);

// Initial fetch
fetchFiles();
fetchLogs();