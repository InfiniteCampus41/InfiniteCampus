import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "InfiniteAdmins.html";
    }
});
window.login = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorText = document.getElementById("errorText");
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            window.location.href = "InfiniteAdmins.html";
        })
        .catch((error) => {
            errorText.textContent = error.message;
        });
};
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        login();
    }
});