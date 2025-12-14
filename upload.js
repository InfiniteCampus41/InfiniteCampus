const MAX_SIZE = 100 * 1024 * 1024;
const appDiv = document.getElementById("app");
const params = new URLSearchParams(window.location.search);
const fileParam = params.get("file");
if (fileParam) {
    appDiv.innerHTML = `
        <center>
            <h2 class="tptxt">Download Your File</h2>
            <p>${fileParam}</p>
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
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
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
        .catch(err => {
            showError("Download Failed: " + err.message);
        });
    };
} else {
    appDiv.innerHTML = `
        <center>
            <h2 class="tptxt">Upload A File → Get A 5 Minute Download Link</h2>
            <input type="file" id="fileInput" style="display:none;">
            <label for="fileInput" class="button">Choose File</label>
            <p id="fileName"></p>
            <div id="progressContainer" style="display:none; width:80%; background:#333; border-radius:4px; margin:10px auto;">
                <div id="progressBar" style="width:0%; height:20px; background:#4caf50; border-radius:4px;"></div>
            </div>
            <p id="output"></p>
        </center>
    `;
    const input = document.getElementById("fileInput");
    const fileNameDisplay = document.getElementById("fileName");
    const progressBar = document.getElementById("progressBar");
    const progressContainer = document.getElementById("progressContainer");
    const output = document.getElementById("output");
    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;
        fileNameDisplay.textContent = "Selected File: " + file.name;
        if (file.size > MAX_SIZE) {
            showError("File Too Large! Maximum Allowed Size Is 100 MB.");
            input.value = "";
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${a}/uploadthis`, true);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + "%";
            }
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const res = JSON.parse(xhr.responseText);
                    const urlParts = res.fileUrl.split("/");
                    const filename = urlParts[urlParts.length - 1];
                    const link = `${b}/InfiniteUploaders.html?file=${encodeURIComponent(filename)}`;
                    output.innerHTML = `
                        <center>
                            <p>Temporary Download Link (5 Mins):</p>
                            <input type="text" id="fileLink" value="${link}" readonly style="width:80%">
                            <button class="button" onclick="copyLink()">Copy</button>
                            <br><br>
                            <a href="${link}" target="_blank">
                                <button class="button">Go To Download Page</button>
                            </a>
                        </center>
                    `;
                    progressBar.style.width = "100%";
                } catch (err) {
                    output.innerHTML = `<p class="r">Error Parsing Server Response</p>`;
                    console.error(err);
                }
            } else {
                output.innerHTML = `<p class="r">Upload Failed: ${xhr.statusText}</p>`;
            }
        };
        xhr.onerror = () => {
            output.innerHTML = `<p class="r">Upload Failed (Network Error)</p>`;
        };
        xhr.send(formData);
    });
    window.copyLink = () => {
        const link = document.getElementById("fileLink");
        link.select();
        document.execCommand("copy");
        showSuccess("Copied To Clipboard!");
    };
}