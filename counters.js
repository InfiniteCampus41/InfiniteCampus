let timer;
let targetDate;
let audioStarted = false;
let lastLoggedAt = 0;
const audio = new Audio("https://codehs.com/uploads/4c43e4c918e704a08db7b92ff1daadf3");
const picker = document.getElementById("dateTimePicker");
const startBtn = document.getElementById("startBtn");
const digitalClock = document.getElementById("digitalClock");
const setupUI = document.getElementById("setup");
const clockUI = document.getElementById("clockView");
const dateText = document.getElementById("dateText");
const hourHand = document.getElementById("hour");
const minuteHand = document.getElementById("minute");
const secondHand = document.getElementById("second");
const reset = document.getElementById("reset");
const today = new Date();
const clockMode = document.getElementById("clockMode");
const analogClock = document.getElementById("analogClock");
today.setHours(0, 0, 0, 0);
function formatLocalDate(date) {
  	const pad = n => n.toString().padStart(2, "0");
  	return date.getFullYear() + "-" +
    	pad(date.getMonth() + 1) + "-" +
   	 	pad(date.getDate()) + "T" +
    	pad(date.getHours()) + ":" +
    	pad(date.getMinutes());
}
picker.value = formatLocalDate(today);
startBtn.onclick = () => {
	targetDate = new Date(picker.value);
	if (isNaN(targetDate)) return;
  	localStorage.setItem("countdownTarget", targetDate.getTime());
  	setupUI.style.display = "none";
  	clockUI.style.display = "flex";
  	clearInterval(timer);
  	timer = setInterval(update, 1000);
  	update();
};
function updateClockMode() {
  	if (clockMode.value === "digital") {
    	analogClock.style.display = "none";
    	digitalClock.style.display = "block";
    	digitalClock.classList.add("big");
  	} else {
    	analogClock.style.display = "block";
    	digitalClock.style.display = "block";
    	digitalClock.classList.remove("big");
  	}
}
clockMode.addEventListener("change", updateClockMode);
function update() {
  	const now = new Date();
  	let diff = Math.floor((targetDate - now) / 1000);
  	const totalMinutes = Math.floor(diff / 60);
  	const hoursLeft = Math.floor((diff % 86400) / 3600);
  	const minutesLeft = Math.floor(totalMinutes % 60);
  	const secondsLeft = diff % 60;
  	digitalClock.textContent =
    	`${hoursLeft.toString().padStart(2, "0")}H:` +
    	`${minutesLeft.toString().padStart(2, "0")}M:` +
    	`${secondsLeft.toString().padStart(2, "0")}S`;
  	if (diff <= 58.5 && !audioStarted) {
    	audio.play().catch(() => {});
    	audioStarted = true;
  	}
  	if (diff <= 0) {
    	clearInterval(timer);
    	dateText.textContent = "Times Up!";
    	localStorage.removeItem("countdownTarget");
    	return;
  	}
  	let days = Math.floor(diff / 86400);
  	let months = Math.floor(days / 30);
  	let years = Math.floor(months / 12);
  	dateText.textContent =
    	`${years} Years • ${months % 12} Months • ${days % 30} Days`;
  	const totalMinutesLeft = Math.floor(diff / 60);
  	const minutesLeftAnalog = totalMinutesLeft % 60;
  	const hoursLeftAnalog = Math.floor(totalMinutesLeft / 60) % 12;
	const smoothSeconds = secondsLeft;
  	const smoothMinutes = minutesLeftAnalog + smoothSeconds / 60;
  	const smoothHours = hoursLeftAnalog + smoothMinutes / 60;
  	secondHand.style.transform = `rotate(${smoothSeconds * 6}deg) translateY(-1px)`;
  	minuteHand.style.transform = `rotate(${smoothMinutes * 6}deg) translateY(0px)`;
  	hourHand.style.transform   = `rotate(${smoothHours * 30}deg) translateY(-2px)`;
}
reset.addEventListener("click", () => {
	localStorage.removeItem("countdownTarget");
	location.reload();
})
window.addEventListener("load", () => {
  	const saved = localStorage.getItem("countdownTarget");
  	if (saved && new Date(parseInt(saved)) > new Date()) {
    	targetDate = new Date(parseInt(saved));
    	setupUI.style.display = "none";
    	clockUI.style.display = "flex";
    	timer = setInterval(update, 1000);
    	update();
  	}
});
updateClockMode();