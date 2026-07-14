import { auth, onAuthStateChanged } from './imports.js';
const EXT_BY_TYPE = { html5: ".zip", flash: ".swf" };
const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_THUMB_BYTES = 5 * 1024 * 1024;
const loginGate = document.getElementById("loginGate");
const uploadCard = document.getElementById("gameUploadCard");
const nameInput = document.getElementById("gameName");
const nameCount = document.getElementById("nameCount");
const typeSelect = document.getElementById("gameType");
const fileRow = document.getElementById("fileRow");
const urlRow = document.getElementById("urlRow");
const fileInput = document.getElementById("gameFile");
const fileNameLabel = document.getElementById("fileNameLabel");
const urlInput = document.getElementById("gameUrl");
const thumbOptionalTag = document.getElementById("thumbOptionalTag");
const thumbInput = document.getElementById("gameThumb");
const thumbNameLabel = document.getElementById("thumbNameLabel");
const thumbPreview = document.getElementById("thumbPreview");
const descInput = document.getElementById("gameDesc");
const descCount = document.getElementById("descCount");
const submitBtn = document.getElementById("submitGameBtn");
const statusEl = document.getElementById("uploadStatus");
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loginGate.style.display = "none";
        uploadCard.style.display = "block";
    } else {
        loginGate.style.display = "block";
        uploadCard.style.display = "none";
    }
});
nameInput.addEventListener("input", () => {
    nameCount.textContent = nameInput.value.length;
});
descInput.addEventListener("input", () => {
    descCount.textContent = descInput.value.length;
});
function syncTypeUI() {
    const type = typeSelect.value;
    fileInput.value = "";
    fileNameLabel.textContent = "No File Chosen";
    if (type === "url") {
        fileRow.style.display = "none";
        urlRow.style.display = "block";
        thumbOptionalTag.textContent = "(Required)";
    } else {
        fileRow.style.display = "block";
        urlRow.style.display = "none";
        fileInput.setAttribute("accept", EXT_BY_TYPE[type]);
        thumbOptionalTag.textContent = "(Optional)";
    }
}
typeSelect.addEventListener("change", syncTypeUI);
syncTypeUI();
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    fileNameLabel.textContent = file ? file.name : "No File Chosen";
});
thumbInput.addEventListener("change", () => {
    const file = thumbInput.files[0];
    thumbNameLabel.textContent = file ? file.name : "No File Chosen";
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            thumbPreview.src = reader.result;
            thumbPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        thumbPreview.style.display = "none";
        thumbPreview.src = "";
    }
});
function notifyError(msg) {
    if (typeof showError === "function") showError(msg);
    else alert(msg);
}
function notifySuccess(msg) {
    if (typeof showSuccess === "function") showSuccess(msg);
    else alert(msg);
}
submitBtn.addEventListener("click", async () => {
    if (!currentUser) {
        notifyError("You Must Be Logged In To Upload A Game.");
        return;
    }
    const name = nameInput.value.trim();
    const type = typeSelect.value;
    const description = descInput.value.trim();
    const file = fileInput.files[0];
    const thumbFile = thumbInput.files[0];
    const gameUrl = urlInput.value.trim();
    if (!name) return notifyError("Game Name Is Required.");
    if (name.length > 100) return notifyError("Game Name Must Be 100 Characters Or Fewer.");
    if (description.length > 2000) return notifyError("Description Must Be 2000 Characters Or Fewer.");
    if (type === "url") {
        if (!gameUrl) return notifyError("Please Enter The Game's URL.");
        try {
            const parsed = new URL(gameUrl);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
        } catch {
            return notifyError("Please Enter A Valid Http(s) URL.");
        }
        if (!thumbFile) return notifyError("A Thumbnail Is Required For URL Games.");
    } else {
        if (!file) return notifyError("Please Choose A File To Upload.");
        if (file.size > MAX_SIZE_BYTES) return notifyError("File Exceeds The 50MB Limit.");
        const expectedExt = EXT_BY_TYPE[type];
        if (!file.name.toLowerCase().endsWith(expectedExt)) {
            return notifyError(`${type.toUpperCase()} Games Must Be Uploaded As ${expectedExt} Files.`);
        }
    }
    if (thumbFile && thumbFile.size > MAX_THUMB_BYTES) return notifyError("Thumbnail Exceeds The 5MB Limit.");
    submitBtn.disabled = true;
    statusEl.textContent = "Uploading...";
    statusEl.style.color = "#aaa";
    try {
        const token = await currentUser.getIdToken();
        const formData = new FormData();
        formData.append("name", name);
        formData.append("type", type);
        formData.append("description", description);
        if (type === "url") {
            formData.append("gameUrl", gameUrl);
        } else {
            formData.append("file", file);
        }
        if (thumbFile) formData.append("thumbnail", thumbFile);
        const res = await fetch(`${a}/api/games/upload`, {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.error || "Upload Failed");
        }
        statusEl.textContent = "Game Submitted For Review!";
        statusEl.style.color = "#4caf50";
        notifySuccess("Your Game Has Been Submitted And Is Pending Admin Review.");
        nameInput.value = "";
        nameCount.textContent = "0";
        descInput.value = "";
        descCount.textContent = "0";
        fileInput.value = "";
        fileNameLabel.textContent = "No File Chosen";
        thumbInput.value = "";
        thumbNameLabel.textContent = "No File Chosen";
        thumbPreview.style.display = "none";
        thumbPreview.src = "";
        urlInput.value = "";
    } catch (err) {
        statusEl.textContent = "";
        notifyError(err.message || "Upload Failed. Please Try Again.");
    } finally {
        submitBtn.disabled = false;
    }
});