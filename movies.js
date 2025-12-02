let BACKEND = `${a}`;
let MOVIE_CACHE = [];
document.getElementById("applyFile").addEventListener("change", () => {
    const file = document.getElementById("applyFile").files[0];
    const label = document.getElementById("selectedFileName");
    if (file) {
        label.innerText = "Selected: " + file.name;
    } else {
        label.innerText = "";
    }
});
function uploadApply() {
    const file = document.getElementById("applyFile").files[0];
    if (!file) return alert("Choose A File");
    const uploadURL = BACKEND + "/api/upload_apply_x9a7b2";
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadURL);
    xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
    xhr.upload.addEventListener("progress", e => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            const container = document.getElementById("progressContainer");
            const bar = document.getElementById("progressBar");
            container.style.display = "flex";
            bar.style.width = percent + "%";
            bar.innerText = percent + "%";
        }
    });
    xhr.onload = () => {
        let result;
        try { result = JSON.parse(xhr.responseText); }
        catch (err) {
            document.getElementById("upload-status").innerText = "Upload failed (bad response)";
            return;
        }
        if (!result.ok) {
            document.getElementById("upload-status").innerText =
                "Upload Failed: " + result.message;
            return;
        }
        document.getElementById("upload-status").innerText =
            "Uploaded: " + result.filename;
        setTimeout(() => {
            document.getElementById("progressContainer").style.display = "none";
            document.getElementById("progressBar").style.width = "0%";
            document.getElementById("progressBar").innerText = "";
        }, 800);
        loadMovies();
    };
    xhr.send(formData);
}
async function loadMovies() {
    const url = BACKEND + "/api/list_videos_x9a7b2";
    const box = document.getElementById("movies");
    box.innerHTML = "Loading...";
    try {
        const res = await fetch(url, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        const data = await res.json();
        if (!data.ok) {
            box.innerHTML = "Failed To Load Movies";
            return;
        }
        MOVIE_CACHE = data.videos;
        renderMovies(data.videos);
    } catch (e) {
        box.innerHTML = "Could Not Reach Server.";
    }
}
function renderMovies(list) {
    const box = document.getElementById("movies");
    box.innerHTML = "";
    list.forEach(v => {
        const dlURL = `${BACKEND}/download/x9a7b2/${v.name}`;
        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `
            <b>${v.name}</b> — ${v.humanSize}<br><br>
            <button onclick="openWatchPanel('${v.name}')">Watch</button>
            <a href="${dlURL}">
                <button style="background:#ffa800;">Download</button>
            </a>
        `;
        box.appendChild(div);
    });
}
function filterMovies() {
    const term = document.getElementById("search").value.toLowerCase();
    const filtered = MOVIE_CACHE.filter(m =>
        m.name.toLowerCase().includes(term)
    );
    renderMovies(filtered);
}
function openWatchPanel(name) {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const streamURL = BACKEND + "/movies/x9a7b2/" + name;
    player.src = streamURL;
    player.play();
    panel.style.display = "flex";
}
function closeWatchPanel() {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    player.pause();
    player.src = "";
    panel.style.display = "none";
}
loadMovies();