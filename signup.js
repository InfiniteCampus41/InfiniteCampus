import { auth, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "./imports.js";
const urlParams = new URLSearchParams(window.location.search);
const chatparams = urlParams.get("chat");
const donParams = urlParams.get("donate");
const pollParams = urlParams.get("poll");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("login");
const displayNameSection = document.getElementById("displayNameSection");
const displayNameInput = document.getElementById("displayNameInput");
const saveDisplayNameBtn = document.getElementById("saveDisplayNameBtn");
const statusEl = document.getElementById("status");
displayNameInput.setAttribute("maxlength", "20");
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
async function dbSet(path, value) {
    return await fetchAPI("write", {
        path: pathToArray(path),
        value
    });
}
async function dbUpdate(path, updates) {
    for (const key in updates) {
        await dbSet(path + "/" + key, updates[key]);
    }
}
onAuthStateChanged(auth, (user) => {
    if (user && !user.displayName) {
        document.getElementById("signupSection").style.display = "none";
        displayNameSection.style.display = "block";
    } else if (user && user.displayName) {
        if (chatparams) {
            window.location.href = "InfiniteAccounts.html?chat=true";
        } else if (donParams) {
            window.location.href = "InfiniteAccounts.html?donate=true";
        } else if (pollParams) {
            window.location.href = "InfiniteAccounts.html?poll=true";
        } else {
            window.location.href = "InfiniteAccounts.html";
        }
    }
});
signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        statusEl.textContent = "Please Fill Out All Fields.";
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        await new Promise((resolve) => {
            const unsub = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    await user.getIdToken(true);
                    unsub();
                    resolve();
                }
            });
        });
        document.getElementById("signupSection").style.display = "none";
        displayNameSection.style.display = "block";
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            showError("Email Already In Use.");
        } else if (error.code !== "permission-denied") {
            console.error(error);
            showError("Signup Failed: " + error.message);
        }
    }
});
loginBtn.addEventListener("click", async () => {
    if (chatparams) {
        window.location.href = "InfiniteLogins.html?chat=true";
    } else if (donParams) {
        window.location.href = "InfiniteLogins.html?donate=true";
    } else if (pollParams) {
        window.location.href = "InfiniteLogins.html?poll=true";
    } else {
        window.location.href = "InfiniteLogins.html";
    }
});
saveDisplayNameBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    const displayName = displayNameInput.value.trim();
    if (!displayName) {
        showError("Please Enter A Display Name.");
        return;
    }
    if (displayName.length > 20) {
        showError("Display Name Cannot Exceed 20 Characters.");
        return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(displayName)) {
        showError("Invalid Display Name. Use Only Letters, Numbers, Underscores, Or Dashes.");
        return;
    }
    try {
        const usersSnap = await dbGet("users");
        if (usersSnap) {
            let taken = false;
            Object.values(usersSnap).forEach(userData => {
                const s = userData?.profile;
                if (s?.displayName?.toLowerCase() === displayName.toLowerCase()) {
                    taken = true;
                }
            });
            if (taken) {
                showError("That Display Name Is Already Taken.");
                return;
            }
        }
        await user.getIdToken(true);
        await updateProfile(user, { displayName });
        const userSettingsRef = `users/${user.uid}/settings`;
        const userProfileRef = `users/${user.uid}/profile`;
        await dbSet(userSettingsRef, {
            color: "#ffffff",
            showMentions: true,
            userEmail: user.email
        });
        await dbUpdate(userProfileRef, {
            displayName: displayName,
            pic: 0
        });
        if (chatparams) {
            window.location.href = "InfiniteAccounts.html?chat=true";
        } else if(donParams) {
            window.location.href = "InfiniteAccounts.html?donate=true";
        } else if (pollParams) {
            window.location.href = "InfiniteAccounts.html?poll=true";
        } else {
            window.location.href = "InfiniteAccounts.html";
        }
    } catch (error) {
        if (error.code === "permission-denied") {
            return;
        }
        console.error(error);
        showError("Failed To Save Display Name: " + error.message);
    }
});