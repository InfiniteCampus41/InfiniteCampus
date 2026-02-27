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
    const req = event.request;
    const url = new URL(req.url);
    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    const unityExtensions = [
        "slope.json",
		"unityloader41.js",
		"UnityProgress.js",
        ".unityweb",
        ".framework.js",
        ".loader.js",
        ".symbols.json"
    ];
    const isUnityAsset = unityExtensions.some(ext =>
        url.pathname.endsWith(ext)
    );
    if (req.headers.has("range")) {
        return fetch(req);
    }
    if (isUnityAsset) {
        return fetch(req);
    }
    if (req.mode === "navigate") {
        return fetch(req);
    }
    return fetch(req);
}
self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});