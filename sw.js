importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js");
firebase.initializeApp({
  	apiKey: "AIzaSyBvbTQcsL1DoipWlO0ckApzkwCZgxBYbzY",
  	authDomain: "notes-27f22.firebaseapp.com",
  	projectId: "notes-27f22",
  	messagingSenderId: "424229778181",
  	appId: "1:424229778181:web:fa531219ed165346fa7d6c"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  	self.registration.showNotification(payload.notification.title, {
    	body: payload.notification.body,
    	icon: "/res/192icon.png"
  	});
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