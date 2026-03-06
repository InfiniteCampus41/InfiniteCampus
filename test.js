

import { messaging, db, ref, set, getToken } from "./imports.js";
async function enableNotifications() {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const token = await getToken(messaging, {
            vapidKey: "BFzJJQnddg7dRJlByA9q76_jhw5XHgSydywvChgLXI6a6jSUimHA3vhMLRS0VtBRMWl_EfZx6BSvNVtTdVbXhOg",
            serviceWorkerRegistration: registration
        });
        set(ref(db, "pushTokens/" + token), true);
        console.log("Push Token:", token);
    }
}
enableNotifications();