import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { auth, db } from "./firebase.js";
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024;
const PREMIUM_MAX_SIZE = 500 * 1024 * 1024;
const appDiv = document.getElementById("app");
const params = new URLSearchParams(window.location.search);
const fileParam = params.get("file");
let finalFileUrl = null;
if (fileParam) {
    appDiv.innerHTML = `
        <center>
            <h2 class="tptxt">Download Your File</h2>
            <p class="btxt">${fileParam}</p>
            <div id="progressContainer" style="display:none; width:80%; background:#333; border-radius:4px; margin:10px auto;">
                <div id="progressBar" style="width:0%; height:20px; background:#4caf50; border-radius:4px;"></div>
            </div>
            <button class="button" id="downloadBtn">Download</button>
        </center>
    `;
    const btn = document.getElementById("downloadBtn");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    btn.onclick = () => {
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";
        fetch(`${a}/files/${encodeURIComponent(fileParam)}?download=1`, {
            method: "GET",
            headers: { "ngrok-skip-browser-warning": "true" }
        })
        .then(response => {
            if (!response.ok) throw new Error("Network Response Was Not Ok");
            const contentLength = response.headers.get("Content-Length");
            if (!contentLength) return response.blob();
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            const reader = response.body.getReader();
            const chunks = [];
            function read() {
                return reader.read().then(({ done, value }) => {
                    if (done) return;
                    chunks.push(value);
                    loaded += value.length;
                    const percent = Math.round((loaded / total) * 100);
                    progressBar.style.width = percent + "%";
                    return read();
                });
            }
            return read().then(() => new Blob(chunks));
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileParam;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            progressBar.style.width = "100%";
        })
        .catch(err => { showError("Download Failed: " + err.message); });
    };
} else {
    appDiv.innerHTML = `
        <center>
            <h2 class="tptxt">Upload A File → Get A 5 Minute Download Link</h2>
            <p id="premiumInfo" style="color:blue;"></p>
            <input type="file" id="fileInput" style="display:none;">
            <label for="fileInput" class="button">Choose File</label>
            <p id="fileName"></p>
            <div id="progressContainer" style="display:none; width:80%; background:#333; border-radius:4px; margin:10px auto; text-align:left;">
                <div id="progressBar" style="width:0%; height:20px; background:#4caf50; border-radius:4px; color:#000; text-align:left; font-weight:bold;"></div>
            </div>
            <p id="output"></p>
        </center>
    `;
    const input = document.getElementById("fileInput");
    const fileNameDisplay = document.getElementById("fileName");
    const progressBar = document.getElementById("progressBar");
    const progressContainer = document.getElementById("progressContainer");
    const output = document.getElementById("output");
    const premiumInfo = document.getElementById("premiumInfo");
    let maxFileSize = DEFAULT_MAX_SIZE;
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const uid = user.uid;
            const snapshot = await get(child(ref(db), `users/${uid}/profile/premium1`));
            const isPremium1 = snapshot.exists() && snapshot.val() === true;
            const twosnapshot = await get(child(ref(db), `users/${uid}/profile/premium2`));
            const isPremium2 = twosnapshot.exists() && twosnapshot.val() === true;
            const threesnapshot = await get(child(ref(db), `users/${uid}/profile/premium3`));
            const isPremium3 = threesnapshot.exists() && threesnapshot.val() === true;
            const devSnap = await get(child(ref(db), `users/${uid}/profile/isDev`));
            const isDev = devSnap.exists() && devSnap.val() === true;
            const adminSnap = await get(child(ref(db), `users/${uid}/profile/isAdmin`));
            const isAdmin = adminSnap.exists() && adminSnap.val() === true;
            const HAdminsnap = await get(child(ref(db), `users/${uid}/profile/isHAdmin`));
            const isHAdmin = HAdminsnap.exists() && HAdminsnap.val() === true;
            const CoOwnerSnap = await get(child(ref(db), `users/${uid}/profile/isCoOwner`));
            const isCoOwner = CoOwnerSnap.exists() && CoOwnerSnap.val() === true;
            const testerSnap = await get(child(ref(db), `users/${uid}/profile/isTester`));
            const isTester = testerSnap.exists() && testerSnap.val() === true;
            const ownerSnap = await get(child(ref(db), `users/${uid}/profile/isOwner`));
            const isOwner = ownerSnap.exists() && ownerSnap.val() === true;
            if (isPremium1 || isPremium2 || isPremium3 || isDev || isAdmin || isHAdmin || isCoOwner || isTester || isOwner) {
                maxFileSize = PREMIUM_MAX_SIZE;
                premiumInfo.innerHTML = `You Are A Premium User! You Can Upload Files Up To 500MB.`;
            } else {
                premiumInfo.innerHTML = `You Can Upload Files Up To 100MB. Upgrade To <a class="discord" href="/InfiniteDonaters.html">Premium</a> To Upload Up To 500MB.`;
            }
        } else {
            premiumInfo.innerHTML = `You Can Upload Files Up To 100MB. Sign In And Upgrade To <a class="discord" href="/InfiniteDonaters.html">Premium</a> To Upload Up To 500MB.`;
        }
    });
    input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;
        fileNameDisplay.textContent = "Selected File: " + file.name;
        if (file.size > maxFileSize) {
            if (maxFileSize === PREMIUM_MAX_SIZE) {
                showError("File Too Large! Maximum Allowed Size For Premium Is 500 MB.");
            } else {
                output.innerHTML = `File Too Large! Maximum Allowed Size Is 100MB. <br>Want To Upload Up To 500MB? <a class="discord" href="/InfiniteDonaters.html">Upgrade To Premium</a>`;
            }
            input.value = "";
            return;
        }
        const CHUNK_SIZE = 10 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";
        let uploadedBytes = 0;
        for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
            const start = (chunkNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const formData = new FormData();
            formData.append("file", chunk);
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${a}/uploadthis`, false);
            xhr.setRequestHeader("X-File-Id", fileId);
            xhr.setRequestHeader("X-Chunk-Number", chunkNumber);
            xhr.setRequestHeader("X-Total-Chunks", totalChunks);
            xhr.setRequestHeader("X-Filename", file.name);
            if (auth.currentUser) {
                xhr.setRequestHeader("X-User-Id", auth.currentUser.uid);
            }
            xhr.onload = () => {
                if (xhr.status === 200) {
                    uploadedBytes += chunk.size;
                    const percent = Math.round((uploadedBytes / file.size) * 100);
                    progressBar.style.width = percent + "%";
                    progressBar.textContent = `${percent}% — Uploading Chunk ${chunkNumber}/${totalChunks}`;
                    if (chunkNumber === totalChunks) {
                        try {
                            const res = JSON.parse(xhr.responseText);
                            if (res.fileUrl) {
                                finalFileUrl = res.fileUrl;
                            }
                        } catch (e) {
                            throw new Error("Invalid Server Response");
                        }
                    }
                } else {
                    throw new Error(`Chunk ${chunkNumber} Upload Failed`);
                }
            };
            xhr.onerror = () => {
                output.innerHTML = `<p class="r">Chunk ${chunkNumber} Upload Failed (Network Error)</p>`;
                throw new Error(`Chunk ${chunkNumber} Upload Failed`);
            };
            xhr.send(formData);
        }
        output.innerHTML = `<p>Upload Complete! Finalizing On Server...</p>`;
        if (!finalFileUrl) {
            output.innerHTML = `<p class="r">Upload Finished, But Final File URL Missing.</p>`;
            return;
        }
        const fileName = finalFileUrl.split("/").pop();
        const link = `${f}/InfiniteUploaders.html?file=${encodeURIComponent(fileName)}`;
        const link2 = `${b}/InfiniteUploaders.html?file=${encodeURIComponent(fileName)}`;
        output.innerHTML = `
            <center>
                <p>Temporary Download Link (5 Mins):</p>
                <input type="text" id="fileLink" value="${link}" readonly style="width:80%">
                <button class="button" onclick="copyLink()">Copy</button>
                <br>
                <br>
                <input type="text" id="fileLink2" value="${link2}" readonly style="width:80%">
                <button class="button" onclick="copyLink2()">Copy</button>
                <br><br>
                <a href="${link}" target="_blank">
                    <button class="button">Go To Download Page (This Site)</button>
                </a>
                <a href="${link2}" target="_blank">
                    <button class="button">Go To Download Page (Official Site)</button>
                </a>
            </center>
        `;
        progressBar.style.width = "100%";
        progressBar.textContent = "100% — Complete";
    });
    window.copyLink = () => {
        const link = document.getElementById("fileLink");
        link.select();
        document.execCommand("copy");
        showSuccess("Copied To Clipboard!");
    };
    window.copyLink2 = () => {
        const link2 = document.getElementById("fileLink2");
        link2.select();
        document.execCommand("copy");
        showSuccess("Copied To Clipboard");
    };
}