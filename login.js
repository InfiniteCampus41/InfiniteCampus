import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { auth, db } from "./firebase.js";
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "InfiniteLogins.html";
        return;
    }
    try {
        const profileRef = ref(db, `users/${user.uid}/profile`);
        const snapshot = await get(profileRef);
        if (!snapshot.exists()) {
            window.location.href = "InfiniteLogins.html";
            return;
        }
        const profile = snapshot.val();
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