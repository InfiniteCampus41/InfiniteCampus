import { auth } from "./firebase.js";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const backend = `${a}`;
const stripe = Stripe("pk_live_51SwqnVI9WcNth2N5fglWiLYrwZ9Eshebvr7UCENzOJyfjk39tmNaMoVqecNa2sXRFYJYrgpsRlG0n7mQWdPktw1y00AWcjltXi");
let currentUser = null;
onAuthStateChanged(auth, user => {
    currentUser = user;
    if(user) {
        sessionStorage.setItem("donUID", user.uid);
    }
    document.getElementById("authUI").style.display = user ? "none" : "block";
    document.getElementById("donateUI").style.display = user ? "block" : "none";
});
function signup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
        currentUser = userCredential.user;
        sessionStorage.setItem("donUID", currentUser.uid);
    })
    .catch(err => showError(err.message));
}
function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
        currentUser = userCredential.user;
        sessionStorage.setItem("donUID", currentUser.uid);
    })
    .catch(err => showError(err.message));
}
function logout() {
    signOut(auth);
    sessionStorage.removeItem("donUID");
}
async function donate() {
    const amount = Number(document.getElementById("amount").value);
    if (!amount || amount <= 0) return showError("Invalid Amount");
    const uid = currentUser?.uid;
    if (!uid) return showError("You Must Be Logged In To Donate.");
    sessionStorage.setItem("donUID", uid);
    const res = await fetch(`${backend}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, amount })
    });
    const data = await res.json();
    stripe.redirectToCheckout({ sessionId: data.id });
}
const msg = document.getElementById("msg");
const params = new URLSearchParams(location.search);
const successAmount = params.get("success");
const cancelled = params.get("cancel");
if (cancelled) {
    msg.innerText = "Donation Cancelled.";
}
if (successAmount) {
    msg.innerText = "Processing Your Payment... This Usually Takes A Few Seconds.";
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            msg.innerText = "Login Required To Verify Donation.";
            return;
        }
        const uid = user.uid;
        let attempts = 0;
        let found = false;
        while (attempts < 20 && !found) {
            await new Promise(r => setTimeout(r, 1000));
            const snap = await get(ref(db, `users/${uid}/profile`));
            if (!snap.exists()) continue;
            const profile = snap.val();
            if (profile.premium3) {
                msg.innerText =
                `Thank You For Your $${(successAmount/100).toFixed(2)} Donation!\nYou Now Have Premium Tier 3 For 3 Months!`;
                found = true;
            }
            else if (profile.premium2) {
                msg.innerText =
                `Thank You For Your $${(successAmount/100).toFixed(2)} Donation!\nYou Now Have Premium Tier 2 For 3 Months!`;
                found = true;
            }
            else if (profile.premium1) {
                msg.innerText =
                `Thank You For Your $${(successAmount/100).toFixed(2)} Donation!\nYou Now Have Premium For 3 Months!`;
                found = true;
            }
            attempts++;
        }
        if (!found) {
            msg.innerText =
            `Thank You For Your $${(successAmount/100).toFixed(2)} Donation!\nYour Payment Is Confirmed — Perks Will Appear Shortly.`;
        }
        history.replaceState({}, "", "/InfiniteDonaters.html");
    });
}
const password = document.getElementById("password");
if (password) {
    password.addEventListener("keydown", (e) => {
      	if (e.key === "Enter") {
        	e.preventDefault();
        	login();
      	}
    });
}
const email = document.getElementById("email");
if (email) {
    email.addEventListener("keydown", (e) => {
      	if (e.key === "Enter") {
        	e.preventDefault();
        	login();
      	}
    });
}
const amount = document.getElementById("amount");
if (amount) {
    amount.addEventListener("keydown", (e) => {
      	if (e.key === "Enter") {
        	e.preventDefault();
        	donate();
      	}
    });
}
window.donate = donate;
window.login = login;
window.signup = signup;
window.logout = logout;
const perks1 = document.getElementById('perks1');
const perks2 = document.getElementById('perks2');
const donatecontainer = document.getElementById('pollContainer');
const perksContainer = document.getElementById('perksContainer');
perks1.addEventListener("click", () => {
    perksContainer.style.display = 'block';
    donatecontainer.style.display = 'none';
});
perks2.addEventListener("click", () => {
    perksContainer.style.display = 'none';
    donatecontainer.style.display = 'block';
});