import { db, auth } from "./chatfirebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
const displayNameEl = document.getElementById("displayName");
const bioEl = document.getElementById("bio");
const uidEl = document.getElementById("uid");
const loadingEl = document.getElementById("loading");
const profileContent = document.getElementById("profileContent");
const errorEl = document.getElementById("error");
const messageBtn = document.getElementById("messageUserBtn");
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get("user");
function createBadge(profile, isVerified) {
  	const badgeContainer = document.createElement("span");
  	badgeContainer.style.display = "flex";
  	badgeContainer.style.alignItems = "center";
  	badgeContainer.style.gap = "6px";
  	badgeContainer.style.marginLeft = "6px";
  	const roles = [
    	{ key: "isOwner", icon: "bi bi-shield-plus", title: "Owner", color: "lime" },
    	{ key: "isTester", icon: "fa-solid fa-cogs", title: "Tester", color: "DarkGoldenRod" },
    	{ key: "isCoOwner", icon: "bi bi-shield-fill", title: "Co-Owner", color: "lightblue" },
    	{ key: "isHAdmin", icon: "fa-solid fa-shield-halved", title: "Head Admin", color: "#00cc99" },
    	{ key: "isAdmin", icon: "bi bi-shield", title: "Admin", color: "dodgerblue" },
    	{ key: "isDev", icon: "bi bi-code-square", title: "This User Is A Developer For Infinitecampus.xyz", color: "green" },
    	{ key: "mileStone", icon: "bi bi-award", title: "This User Is The 100Th Signed Up User", color: "yellow" }
  	];
  	roles.forEach(r => {
    	if (profile?.[r.key] === true) {
      		const badge = document.createElement("i");
      		badge.className = `${r.icon}`;
      		badge.title = r.title;
      		badge.style.color = r.color;
      		badge.style.fontSize = "1.1em";
      		badgeContainer.appendChild(badge);
    	}
  	});
	if (isVerified === true) {
    	const verified = document.createElement("i");
    	verified.className = "bi bi-shield-check";
    	verified.title = "Verified User";
    	verified.style.color = "white";
    	verified.style.fontSize = "1.1em";
    	badgeContainer.appendChild(verified);
  	}
  	return badgeContainer;
}
if (!uid) {
  	showError("Invalid URL");
} else {
  	loadUserProfile(uid);
}
async function loadUserProfile(uid) {
  	try {
    	const userSnap = await get(ref(db, "users/" + uid));
    	if (!userSnap.exists()) {
      		showError(`User With ID "${uid}" Not Found.`);
      		return;
    	}
    	const foundUser = userSnap.val();
    	const currentUser = auth.currentUser;
    	let viewerIsOwner = false;
    	if (currentUser) {
      		const viewerSnap = await get(ref(db, "users/" + currentUser.uid + "/profile"));
      		if (viewerSnap.exists()) {
        		const p = viewerSnap.val();
        		if (p?.isOwner === true || p?.isCoOwner === true || p?.isHAdmin === true || p?.isDev === true) {
          			viewerIsOwner = true;
        		}
      		}
    	}
    	const color = foundUser.settings?.color || "#ffffff";
    	let displayName = foundUser.profile?.displayName || "";
    	if (displayName.trim() === "") {
      		displayName = "Spam Account";
    	}
    	const bio = foundUser.profile?.bio || "No Bio Set.";
    	const email = foundUser.settings?.userEmail || "(No Email Set)";
    	const picValue = foundUser.profile?.pic ?? 0;
    	const profileImages = [
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
      		"/pfps/13.jpeg", 
      		"/pfps/14.jpeg"
    	];
    	const imgSrc = profileImages[picValue] || profileImages[0];
    	loadingEl.style.display = "none";
    	errorEl.style.display = "none";
    	profileContent.style.display = "block";
    	displayNameEl.innerHTML = "";
    	const container = document.createElement("div");
    	container.style.display = "flex";
    	container.style.alignItems = "center";
    	container.style.gap = "10px";
    	const img = document.createElement("img");
    	img.src = imgSrc;
    	img.alt = "Profile Icon";
    	img.style.width = "60px";
    	img.style.height = "60px";
    	img.style.marginLeft = "20px";
    	img.style.borderRadius = "50%";
    	img.style.border = "2px solid white";
    	img.style.objectFit = "cover";
    	const nameSpan = document.createElement("span");
    	nameSpan.textContent = `@${displayName}`;
    	nameSpan.style.color = color;
    	nameSpan.style.fontSize = "1.2em";
    	nameSpan.style.fontWeight = "600";
		container.appendChild(img);
		container.appendChild(nameSpan);
		const isVerified = foundUser.profile?.verified === true;
		const badgeEl = createBadge(foundUser.profile, isVerified);
		container.appendChild(badgeEl);
    	displayNameEl.appendChild(container);
    	bioEl.textContent = bio;
    	uidEl.innerHTML = `User ID: ${uid}`;
    	if (viewerIsOwner) {
      		const emailEl = document.createElement("div");
      		emailEl.style.marginTop = "5px";
      		emailEl.textContent = `Email: ${email}`;
      		uidEl.appendChild(emailEl);
    	}
    	if (messageBtn) {
      		messageBtn.style.display = "inline-block";
      		messageBtn.onclick = () => {
        		localStorage.setItem("openPrivateChatUid", uid);
        		window.location.href = "InfiniteChatters.html";
      		};
    	}
  	} catch (err) {
    	showError("Error Loading Profile: " + err.message);
  	}
}