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
    const url = new URL(event.request.url);
    if (
        url.pathname.startsWith("/games/slope/Build/") ||
        url.pathname.startsWith("/games/slope/TemplateData/") ||
        url.pathname.endsWith(".wasm") ||
        url.pathname.endsWith(".data") ||
        url.pathname.includes("unityloader")
    ) {
        return fetch(event.request);
    }
    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    return fetch(event.request);
}
// async function handleRequest(event) {
//   	await scramjet.loadConfig();
//   	if (scramjet.route(event)) {
// 	  	return scramjet.fetch(event);
//   	}
//   	if (event.request.mode === "navigate") {
//     	return fetch(event.request);
//   	}
//   	return fetch(event.request);
// }
self.addEventListener("fetch", (event) => {
  	event.respondWith(handleRequest(event));
});