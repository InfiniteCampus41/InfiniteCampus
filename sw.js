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
const VERIFY_ICON = "/icons/shield-check.svg";
messaging.onBackgroundMessage((payload) => {
  	const isVerify = payload.data?.type === "verifyUser";
  	const tag = payload.data?.tag || (payload.data?.uid ? `${payload.data.type || "notif"}-${payload.data.uid}` : undefined);
  	const options = {
  		body: payload.notification.body,
  		icon: isVerify ? VERIFY_ICON : "/res/192icon.png",
  		data: {
            url: payload.data?.url || "/"
        }
	};
  	if (tag) {
  		options.tag = tag;
  		options.renotify = true;
  	}
  	if (isVerify) {
  		options.actions = [
   	 		{
      			action: "verify",
      			title: "Verify User"
    		}
  		];
  	}
  	self.registration.showNotification(payload.notification.title, options);
});
self.addEventListener("push", function(event) {
  	const data = event.data.json();
  	const isVerify = data.type === "verifyUser" || data.data?.type === "verifyUser";
  	const tag = data.tag || data.data?.tag;
  	const options = {
		title: data.title,
    	body: data.body,
    	icon: isVerify ? VERIFY_ICON : data.icon,
		image: data.image,
    	data: {
      		url: data.data?.url || "/"
    	}
  	};
  	if (tag) {
  		options.tag = tag;
  		options.renotify = true;
  	}
  	event.waitUntil(
    	self.registration.showNotification(data.title, options)
  	);
});
self.addEventListener("notificationclick", function(event) {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ("focus" in client) {
                    client.focus();
                    if ("navigate" in client) return client.navigate(url);
                    return;
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
importScripts("/urls.js");
importScripts(`${y}`);
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