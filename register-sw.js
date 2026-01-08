"use strict";
const stockSW = "./sw.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];
async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service Workers Cannot Be Registered Without https.");
		throw new Error("Your Browser Doesn't Support Service Workers.");
	}
	await navigator.serviceWorker.register(stockSW);
}