import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { auth, db } from "./firebase.js";
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "InfinitePasswords.html";
        return;
    }
    try {
        const profileRef = ref(db, `users/${user.uid}/profile`);
        const snapshot = await get(profileRef);
        if (!snapshot.exists()) {
            window.location.href = "InfinitePasswords.html";
            return;
        }
        const profile = snapshot.val();
        const isAllowed =
            profile.isOwner === true ||
            profile.isTester === true ||
            profile.isCoOwner === true ||
            profile.isDev === true;
        if (isAllowed) {
            if (window.location.pathname == '/InfinitePasswords.html') {
                window.location.href = "InfiniteAdmins.html";
            }
        } else {
            window.location.href = "InfinitePasswords.html";
            signOut(auth).then(() => {
                window.location.href = "InfinitePasswords.html";
            });
        }
    } catch (err) {
        console.error("Permission Check Failed:", err);
        window.location.href = "InfinitePasswords.html";
    }
});
window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = "InfinitePasswords.html";
    });
};