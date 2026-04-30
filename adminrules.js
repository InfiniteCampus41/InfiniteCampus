import { auth, onAuthStateChanged, forceWebSockets } from "./imports.js";
forceWebSockets();
const BACKEND = `${a}`;
const bk2 = `https://infinitecampus.xyz`;
let currentUser = null;
let authReady = false;
const authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authReady = true;
        resolve(user);
    });
});
async function getAuthToken() {
    await authReadyPromise;
    if (currentUser) {
        return await currentUser.getIdToken();
    }
    return null;
}
async function fetchAPI(endpoint, body) {
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(`${a}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Request failed");
    }
    return json;
}
function pathToArray(path) {
    return path.split("/").filter(Boolean);
}
async function dbGet(path) {
    const res = await fetchAPI("read", { path: pathToArray(path) });
    return res.data;
}
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
    const token = await getAuthToken();
    options.headers = Object.assign({}, options.headers, {
        "x-admin-password": ADMIN_PASS,
        "ngrok-skip-browser-warning": "true"
    });
    if (token) options.headers["Authorization"] = "Bearer " + token;
    return fetch(url, options);
}
async function checkUserPermissions(user) {
    if (!user) {
        showError("You Must Be Logged In To Access This Page.");
        window.location.href = "/InfiniteLogins.html";
        return false;
    }
    const userRef = `users/${user.uid}/profile`;
    const snapshot = await dbGet(userRef);
    if (snapshot == null || snapshot == undefined) {
        showError("User Profile Not Found.");
        return false;
    }
    const profile = snapshot;
    if (profile.isOwner || profile.isTester || profile.isCoOwner || profile.isHAdmin || profile.isDev) {
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
    const res = await adminFetch(bk2 + "/edit-urls", {
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
window.addUrl = addUrl;
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
    const res = await adminFetch(BACKEND + "/edit-urls/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
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
    showConfirm("Delete This URL?", function(result) {
        if (result) {
            adminFetch(BACKEND + "/edit-urls/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                body: JSON.stringify({ url })
            });
            fetchUrls();
        } else {
            showSuccess("Canceled");
        }
    });
}
let _rulesOriginal = "";
async function fetchRules() {
    const user = auth.currentUser;
    if (!user) return;
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) return;
    const statusEl = document.getElementById("rules-status");
    statusEl.textContent = "Loading...";
    statusEl.style.color = "";
    try {
        const res = await adminFetch(BACKEND + "/admin/modify-rules", {
            method: "GET",
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await res.json();
        if (!res.ok) {
            statusEl.textContent = data.error || "Failed to load rules.";
            return;
        }
        const pretty = JSON.stringify(data.rules, null, 2);
        _rulesOriginal = pretty;
        const editor = document.getElementById("rules-editor");
        editor.innerHTML = syntaxHighlight(pretty);
        updateLineNumbers();
        statusEl.textContent = "Loaded.";
    } catch (err) {
        statusEl.textContent = "Error: " + err.message;
    }
}
async function saveRules() {
    const user = auth.currentUser;
    if (!user) { showError("Not logged in."); return; }
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) return;
    const raw = document.getElementById("rules-editor").innerText;
    const statusEl = document.getElementById("rules-status");
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        showError(`Invalid JSON ${e.message}`);
        return;
    }
    statusEl.textContent = "Saving...";
    statusEl.style.color = "";
    try {
        const res = await adminFetch(BACKEND + "/admin/modify-rules", {
            method: "POST",
            headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
            body: JSON.stringify({ rules: parsed })
        });
        const data = await res.json();
        if (!res.ok) {
            showError(data.error || "Save Failed");
            return;
        }
        _rulesOriginal = JSON.stringify(parsed, null, 2);
        showSuccess(`Saved. Total modifications: ${data.timesRulesModified}`);
        document.getElementById("rules-editor").innerHTML = syntaxHighlight(_rulesOriginal);
        updateLineNumbers();
    } catch (err) {
        showError(err.message);
    }
}
function syntaxHighlight(json) {
    const escaped = json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return escaped.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function(match) {
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    const keyName = match.replace(/"/g, "").replace(/:$/, "");
                    if (keyName === ".read" || keyName === ".write" || keyName === ".validate" || keyName === ".indexOn") {
                        return `<span class="hl-rule-key">${match}</span>`;
                    }
                    if (keyName.startsWith("$")) {
                        return `<span class="hl-wildcard">${match}</span>`;
                    }
                    if (keyName === "rules") {
                        return `<span class="hl-rules-root">${match}</span>`;
                    }
                    return `<span class="hl-key">${match}</span>`;
                }
                const inner = match.replace(/^"|"$/g, "");
                if (/\bauth\b/.test(inner)) return `<span class="hl-auth">${match}</span>`;
                if (/\b(data|newData|root)\b/.test(inner)) return `<span class="hl-data">${match}</span>`;
                return `<span class="hl-string">${match}</span>`;
            }
            if (/true|false/.test(match)) return `<span class="hl-bool">${match}</span>`;
            if (/null/.test(match)) return `<span class="hl-null">${match}</span>`;
            return `<span class="hl-number">${match}</span>`;
        }
    );
}

function updateLineNumbers() {
    const editor = document.getElementById("rules-editor");
    const lines = editor.innerText.split("\n").length;
    const gutter = document.getElementById("rules-gutter");
    gutter.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join("");
}
onAuthStateChanged(auth, async (user) => {
    if (user) {
        fetchUrls();
        fetchRules();
    } else {
        window.location.href = "/InfiniteLogins.html";
    }
});
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
document.getElementById("rules-save-btn").onclick = saveRules;
document.getElementById("rules-refresh-btn").onclick = fetchRules;
document.getElementById("rules-editor").addEventListener("input", () => {
    updateLineNumbers();
});
document.getElementById("rules-editor").addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "  ");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveRules();
    }
});
(async () => {
    await verifyAdminPassword();
})();