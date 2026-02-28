import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile, sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, remove, push, onChildAdded, onChildRemoved, onChildChanged, runTransaction, off, query, orderByChild, limitToLast, endAt, child } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { forceWebSockets } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { applyActionCode, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";
const firebaseConfig = {
  	apiKey: "AIzaSyBvbTQcsL1DoipWlO0ckApzkwCZgxBYbzY",
  	authDomain: "notes-27f22.firebaseapp.com",
  	databaseURL: "https://notes-27f22-default-rtdb.firebaseio.com",
  	projectId: "notes-27f22",
  	storageBucket: "notes-27f22.firebasestorage.app",
  	messagingSenderId: "424229778181",
  	appId: "1:424229778181:web:fa531219ed165346fa7d6c",
  	measurementId: "G-834FYV6VTR"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export { onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile,sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword, applyActionCode, confirmPasswordReset, ref, get, set, update, onValue, remove, push, onChildAdded, onChildRemoved, onChildChanged, runTransaction, off, query, orderByChild, limitToLast, endAt, child, forceWebSockets, io };
export default app;