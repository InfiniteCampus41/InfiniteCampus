import { auth } from "./imports.js";
let BACKEND = `${a}`;
let applyBK = `${a}`;
let MOVIE_CACHE = [];
let finishingTimeout = null;
let FIREBASE_AVAILABLE = true;
let MOVIE_LOAD_ID = 0;
let lastUploadTime = Date.now();
let currentlyOpenActions = null;
let finishingWatcher = null;
let currentSubtitleBlobUrl = null;
const currentfile = document.getElementById("currentFile");
const movies = document.getElementById("movies");
const section = document.getElementById("section");
async function fetchAPI(endpoint, body) {
    const token = null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(`${a}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Request failed");
    }
    return json;
}
function pathToArray(path) {
    return path.split("/").filter(Boolean);
}
async function dbGet(path) {
    const res = await fetchAPI("read", { path: pathToArray(path) });
    return res.data;
}
document.getElementById("applyFile").addEventListener("change", () => {
    const file = document.getElementById("applyFile").files[0];
    const label = document.getElementById("selectedFileName");
    if (file) {
        label.innerText = "Selected: " + file.name;
    } else {
        label.innerText = "";
    }
});
function sanitizeUsername(name) {
    if (!name) return "An Anonymous User";
    return name
        .normalize("NFKD")
        .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "")
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "")
        .trim() || "An Anonymous User";
}
async function uploadApply() {
    const file = document.getElementById("applyFile").files[0];
    if (!file) return showError("Choose A File");
    const uploadURL = applyBK + "/api/upload_apply_x9a7b2";
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    const bar = document.getElementById("progressBar");
    const container = document.getElementById("progressContainer");
    const percentText = document.getElementById("progressPercent");
    const uploadingText = document.getElementById("uploadingText");
    container.style.display = "block";
    let dotCount = 0;
    const dotInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        uploadingText.innerText = "Uploading" + " .".repeat(dotCount);
    }, 500);
    finishingWatcher = setInterval(() => {
        const now = Date.now();
        if (now - lastUploadTime > 1500) {
            percentText.innerText = "Finishing Up, This May Take A While";
            document.getElementById("uploadingText").style.display = "none";
            clearInterval(finishingWatcher);
        }
    }, 300);
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const currentUser = auth.currentUser;
        let displayName = "User";
        let uid = "unknown";
        if (currentUser) {
            uid = currentUser.uid;
            try {
                const snap = await dbGet("users/" + uid + "/profile/displayName");
                if (snap !== null && snap !== undefined) {
                    displayName = sanitizeUsername(snap);
                }
            } catch (err) {
                console.error("Failed To Fetch DisplayName:", err);
            }
        }
        const res = await fetch(uploadURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                fileId: fileId,
                chunkIndex: i,
                totalChunks: totalChunks,
                filename: file.name,
                uploadedBy: displayName,
                "x-user-id": uid,
                "ngrok-skip-browser-warning": "true"
            },
            body: chunk
        });
        const data = await res.json();
        lastUploadTime = Date.now();
        if (!data.ok) {
            clearInterval(dotInterval);
            if (finishingTimeout) clearTimeout(finishingTimeout);
            percentText.innerText = "Uploaded!";
            document.getElementById("upload-status").innerText =
                "Upload Failed: " + data.message;
            return;
        }
        let percent = Math.round(((i + 1) / totalChunks) * 100);
        if (percent < 1) percent = 0;
        bar.style.width = percent + "%";
        percentText.innerText = percent + "%";
    }
    clearInterval(dotInterval);
    uploadingText.innerText = "";
    if (finishingTimeout) clearTimeout(finishingTimeout);
    percentText.innerText = "Uploaded!";
    document.getElementById("upload-status").innerText =
        "Uploaded: " + file.name;
    setTimeout(() => {
        container.style.display = "none";
        bar.style.width = "0%";
        percentText.innerText = "";
    }, 1000);
    loadMovies();
    if (finishingWatcher) clearInterval(finishingWatcher);
}
async function loadMovies() {
    const url = BACKEND + "/api/list_videos_x9a7b2";
    const box = document.getElementById("movies");
    const loadId = ++MOVIE_LOAD_ID;
    box.innerHTML = "Loading...";
    try {
        const res = await fetch(url, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        const data = await res.json();
        if (loadId !== MOVIE_LOAD_ID) return;
        if (!data.ok) {
            box.innerHTML = "Failed To Load Movies";
            return;
        }
        MOVIE_CACHE = data.videos;
        await renderMovies(data.videos, loadId);
    } catch (e) {
        if (loadId !== MOVIE_LOAD_ID) return;
        showError("Failed To Load Movies, Check Server Status");
        box.innerHTML = "Could Not Reach Server.";
    }
}
function fitTextToWidth(element, maxFont = 16, minFont = 8) {
    let fontSize = maxFont;
    element.style.fontSize = fontSize + "px";
    while (element.scrollWidth > element.clientWidth && fontSize > minFont) {
        fontSize -= 0.5;
        element.style.fontSize = fontSize + "px";
    }
}
async function renderMovies(list, loadId = MOVIE_LOAD_ID) {
    const box = document.getElementById("movies");
    box.innerHTML = "";
    for (const v of list) {
        if (loadId !== MOVIE_LOAD_ID) return;
        let uploaderName = "";
        if (FIREBASE_AVAILABLE && v.uploadedBy && v.uploadedBy !== "") {
            try {
                const snap = await dbGet("users/" + v.uploadedBy + "/profile/displayName");
                if (snap !== null && snap !== undefined) {
                    uploaderName = `@${snap}`;
                }
            } catch (err) {
                console.error("Database Connection Failed:", err);
                FIREBASE_AVAILABLE = false;
            }
        }
        const ccBadge = v.subtitleUrl
            ? `<i class="ic ic-badge-cc-fill" title="Subtitles Available" style="width:100%;color:white;position:absolute;right:-45%;transform:translateY(-20%);"></i>`
            : "";

        const movieDiv = document.createElement("div");
        movieDiv.className = "movie-card";
        movieDiv.style.width = "200px";
        movieDiv.style.height = "300px";
        movieDiv.style.backgroundSize = "cover";
        movieDiv.style.backgroundPosition = "center";
        movieDiv.style.cursor = "pointer";
        movieDiv.style.position = "relative";
        movieDiv.style.marginBottom = "20px";
        movieDiv.style.color = "white";
        movieDiv.style.borderRadius = "12px";
        movieDiv.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
        movieDiv.innerHTML = `
            <img src="${v.cover || ""}" alt="${v.name} Cover" style="height:300px;width:200px;border-radius:12px;position:absolute;z-index:3;display:flex;" />
            <div class="movie-actions" style="height:100%;width:100%;opacity:0;pointer-events:none;position:absolute;z-index:4;display:flex;flex-direction:column;transition:opacity 0.3s ease;">
                <div style="top:0px;position:absolute;width:100%;justify-content:center;align-items:center;display:flex;padding:0px 10px;background:rgba(0,0,0,0.8);height:40px;flex-direction:column;border-top-left-radius:12px;border-top-right-radius:12px;">
                    <span style="display:flex;align-items:center;width:100%;white-space:nowrap;overflow:hidden;">
                        <span class="movie-title" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${v.name}</span>
                    </span>
                    <div style="width:100%;position:relative;display:flex;justify-content:center;align-items:center;">
                        <small style="font-size:0.7em;">
                            ${v.humanSize}
                        </small>
                        ${ccBadge}
                    </div>
                </div>
                <div style="bottom:0px;position:absolute;width:100%;display:flex;padding:0px 10px;background:rgba(0,0,0,0.8);height:40px;align-items:center;flex-direction:column;height:60px;border-bottom-left-radius:12px;border-bottom-right-radius:12px;">
                    <div style="padding:3px;display:flex;justify-content:space-between;width:100%;">
                        <button class="button watch-btn">
                            Watch
                        </button>
                        <a href="${BACKEND}/download/x9a7b2/${v.name}" target="_blank">
                            <button class="button download-btn">
                                Download
                            </button>
                        </a>
                    </div>
                    <small style="font-size:0.7em;color:#ccc;margin-top:-3px;">
                        <a href="InfiniteAccounts.html?user=${v.uploadedBy}" style="text-decoration:none;">
                            Uploaded By: ${uploaderName}
                        </a>
                    </small>
                </div>
            </div>
        `;
        movieDiv.addEventListener("click", (e) => {
            const actions = movieDiv.querySelector(".movie-actions");
            if (currentlyOpenActions && currentlyOpenActions !== actions) {
                currentlyOpenActions.style.opacity = "0";
                currentlyOpenActions.style.pointerEvents = "none";
            }
            const isOpen = actions.style.opacity === "1";
            if (isOpen) {
                actions.style.opacity = "0";
                actions.style.pointerEvents = "none";
                currentlyOpenActions = null;
            } else {
                actions.style.opacity = "1";
                actions.style.pointerEvents = "auto";
                currentlyOpenActions = actions;
            }
        });
        movieDiv.querySelector(".watch-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openWatchPanel(v.name, v.subtitleUrl || null);
        });
        box.appendChild(movieDiv);
        const titleEl = movieDiv.querySelector(".movie-title");
        fitTextToWidth(titleEl);
    }
}
function filterMovies() {
    const term = document.getElementById("search").value.toLowerCase();
    const filtered = MOVIE_CACHE.filter(m =>
        m.name.toLowerCase().includes(term)
    );
    renderMovies(filtered);
}
(function buildPlayerDOM() {
    const panel = document.getElementById("watchPanel");
    if (!panel) return;
    const video = document.getElementById("watchVideo");
    panel.innerHTML = `
        <div id="vp-wrapper">
            <div id="vp-ui">
                <button id="vp-center-btn" aria-label="Play/Pause">
                    <i class="ic ic-pause-fill">
                    </i>
                </button>
                <div id="vp-controls">
                    <div id="vp-top-row">
                        <span id="vp-time">
                            0:00 / 0:00
                        </span>
                        <div id="vp-progress-track">
                            <div id="vp-progress-fill">
                                <div id="vp-progress-dot">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="vp-btn-row">
                        <button class="vp-btn" id="vp-play-btn-desktop" aria-label="Play/Pause">
                            <i class="ic ic-pause-fill">
                            </i>
                        </button>
                        <div class="vp-spacer">
                        </div>
                        <div id="vp-vol-wrap">
                            <button class="vp-btn" id="vp-vol-btn" aria-label="Mute/Unmute">
                                <i class="ic ic-volume-up-fill">
                                </i>
                            </button>
                            <div id="vp-vol-slider-wrap">
                                <input type="range" id="vp-vol-slider" min="0" max="100" value="100" aria-label="Volume">
                            </div>
                        </div>
                        <button class="vp-btn" id="vp-cc-btn" aria-label="Toggle Captions" title="Captions (C)">
                            <i class="ic ic-badge-cc-fill">
                            </i>
                        </button>
                        <button class="vp-btn" id="vp-fs-btn" aria-label="Fullscreen" title="Fullscreen (F)">
                            <i class="ic ic-fullscreen">
                            </i>
                        </button>
                        <div id="vp-menu-wrap">
                            <button class="vp-btn" id="vp-dots-btn" aria-label="More Options">
                                <i class="ic ic-three-dots-vertical">
                                </i>
                            </button>
                            <div id="vp-dropup">
                                <div id="vp-menu-main">
                                    <button class="vp-menu-item" id="vp-download-btn">
                                        <i class="ic ic-download">
                                        </i>
                                        Download
                                    </button>
                                    <button class="vp-menu-item" id="vp-speed-btn">
                                        <i class="ic ic-speedometer">
                                        </i>
                                        Playback Speed
                                        <i class="ic ic-chevron-right">
                                        </i>
                                    </button>
                                    <button class="vp-menu-item" id="vp-pip-btn">
                                        <i class="ic ic-pip">
                                        </i>
                                        Picture In Picture
                                    </button>
                                </div>
                                <div id="vp-menu-speed" style="display:none;">
                                    <button class="vp-menu-item vp-menu-back" id="vp-speed-back">
                                        <i class="ic ic-chevron-left">
                                        </i>
                                        Back
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="0.25">
                                        0.25
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="0.5">
                                        0.5
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="0.75">
                                        0.75
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt selected" data-rate="1">
                                        Normal
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="1.25">
                                        1.25
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>                                        
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="1.5">
                                        1.5
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>                                        
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="1.75">
                                        1.75
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>                                        
                                        </span>
                                    </button>
                                    <button class="vp-menu-item vp-speed-opt" data-rate="2">
                                        2
                                        <span class="vp-menu-check">
                                            <i class="ic ic-check2">
                                            </i>                                        
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="networkWarning">
            Slow Network Detected
        </div>
    `;
    const wrapper = document.getElementById("vp-wrapper");
    wrapper.insertBefore(video, wrapper.firstChild);
})();
let _vpCurrentSrc = "";
let _vpHideTimer = null;
let _vpCCOn = false;
let _vpDragging = false;
function fmtTime(s, showHours = false) {
    if (isNaN(s) || s < 0) s = 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    if (showHours || h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${sec}`;
    }
    return `${m}:${sec}`;
}
function vpShowUI(autoHide = true) {
    const ui = document.getElementById("vp-ui");
    if (!ui) return;
    ui.classList.add("visible");
    if (autoHide) vpScheduleHide();
}
function vpHideUI() {
    const ui = document.getElementById("vp-ui");
    if (ui) ui.classList.remove("visible");
}
function vpScheduleHide() {
    clearTimeout(_vpHideTimer);
    _vpHideTimer = setTimeout(() => {
        const video = document.getElementById("watchVideo");
        if (video && !video.paused) vpHideUI();
    }, 2800);
}
function vpCancelHide() {
    clearTimeout(_vpHideTimer);
}
function vpUpdateProgress() {
    const video = document.getElementById("watchVideo");
    const fill = document.getElementById("vp-progress-fill");
    const timeEl = document.getElementById("vp-time");
    if (!video || !fill || !timeEl) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    fill.style.width = pct + "%";
    const showHours = (video.duration || 0) >= 3600;
    timeEl.textContent = `${fmtTime(video.currentTime, showHours)} / ${fmtTime(video.duration, showHours)}`;
}
function vpUpdatePlayIcon() {
    const video = document.getElementById("watchVideo");
    const centerBtn = document.getElementById("vp-center-btn");
    const desktopBtn = document.getElementById("vp-play-btn-desktop");
    const paused = !video || video.paused;
    const icon = paused ? `<i class="ic ic-play-fill"></i>` : `<i class="ic ic-pause-fill"></i>`;
    if (centerBtn) centerBtn.innerHTML = icon;
    if (desktopBtn) desktopBtn.innerHTML = icon;
}
function vpUpdateVolIcon() {
    const video = document.getElementById("watchVideo");
    const icon = document.getElementById("vp-vol-btn");
    if (!icon || !video) return;
    const muted = video.muted || video.volume === 0;
    if (muted) {
        icon.innerHTML = `<i class="ic ic-volume-mute-fill"></i>`;
    } else {
        icon.innerHTML = `<i class="ic ic-volume-up-fill"></i>`;
    }
}
function vpUpdateVolSlider() {
    const video = document.getElementById("watchVideo");
    const slider = document.getElementById("vp-vol-slider");
    if (!video || !slider) return;
    const pct = video.muted ? 0 : Math.round(video.volume * 100);
    slider.value = pct;
    slider.style.setProperty("--vol-pct", pct + "%");
}
function vpUpdateCCIcon() {
    const icon = document.getElementById("vp-cc-btn");
    if (icon) icon.style.opacity = _vpCCOn ? "1" : "0.45";
}
function vpToggleCC() {
    const video = document.getElementById("watchVideo");
    if (!video) return;
    _vpCCOn = !_vpCCOn;
    for (const track of video.textTracks) {
        track.mode = _vpCCOn ? "showing" : "hidden";
    }
    vpUpdateCCIcon();
}
function vpTogglePlay() {
    const video = document.getElementById("watchVideo");
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
}
function vpToggleMute() {
    const video = document.getElementById("watchVideo");
    if (!video) return;
    video.muted = !video.muted;
    vpUpdateVolIcon();
    vpUpdateVolSlider();
}
function vpToggleFullscreen() {
    const wrapper = document.getElementById("vp-wrapper");
    if (!wrapper) return;
    if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}
