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