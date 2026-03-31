import { auth, onAuthStateChanged, signOut } from "./imports.js";
let authReady = false;
let currentUser = null;
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
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "InfiniteLogins.html";
        return;
    }
    try {
        const profileRef = `users/${user.uid}/profile`;
        const snapshot = await dbGet(profileRef);
        if (!snapshot) {
            window.location.href = "InfiniteLogins.html";
            return;
        }
        const profile = snapshot;
        const isAllowed =
            profile.isOwner === true ||
            profile.isTester === true ||
            profile.isCoOwner === true ||
            profile.isHAdmin === true ||
            profile.isDev === true;
        if (isAllowed) {
            if (window.location.pathname == '/InfiniteLogins.html') {
                window.location.href = "InfiniteAdmins.html";
            }
        } else {
            window.location.href = "InfiniteAccounts.html";
        }
    } catch (err) {
        showError("Permission Check Failed:", err);
        window.location.href = "InfiniteLogins.html";
    }
});
window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = "InfiniteLogins.html";
    });
};