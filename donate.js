firebase.initializeApp({  
  	apiKey: "AIzaSyBvbTQcsL1DoipWlO0ckApzkwCZgxBYbzY",
  	authDomain: "notes-27f22.firebaseapp.com",
  	databaseURL: "https://notes-27f22-default-rtdb.firebaseio.com",
  	projectId: "notes-27f22",
  	storageBucket: "notes-27f22.firebasestorage.app",
  	messagingSenderId: "424229778181",
  	appId: "1:424229778181:web:fa531219ed165346fa7d6c",
  	measurementId: "G-834FYV6VTR"
});
const backend = `${a}`;
const auth = firebase.auth();
const stripe = Stripe("pk_test_51SwqnpInalZRzJRKVBQTC3l8NDDsOCWTjHVmINXMoKK9GAHcQ0L4yThMfBkHWix6cgnu28vswidluayVGQUg8OeP00CqBY5phP");
let currentUser = null;
auth.onAuthStateChanged(user => {
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
    auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
        currentUser = userCredential.user;
        sessionStorage.setItem("donUID", currentUser.uid);
    })
    .catch(err => showError(err.message));
}
function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
        currentUser = userCredential.user;
        sessionStorage.setItem("donUID", currentUser.uid);
    })
    .catch(err => showError(err.message));
}
function logout() {
    auth.signOut();
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
const params = new URLSearchParams(location.search);
const result = params.get("r");
const uid = sessionStorage.getItem("donUID");
if (result && uid) {
    fetch(`${backend}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, result: result === "success" ? "success" : "cancelled" })
    }).then(() => {
        fetch(`${backend}/donstatus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid })
        })
        .then(r => r.json())
        .then(data => {
            const msg = document.getElementById("msg");
            if (data.status === "success") {
                if ((data.amount/100).toFixed(2) >= 5) {
                    msg.innerText = `Thank You! \n You Donated $${(data.amount/100).toFixed(2)}. \n You Now Have Infinite Campus Premium For The Next 3 Months!`
                } else {
                    msg.innerText = `Thank You! \n You Donated $${(data.amount/100).toFixed(2)}.`;
                }
            } else {
                msg.innerText = "Donation Cancelled.";
            }
            history.replaceState({}, "", "/");
            sessionStorage.removeItem("donUID");
        });
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