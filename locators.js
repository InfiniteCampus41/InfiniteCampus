async function showLocationAndIp() {
    let infoEl = document.getElementById("ligma");
    try {
        const res  = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("Fetch Failed");
        const data = await res.json();
        if (!infoEl) {
            infoEl = document.createElement("div");
            infoEl.id = "ligma";
            document.body.appendChild(infoEl);
        }
        infoEl.innerText =
            `Current State:\n ${data.region ?? "Your State"}\n` +
            `You Are Currently Located Near:\n ${data.city ?? "Your Area"}\n` +
            `Your IPv4 Address Is Currently:\n ${data.ip ?? "Unknown"}\n` +
            `Current Org:\n ${data.org ?? "None"}\n` +
            `Current Zip Code:\n ${data.postal ?? "Zip Code"}\n` +
            `Current Latitude:\n ${data.latitude ?? "0"}\n` +
            `Current Longitude:\n ${data.longitude ?? "0"}`;
        infoEl.classList.add("show");
    } catch (err) {
        console.error("Error Fetching Location:", err);
        if (!infoEl) {
            infoEl = document.createElement("div");
            infoEl.id = "ligma";
            document.body.appendChild(infoEl);
        }
        showError("Error Fetching Location:", err);
    }
}
function init() {
    showLocationAndIp();
}
document.addEventListener("DOMContentLoaded", init);