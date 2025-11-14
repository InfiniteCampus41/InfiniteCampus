self.addEventListener("install", event => {
  	event.waitUntil(
    	caches.open("app-cache").then(cache => {
      		return cache.addAll([
        		"/",
				"/frame.js",
				"/theme.js",
				"/InfiniteGamers.html",
				"/drypopup.js",
				"/games.js",
        		"/index.html",
        		"/global.css", 
        		"/main.js",
      		]);
    	})
  	);
});
self.addEventListener("fetch", event => {
  	event.respondWith(
    	caches.match(event.request).then(response => {
      		return response || fetch(event.request);
    	})
  	);
});