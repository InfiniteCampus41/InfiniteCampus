importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js");
firebase.initializeApp({
  	apiKey: "AIzaSyBvbTQcsL1DoipWlO0ckApzkwCZgxBYbzY",
  	authDomain: "notes-27f22.firebaseapp.com",
  	projectId: "notes-27f22",
  	messagingSenderId: "424229778181",
  	appId: "1:424229778181:web:fa531219ed165346fa7d6c"
});
import { auth, db, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, ref, set, update, get, GoogleAuthProvider, signInWithPopup } from "./imports.js";
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  	self.registration.showNotification(payload.notification.title, {
  		body: payload.notification.body,
  		icon: "/res/192icon.png",
  		actions: [
   	 		{
      			action: "verify",
      			title: "Verify User"
    		}
  		],
  		data: payload.data
	});
});
self.addEventListener("push", function(event) {
  	const data = event.data.json();
  	const options = {
		title: data.title,
    	body: data.body,
    	icon: data.icon,
		image: data.image,
    	data: {
      		url: data.data.url
    	}
  	};
  	event.waitUntil(
    	self.registration.showNotification(data.title, options)
  	);
});
self.addEventListener("notificationclick", function(event) {
  	event.notification.close();
  	if (event.action === "verify") {
    	const uid = event.notification.data.uid;
  		db.ref(`users/${uid}/profile/verified`).set(true);
    	return;
  	}
  	const url = event.notification.data.url;
  	event.waitUntil(
   	 	clients.openWindow(url)
  	);
});
importScripts("/scram/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
self.addEventListener("install", (event) => {
  	self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  	self.clients.claim();
});
async function handleRequest(event) {
  	await scramjet.loadConfig();
  	if (scramjet.route(event)) {
	  	return scramjet.fetch(event);
  	}
  	if (event.request.mode === "navigate") {
    	return fetch(event.request);
  	}
  	return fetch(event.request);
}
self.addEventListener("fetch", (event) => {
  	event.respondWith(handleRequest(event));
});