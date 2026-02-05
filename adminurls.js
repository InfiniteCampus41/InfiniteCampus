import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { ref, get, forceWebSockets } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { auth, db } from "./firebase.js";
forceWebSockets();
const BACKEND = `${a}`;
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
const tableBody = document.querySelector("#url-table tbody");
function formatTime(value) {
    if (!value || value === "Unknown") return "Unknown";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).format(date);
}
window.addUrl = addUrl;
async function checkUserPermissions(user) {
    if (!user) {
        showError("You Must Be Logged In To Access This Page.");
        window.location.href = "/InfiniteLogins.html";
        return false;
    }
    const userRef = ref(db, `users/${user.uid}/profile`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
        showError("User Profile Not Found.");
        return false;
    }
    const profile = snapshot.val();
    if (profile.isOwner || profile.isTester || profile.isCoOwner || profile.isDev ) {
        return true;
    } else {
        showError("You Do Not Have The Required Permissions To Access This Page.");
        return false;
    }
}
async function fetchUrls() {
    const user = auth.currentUser;
    if (!user) {
        showError("You Must Be Logged In To Fetch URLs.");
        return;
    }
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) return;
    const res = await adminFetch("/edit-urls", {
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
    const res = await adminFetch("/edit-urls/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true"},
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
    if (!confirm("Delete This URL?")) return;
    await adminFetch("/edit-urls/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true"},
        body: JSON.stringify({ url })
    });
    fetchUrls();
}
async function fetchLogs() {
    const user = auth.currentUser;
    if (!user) {
        showError("You Must Be Logged In To Fetch Logs.");
        return;
    }
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) return;
    try {
        const response = await adminFetch("/logs", {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No Logs Found.</td></tr>';
            return;
        }
        const logs = Object.entries(data).map(([url, info]) => {
            if (typeof info === "number") {
                return { url, count: info, lastVisit: "Unknown" };
            }
            return { url, count: info.count, lastVisit: formatTime(info.lastVisit) };
        });
        logs.sort((a, b) => b.count - a.count);
        tableBody.innerHTML = "";
        logs.forEach((log, index) => {
            const tr = document.createElement("tr");
            const colors = ["gold", "silver", "peru"];
            tr.style.background = colors[index] || "white";
            tr.style.color = "black";
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${log.url}</td>
                <td>${log.count}</td>
                <td>${log.lastVisit}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4">Error Fetching Logs: ${err.message}</td></tr>`;
    }
}
onAuthStateChanged(auth, async (user) => {
    if (user) {
        fetchUrls();
        fetchLogs();
    } else {
        window.location.href = "/InfiniteLogins.html";
    }
});
setInterval(fetchLogs, 5000);
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
(async () => {
    await verifyAdminPassword();
})();