function vpToggleFullscreenIcon() {
    const fsIcon = document.getElementById("vp-fs-btn");
    if (!document.fullscreenElement) {
        if (fsIcon) fsIcon.innerHTML = `<i class="ic ic-fullscreen"></i>`;
    } else {
        if (fsIcon) fsIcon.innerHTML = `<i class="ic ic-fullscreen-exit"></i>`;
    }
}
function vpCloseDropup() {
    const drop = document.getElementById("vp-dropup");
    if (drop) drop.classList.remove("open");
    const main = document.getElementById("vp-menu-main");
    const speed = document.getElementById("vp-menu-speed");
    if (main) main.style.display = "";
    if (speed) speed.style.display = "none";
}
(function attachPlayerEvents() {
    const wrapper = document.getElementById("vp-wrapper");
    const video = document.getElementById("watchVideo");
    const ui = document.getElementById("vp-ui");
    if (!wrapper || !video) return;
    video.addEventListener("timeupdate", vpUpdateProgress);
    video.addEventListener("durationchange", vpUpdateProgress);
    video.addEventListener("play", () => { vpUpdatePlayIcon(); vpScheduleHide(); });
    video.addEventListener("pause", () => { vpUpdatePlayIcon(); vpShowUI(false); vpCancelHide(); });
    wrapper.addEventListener("mouseenter", () => vpShowUI());
    wrapper.addEventListener("mousemove", () => vpShowUI());
    wrapper.addEventListener("mouseleave", () => {
        if (video && !video.paused) vpHideUI();
    });
    wrapper.addEventListener("click", (e) => {
        if (e.target.closest("#vp-controls") || e.target.closest("#vp-center-btn")) return;
        const isDesktop = window.matchMedia("(hover: hover)").matches;
        if (isDesktop) {
            vpTogglePlay();
            vpShowUI();
        } else {
            if (ui.classList.contains("visible")) {
                vpHideUI();
            } else {
                vpShowUI(false);
            }
        }
    });
    document.getElementById("vp-center-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        vpTogglePlay();
        vpScheduleHide();
    });
    document.getElementById("vp-play-btn-desktop")?.addEventListener("click", (e) => {
        e.stopPropagation();
        vpTogglePlay();
    });
    const track = document.getElementById("vp-progress-track");
    track?.addEventListener("mousedown", (e) => {
        _vpDragging = true;
        vpSeekTo(e, track);
    });
    track?.addEventListener("touchstart", (e) => {
        _vpDragging = true;
        vpSeekTo(e.touches[0], track);
    }, { passive: true });
    document.addEventListener("mousemove", (e) => {
        if (_vpDragging) vpSeekTo(e, track);
    });
    document.addEventListener("touchmove", (e) => {
        if (_vpDragging) vpSeekTo(e.touches[0], track);
    }, { passive: true });
    document.addEventListener("mouseup", () => { _vpDragging = false; });
    document.addEventListener("touchend", () => { _vpDragging = false; });
    document.getElementById("vp-vol-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        vpToggleMute();
        vpShowUI();
    });
    const volSlider = document.getElementById("vp-vol-slider");
    volSlider?.addEventListener("input", (e) => {
        const v = parseInt(e.target.value) / 100;
        video.volume = v;
        video.muted = (v === 0);
        vpUpdateVolIcon();
        volSlider.style.setProperty("--vol-pct", e.target.value + "%");
    });
    volSlider?.addEventListener("click", (e) => e.stopPropagation());
    document.getElementById("vp-cc-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        vpToggleCC();
        vpShowUI();
    });
    document.getElementById("vp-fs-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        vpToggleFullscreen();
        vpShowUI();
    });
    document.getElementById("vp-dots-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const drop = document.getElementById("vp-dropup");
        if (drop) drop.classList.toggle("open");
        vpShowUI(false);
    });
    document.getElementById("vp-download-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (_vpCurrentSrc) {
            const a = document.createElement("a");
            a.href = _vpCurrentSrc;
            a.download = "";
            a.target = "_blank";
            a.click();
        }
        vpCloseDropup();
    });
    document.getElementById("vp-speed-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("vp-menu-main").style.display = "none";
        document.getElementById("vp-menu-speed").style.display = "";
    });
    document.getElementById("vp-speed-back")?.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("vp-menu-main").style.display = "";
        document.getElementById("vp-menu-speed").style.display = "none";
    });
    document.querySelectorAll(".vp-speed-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const rate = parseFloat(btn.dataset.rate);
            video.playbackRate = rate;
            document.querySelectorAll(".vp-speed-opt").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            vpCloseDropup();
            vpShowUI();
        });
    });
    document.getElementById("vp-pip-btn")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.warn("PiP not supported:", err);
        }
        vpCloseDropup();
    });
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#vp-menu-wrap")) vpCloseDropup();
    });
    document.getElementById("vp-controls")?.addEventListener("mouseenter", () => {
        vpCancelHide();
        ui.classList.add("visible");
    });
    document.getElementById("vp-controls")?.addEventListener("mouseleave", () => {
        vpScheduleHide();
    });
})();
function vpSeekTo(e, track) {
    const video = document.getElementById("watchVideo");
    if (!video || !track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    video.currentTime = pct * (video.duration || 0);
    vpUpdateProgress();
}
document.addEventListener("keydown", (e) => {
    const panel = document.getElementById("watchPanel");
    if (!panel || panel.style.display !== "flex") return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const video = document.getElementById("watchVideo");
    switch (e.key.toLowerCase()) {
        case " ":
        case "k":
            e.preventDefault();
            vpTogglePlay();
            vpShowUI();
            break;
        case "j":
        case "arrowleft":
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - 5);
            vpShowUI();
            break;
        case "l":
        case "arrowright":
            e.preventDefault();
            video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
            vpShowUI();
            break;
        case "arrowup":
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.05);
            video.muted = false;
            vpUpdateVolIcon();
            vpUpdateVolSlider();
            vpShowUI();
            break;
        case "arrowdown":
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.05);
            vpUpdateVolIcon();
            vpUpdateVolSlider();
            vpShowUI();
            break;
        case "m":
            vpToggleMute();
            vpShowUI();
            vpUpdateVolIcon();
            break;
        case "c":
            vpToggleCC();
            vpShowUI();
            break;
        case "f":
            vpToggleFullscreen();
            vpShowUI();
            break;
    }
});
document.addEventListener("fullscreenchange", () => {
    vpToggleFullscreenIcon();
    vpShowUI();
});
async function openWatchPanel(name, subtitleUrl = null) {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const before = document.getElementById("before");
    section.style.display = "none";
    movies.style.display = "none";
    before.style.display = "none";
    currentfile.textContent = `Currently Watching: ${name}`;
    currentfile.style.display = "block";
    while (player.firstChild) player.removeChild(player.firstChild);
    _vpCCOn = false;
    vpUpdateCCIcon();
    vpCloseDropup();
    vpHideUI();
    player.playbackRate = 1;
    document.querySelectorAll(".vp-speed-opt").forEach(b => {
        b.classList.toggle("selected", b.dataset.rate === "1");
    });
    if (subtitleUrl) {
        try {
            const vttRes = await fetch(BACKEND + subtitleUrl);
            const vttText = await vttRes.text();
            const blob = new Blob([vttText], { type: "text/vtt" });
            const blobUrl = URL.createObjectURL(blob);
            const track = document.createElement("track");
            currentSubtitleBlobUrl = blobUrl;
            track.kind = "subtitles";
            track.label = "English";
            track.srclang = "en";
            track.src = blobUrl;
            track.default = false;
            player.appendChild(track);
        } catch (err) {
            console.warn("Could not load subtitles:", err);
        }
    }
    const streamURL = BACKEND + "/movies/x9a7b2/" + name;
    _vpCurrentSrc = streamURL;
    player.src = streamURL;
    player.play();
    panel.style.display = "flex";
    const dlBtn = document.getElementById("vp-download-btn");
    if (dlBtn) dlBtn.dataset.src = streamURL;
    vpUpdateVolIcon();
    vpUpdateVolSlider();
    vpUpdatePlayIcon();
}
function closeWatchPanel() {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const before = document.getElementById("before");
    player.pause();
    player.src = "";
    _vpCurrentSrc = "";
    if (currentSubtitleBlobUrl) {
        URL.revokeObjectURL(currentSubtitleBlobUrl);
        currentSubtitleBlobUrl = null;
    }
    while (player.firstChild) player.removeChild(player.firstChild);
    panel.style.display = "none";
    vpHideUI();
    vpCancelHide();
    before.style.display = "block";
    currentfile.style.display = "none";
    currentfile.textContent = "";
    section.style.display = "block";
    movies.style.display = "flex";
}
window.openWatchPanel = openWatchPanel;
window.closeWatchPanel = closeWatchPanel;
loadMovies();
const networkWarning = document.getElementById("networkWarning");
const SPEED_THRESHOLD_MS = 750;
async function checkNetworkSpeed() {
    const testURL = BACKEND + "/ping";
    const start = performance.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        await fetch(testURL, { signal: controller.signal });
        clearTimeout(timeout);
        const duration = performance.now() - start;
        if (duration > SPEED_THRESHOLD_MS) {
            networkWarning.style.display = "block";
        } else {
            networkWarning.style.display = "none";
        }
    } catch (err) {
        networkWarning.style.display = "block";
    }
}
window.loadMovies = loadMovies;
window.filterMovies = filterMovies;
window.uploadApply = uploadApply;
checkNetworkSpeed();
setInterval(checkNetworkSpeed, 5000);