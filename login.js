import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
   const firebaseConfig = {
    apiKey: "AIzaSyCd3Yi81oZbRFgcdc98e8hTatdM4pftYRs",
    authDomain: "infinitecampus-6e93c.firebaseapp.com",
    databaseURL: "https://infinitecampus-6e93c-default-rtdb.firebaseio.com",
    projectId: "infinitecampus-6e93c",
    storageBucket: "infinitecampus-6e93c.firebasestorage.app",
    messagingSenderId: "349851426947",
    appId: "1:349851426947:web:14cc56fab543ca91373bb6"
  };
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "InfinitePasswords.html";
      }
    });