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
		data: {
            url: payload.data?.url || payload.notification?.url || "/"
        }
  	});
});
self.addEventListener("notificationclick", function(event) {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ("focus" in client) {
                    client.focus();
                    if ("navigate" in client) {
                        return client.navigate(url);
                    }
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});