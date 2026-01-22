let timer;
let audioStarted = false;
const audio = new Audio("https://codehs.com/uploads/4c43e4c918e704a08db7b92ff1daadf3");
function startCountdown() {
    clearInterval(timer);
    audio.pause();
    audio.currentTime = 0;
    audioStarted = false;
    const format = document.getElementById("format").value;
    const dateStr = document.getElementById("dateInput").value.trim();
    const timeStr = document.getElementById("timeInput").value.trim();
    const parsedDate = parseDateTime(dateStr, timeStr, format);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
        showError("Err#2 Invalid Date Or Time.");
        return;
    }
    localStorage.setItem("countdownTarget", parsedDate.getTime());
    localStorage.setItem("countdownDateInput", dateStr);
    localStorage.setItem("countdownTimeInput", timeStr);
    localStorage.setItem("countdownFormat", format);
    timer = setInterval(() => updateCountdown(parsedDate), 1000);
    updateCountdown(parsedDate);
}
function parseDateTime(dateStr, timeStr, format) {
    const dateParts = dateStr.split("/");
    if (dateParts.length !== 3) return null;
    let day, month, year;
    if (format === "mdy") {
        [month, day, year] = dateParts;
    } else {
        [day, month, year] = dateParts;
    }
    const timeParts = (timeStr || "00:00:00").split(":");
    const hours = parseInt(timeParts[0] || 0);
    const minutes = parseInt(timeParts[1] || 0);
    const seconds = parseInt(timeParts[2] || 0);
    return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hours,
        minutes,
        seconds
    );
}
function updateCountdown(targetDate) {
    const now = new Date();
    let diff = Math.floor((targetDate - now) / 1000);
    if (diff <= 58.5 && !audioStarted) {
        audio.play()
        .catch(err => console.error("Autoplay Blocked:", err));
        audioStarted = true;
    }
    if (diff <= 0) {
        clearInterval(timer);
        document.getElementById("days").textContent = "Time's Up!";
        document.getElementById("hours").textContent = "";
        document.getElementById("minutes").textContent = "";
        document.getElementById("seconds").textContent = "";
        localStorage.removeItem("countdownTarget");
        localStorage.removeItem("countdownDateInput");
        localStorage.removeItem("countdownTimeInput");
        return;
    }
    const days = Math.floor(diff / (60 * 60 * 24));
    diff %= (60 * 60 * 24);
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    const daysEl = document.getElementById("days");
    daysEl.textContent = `Days: ${days}`;
    document.getElementById("hours").textContent = `Hours: ${hours}`;
    document.getElementById("minutes").textContent = `Minutes: ${minutes}`;
    document.getElementById("seconds").textContent = `Seconds: ${seconds}`;
}
window.addEventListener("load", () => {
    const savedTarget = localStorage.getItem("countdownTarget");
    const savedDate = localStorage.getItem("countdownDateInput");
    const savedTime = localStorage.getItem("countdownTimeInput");
    const savedFormat = localStorage.getItem("countdownFormat");
    if (savedDate) document.getElementById("dateInput").value = savedDate;
    if (savedTime) document.getElementById("timeInput").value = savedTime;
    if (savedFormat) document.getElementById("format").value = savedFormat;
    if (savedTarget) {
        const targetDate = new Date(parseInt(savedTarget));
        if (targetDate > new Date()) {
            timer = setInterval(() => updateCountdown(targetDate), 1000);
            updateCountdown(targetDate);
        } else {
            localStorage.clear();
        }
    }
});
["dateInput", "timeInput"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            startCountdown();
        }
    });
});