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
        if (p?.isOwner === true || p?.isCoOwner === true || p?.isHAdmin === true) {
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
      "/pfps/1.jpeg", "/pfps/2.jpeg", "/pfps/3.jpeg", "/pfps/4.jpeg",
      "/pfps/5.jpeg", "/pfps/6.jpeg", "/pfps/7.jpeg", "/pfps/8.jpeg",
      "/pfps/9.jpeg", "/pfps/f3.jpeg", "/pfps/kaiden.png", "/pfps/10.jpeg"
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
        window.location.href = "chat.html";
      };
    }
  } catch (err) {
    showError("Error Loading Profile: " + err.message);
  }
}
function showError(msg) {
  loadingEl.style.display = "none";
  profileContent.style.display = "none";
  errorEl.style.display = "block";
  errorEl.textContent = msg;
}