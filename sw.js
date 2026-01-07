self.addEventListener("install", event => {
  	event.waitUntil(
    	caches.open("app-cache").then(cache => {
      		return cache.addAll([
        		"/pfps/1.jpeg",
				"/pfps/2.jpeg",
				"/pfps/3.jpeg",
				"/pfps/4.jpeg",
				"/pfps/5.jpeg",
				"/pfps/6.jpeg",
				"/pfps/7.jpeg",
				"/pfps/8.jpeg",
				"/pfps/9.jpeg",
				"/pfps/10.jpeg",
				"/pfps/11.jpeg",
				"/pfps/12.jpeg",
				"/pfps/f3.jpeg",
				"/pfps/kaiden.png",
				"/res/192icon.png",
				"/res/512icon.png",
				"/res/bg.png",
				"/res/homeicon.svg",
				"/res/icon.png",
				"/res/logo.svg",
				"/res/popupbg.jpg",
				"/res/settings.svg"
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