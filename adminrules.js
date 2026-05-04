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
    const snapshot = await dbGet(`users/${user.uid}/profile`);
    if (snapshot == null || snapshot == undefined) {
        showError("User Profile Not Found.");
        return false;
    }
    if (snapshot.isOwner || snapshot.isTester || snapshot.isCoOwner || snapshot.isHAdmin || snapshot.isDev) {
        return true;
    } else {
        showError("You Do Not Have The Required Permissions To Access This Page.");
        return false;
    }
}
async function checkOwnerPermissions(user) {
    if (!user) return false;
    const snapshot = await dbGet(`users/${user.uid}/profile`);
    return !!(snapshot && snapshot.isOwner);
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
function escAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function syntaxHighlightCollapsible(json, editorId) {
    const lines = json.split("\n");
    return lines.map(line => highlightLineText(line, editorId)).join("\n");
}
function highlightLineText(line, editorId) {
    const isRules = editorId === "rules-editor";
    const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return escaped.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function(match) {
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    const keyName = match.replace(/"/g, "").replace(/:$/, "");
                    if (isRules) {
                        if ([".read", ".write", ".validate", ".indexOn"].includes(keyName)) {
                            return `<span class="hl-rule-key">${match}</span>`;
                        }
                        if (keyName.startsWith("$")) {
                            return `<span class="hl-wildcard">${match}</span>`;
                        }
                        if (keyName === "rules") {
                            return `<span class="hl-rules-root">${match}</span>`;
                        }
                    }
                    return `<span class="hl-key">${match}</span>`;
                }
                const inner = match.replace(/^"|"$/g, "");
                if (isRules && /\bauth\b/.test(inner)) return `<span class="hl-auth">${match}</span>`;
                if (isRules && /\b(data|newData|root)\b/.test(inner)) return `<span class="hl-data">${match}</span>`;
                return `<span class="hl-string">${match}</span>`;
            }
            if (/true|false/.test(match)) return `<span class="hl-bool">${match}</span>`;
            if (/null/.test(match)) return `<span class="hl-null">${match}</span>`;
            return `<span class="hl-number">${match}</span>`;
        }
    );
}
function syntaxHighlight(json) {
    return syntaxHighlightCollapsible(json, "rules-editor");
}
function updateLineNumbers(editorId) {
    const gutterMap = { "rules-editor": "rules-gutter", "data-editor": "data-gutter" };
    const editor = document.getElementById(editorId);
    const gutter = document.getElementById(gutterMap[editorId]);
    if (!editor || !gutter) return;
    const lineCount = editor.innerText.split("\n").length;
    gutter.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join("");
}
function reRenderEditor(editorId) {
    const editor = document.getElementById(editorId);
    if (!editor) return;
    const raw = editor.innerText;
    editor.innerHTML = syntaxHighlightCollapsible(raw, editorId);
    updateLineNumbers(editorId);
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
        document.getElementById("rules-editor").innerHTML = syntaxHighlightCollapsible(pretty, "rules-editor");
        updateLineNumbers("rules-editor");
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
        document.getElementById("rules-editor").innerHTML = syntaxHighlightCollapsible(_rulesOriginal, "rules-editor");
        updateLineNumbers("rules-editor");
        statusEl.textContent = "Saved.";
    } catch (err) {
        showError(err.message);
    }
}
let _dataOriginal = "";
let _isOwner = false;
async function fetchData() {
    const user = auth.currentUser;
    if (!user) return;
    const statusEl = document.getElementById("data-status");
    statusEl.textContent = "Checking permissions...";
    _isOwner = await checkOwnerPermissions(user);
    if (!_isOwner) {
        statusEl.textContent = "Owner access required.";
        document.getElementById("data-editor").contentEditable = "false";
        document.getElementById("data-editor").style.opacity = "0.5";
        document.getElementById("data-save-btn").disabled = true;
        return;
    }
    statusEl.textContent = "Loading...";
    statusEl.style.color = "";
    try {
        const res = await adminFetch(BACKEND + "/admin/modify-data", {
            method: "GET",
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const result = await res.json();
        if (!res.ok) {
            statusEl.textContent = result.error || "Failed to load data.";
            return;
        }
        const pretty = JSON.stringify(result.data, null, 2);
        _dataOriginal = pretty;
        document.getElementById("data-editor").innerHTML = syntaxHighlightCollapsible(pretty, "data-editor");
        updateLineNumbers("data-editor");
        statusEl.textContent = "Loaded.";
    } catch (err) {
        statusEl.textContent = "Error: " + err.message;
    }
}
function collectLeafPaths(obj, prefix, out) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        out[prefix] = obj;
        return;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) {
        out[prefix] = obj;
        return;
    }
    for (const k of keys) {
        collectLeafPaths(obj[k], prefix ? prefix + "/" + k : k, out);
    }
}
function diffJSON(oldObj, newObj) {
    const oldLeaves = {};
    const newLeaves = {};
    collectLeafPaths(oldObj, "", oldLeaves);
    collectLeafPaths(newObj, "", newLeaves);
    const patches = [];
    for (const p in newLeaves) {
        if (JSON.stringify(newLeaves[p]) !== JSON.stringify(oldLeaves[p])) {
            patches.push({ path: p, value: newLeaves[p] });
        }
    }
    for (const p in oldLeaves) {
        if (!(p in newLeaves)) {
            patches.push({ path: p, value: null });
        }
    }
    return patches;
}
async function saveData() {
    const user = auth.currentUser;
    if (!user) { showError("Not Logged In."); return; }
    if (!_isOwner) { showError("Owner Access Required."); return; }
    const raw = document.getElementById("data-editor").innerText;
    const statusEl = document.getElementById("data-status");
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        showError(`Invalid JSON: ${e.message}`);
        return;
    }
    let oldParsed;
    try {
        oldParsed = _dataOriginal ? JSON.parse(_dataOriginal) : {};
    } catch {
        oldParsed = {};
    }
    const patches = diffJSON(oldParsed, parsed);
    if (patches.length === 0) {
        showSuccess("No Changes Detected.");
        statusEl.textContent = "No Changes.";
        return;
    }
    showConfirm(`This Will Apply ${patches.length} Change(s) To data.json. Are You Sure?`, async (confirmed) => {
        if (!confirmed) return;
        statusEl.textContent = "Saving...";
        statusEl.style.color = "";
        try {
            const res = await adminFetch(BACKEND + "/admin/modify-data", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                body: JSON.stringify({ patches })
            });
            const result = await res.json();
            if (!res.ok) {
                showError(result.error || "Save Failed");
                statusEl.textContent = "Save failed.";
                return;
            }
            _dataOriginal = JSON.stringify(parsed, null, 2);
            showSuccess(`data.json saved (${patches.length} change(s) applied).`);
            document.getElementById("data-editor").innerHTML = syntaxHighlightCollapsible(_dataOriginal, "data-editor");
            updateLineNumbers("data-editor");
            statusEl.textContent = "Saved.";
        } catch (err) {
            showError(err.message);
            statusEl.textContent = "Error.";
        }
    });
}
let _dataLoaded = false;
document.querySelectorAll(".editor-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".editor-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.dataset.tab;
        document.getElementById("rules-section").classList.toggle("visible", target === "rules");
        document.getElementById("data-section").classList.toggle("visible", target === "data");
        if (target === "data" && !_dataLoaded) {
            _dataLoaded = true;
            fetchData();
        }
    });
});
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
    updateLineNumbers("rules-editor");
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
document.getElementById("data-save-btn").onclick = saveData;
document.getElementById("data-refresh-btn").onclick = fetchData;
document.getElementById("data-editor").addEventListener("input", () => {
    updateLineNumbers("data-editor");
});
document.getElementById("data-editor").addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "  ");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveData();
    }
});
(async () => {
    await verifyAdminPassword();
})();