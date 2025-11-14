self.addEventListener("install", event => {
  	event.waitUntil(
    	caches.open("app-cache").then(cache => {
      		return cache.addAll([
        		"/",
				"/frame.js",
				"/theme.js",
				"/InfiniteGamers.html",
				"/controls.js",
				"/drypopup.js",
				"/games.js",
				"/InfiniteShreks.html",
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