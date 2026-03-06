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
    	icon: "/icon.png",
		data: { url: payload.notification.url }
  	});
});