import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "InfiniteAdmins.html";
    }
});
window.login = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            window.location.href = "InfiniteAdmins.html";
        })
        .catch((error) => {
            showError(error.message);
        });
};
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        login();
    }
});