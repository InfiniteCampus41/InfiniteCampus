import { auth } from "./imports.js";
let BACKEND = `${a}`;
let applyBK = `${a}`;
let MOVIE_CACHE = [];
let CURRENT_SORT = "order";
let CURRENT_CATEGORY = "all";
let CURRENT_VIEW = "grid";
let currentlyOpenMoreMenu = null;
let finishingTimeout = null;
let FIREBASE_AVAILABLE = true;
let MOVIE_LOAD_ID = 0;
let isLoadingMovies = false;
let lastUploadTime = Date.now();
let finishingWatcher = null;
let currentSubtitleBlobUrl = null;
let autoOpenedMovie = false;
let moviesStatusPoll = null;
let MOVIES_LOCKED_DOWN = false;
let movieLockdownSource = null;
let manuallySelectedMovie = false;
const currentfile = document.getElementById("currentFile");
const movies = document.getElementById("movies");
const section = document.getElementById("section");
document.getElementById("watchVideo")?.addEventListener("error", () => {
    if (document.getElementById("watchPanel")?.style.display !== "flex") return;
    fetch(BACKEND + "/movies_status_x9a7b2", { headers: { "ngrok-skip-browser-warning": "true" } })
        .then(r => r.json())
        .then(data => {
            if (data && data.disabled) {
                showError("Movies Have Been Taken Down By An Admin");
                closeWatchPanel();
            }
        })
        .catch(() => {});
});
function handleMovieLockdownUpdate(disabled) {
    MOVIES_LOCKED_DOWN = !!disabled;
    if (!MOVIES_LOCKED_DOWN) return;
    if (document.getElementById("watchPanel")?.style.display === "flex") {
        showError("Movies Have Been Taken Down By An Admin");
        closeWatchPanel();
    }
}
function initMovieLockdownListener() {
    if (movieLockdownSource || typeof EventSource === "undefined") return;
    try {
        movieLockdownSource = new EventSource(BACKEND + "/movies_lockdown_stream_x9a7b2");
        movieLockdownSource.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                handleMovieLockdownUpdate(data?.disabled);
            } catch {}
        };
        movieLockdownSource.onerror = () => {
        };
    } catch (err) {
        console.warn("Movie Lockdown Live Listener Unavailable:", err);
    }
}
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
function normalizeForSearch(str) {
    return str.toLowerCase().replace(/_/g, " ");
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
})
function updateMovieURL(movieName = null) {
    const url = new URL(window.location);
    if (movieName) {
        url.searchParams.set("movie", movieName);
    } else {
        url.searchParams.delete("movie");
    }
    history.replaceState({}, "", url);
}
function getMovieFromURL() {
    return new URLSearchParams(window.location.search).get("movie");
}
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
    const uploadURL = applyBK + "/upload_apply_x9a7b2";
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
        uploadingText.style.display = "block";
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
function sortMovieList(list) {
    const sorted = [...list];
    if (CURRENT_SORT === "name") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (CURRENT_SORT === "popularity") {
        sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
        sorted.sort((a, b) => (a.order ?? 99999999) - (b.order ?? 99999999));
    }
    return sorted;
}
function setSortMode(mode) {
    CURRENT_SORT = mode;
    filterMovies();
}
window.setSortMode = setSortMode;
async function loadMovies() {
    const url = BACKEND + "/list_videos_x9a7b2";
    const box = document.getElementById("movies");
    const loadId = ++MOVIE_LOAD_ID;
    isLoadingMovies = true;
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
        renderCategories(MOVIE_CACHE);
        const term = normalizeForSearch(document.getElementById("search")?.value || "");
        let filtered = term
            ? data.videos.filter(m => normalizeForSearch(m.name).includes(term))
            : data.videos;
        filtered = applyCategoryFilter(filtered);
        await renderMovies(sortMovieList(filtered), loadId);
    } catch (e) {
        if (loadId !== MOVIE_LOAD_ID) return;
        showError("Failed To Load Movies, Check Server Status");
        box.innerHTML = "Could Not Reach Server.";
    } finally {
        if (loadId === MOVIE_LOAD_ID) isLoadingMovies = false;
    }
}
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
async function renderMovies(list, loadId = MOVIE_LOAD_ID) {
    const box = document.getElementById("movies");
    box.innerHTML = "";
    currentlyOpenMoreMenu = null;
    for (const v of list) {
        if (loadId !== MOVIE_LOAD_ID) return;
        let uploaderName = "An Anonymous User";
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
            ? `<span class="ic-movie-cc-badge" title="Subtitles Available"><i class="ic ic-badge-cc-fill"></i></span>`
            : "";
        const ratingBadge = v.rating
            ? `<span class="ic-movie-rating"><i class="ic ic-star-fill"></i> ${v.rating}</span>`
            : "";
        const year = v.releaseYear || "";
        const tags = Array.isArray(v.tags) ? v.tags : [];
        const tagsHtml = tags.length
            ? `<div class="ic-movie-tags">${tags.map(t => `<span class="ic-movie-tag">${escapeHtml(t)}</span>`).join("")}</div>`
            : "";
        const metaBits = [];
        if (year) metaBits.push(`<span class="ic-movie-year">${escapeHtml(year)}</span>`);
        metaBits.push(`<span class="ic-movie-size">${escapeHtml(v.humanSize)}</span>`);
        if (v.popularity) metaBits.push(`<span class="ic-movie-views">${v.popularity} view${v.popularity === 1 ? "" : "s"}</span>`);
        const movieDiv = document.createElement("div");
        movieDiv.className = "ic-movie-card";
        movieDiv.innerHTML = `
            <div class="ic-movie-poster">
                <img src="${v.proxiedthumb ? BACKEND + v.proxiedthumb : (v.cover || "")}" alt="${escapeHtml(v.name)} Cover" loading="lazy" />
                ${ratingBadge}
                ${ccBadge}
            </div>
            <div class="ic-movie-info">
                <span class="ic-movie-title" title="${escapeHtml(v.name)}">${escapeHtml(v.name)}</span>
                <div class="ic-movie-meta">${metaBits.join("")}</div>
                ${tagsHtml}
                <div class="ic-movie-actions-row">
                    <button class="ic-btn ic-btn-primary ic-movie-watch-btn">
                        <i class="ic ic-play-fill"></i> Watch
                    </button>
                    <div class="ic-movie-more-wrap">
                        <button class="ic-btn ic-btn-secondary ic-movie-more-btn" title="More Options">
                            <i class="ic ic-three-dots-vertical"></i>
                        </button>
                        <div class="ic-movie-more-menu">
                            <a class="ic-movie-more-item" href="${BACKEND}/download/x9a7b2/${v.name}" target="_blank">
                                <i class="ic ic-download"></i> Download
                            </a>
                            <a class="ic-movie-more-item" href="InfiniteAccounts.html?user=${v.uploadedBy}">
                                <i class="ic ic-person-fill"></i> ${escapeHtml(uploaderName)}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        movieDiv.querySelector(".ic-movie-watch-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            manuallySelectedMovie = true;
            openWatchPanel(v.name, v.subtitleUrl || null);
        });
        const moreBtn = movieDiv.querySelector(".ic-movie-more-btn");
        const moreMenu = movieDiv.querySelector(".ic-movie-more-menu");
        moreBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentlyOpenMoreMenu && currentlyOpenMoreMenu !== moreMenu) {
                currentlyOpenMoreMenu.classList.remove("open");
            }
            const isOpen = moreMenu.classList.contains("open");
            moreMenu.classList.toggle("open", !isOpen);
            currentlyOpenMoreMenu = isOpen ? null : moreMenu;
        });
        box.appendChild(movieDiv);
    }
}
document.addEventListener("click", (e) => {
    if (currentlyOpenMoreMenu && !currentlyOpenMoreMenu.contains(e.target)) {
        currentlyOpenMoreMenu.classList.remove("open");
        currentlyOpenMoreMenu = null;
    }
});
function applyCategoryFilter(list) {
    if (CURRENT_CATEGORY === "all") return list;
    return list.filter(m => Array.isArray(m.tags) && m.tags.includes(CURRENT_CATEGORY));
}
function filterMovies() {
    if (isLoadingMovies) {
        loadMovies();
        return;
    }
    const loadId = ++MOVIE_LOAD_ID;
    const term = normalizeForSearch(document.getElementById("search").value);
    let filtered = MOVIE_CACHE.filter(m =>
        normalizeForSearch(m.name).includes(term)
    );
    filtered = applyCategoryFilter(filtered);
    renderMovies(sortMovieList(filtered), loadId);
}
function setCategory(tag) {
    CURRENT_CATEGORY = tag;
    document.querySelectorAll(".ic-movies-cat-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tag === tag);
    });
    filterMovies();
}
window.setCategory = setCategory;
function setMoviesView(view) {
    CURRENT_VIEW = view;
    movies.classList.toggle("view-list", view === "list");
    const gridBtn = document.getElementById("gridViewBtn");
    const listBtn = document.getElementById("listViewBtn");
    if (gridBtn) gridBtn.classList.toggle("active", view === "grid");
    if (listBtn) listBtn.classList.toggle("active", view === "list");
}
window.setMoviesView = setMoviesView;
function renderCategories(list) {
    const box = document.getElementById("categoriesList");
    if (!box) return;
    const counts = new Map();
    for (const m of list) {
        if (!Array.isArray(m.tags)) continue;
        for (const tag of m.tags) {
            counts.set(tag, (counts.get(tag) || 0) + 1);
        }
    }
    const sortedTags = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    let html = `
        <button class="ic-movies-cat-btn ${CURRENT_CATEGORY === "all" ? "active" : ""}" data-tag="all" onclick="setCategory('all')">
            <i class="ic ic-collection-play-fill"></i>
            <span class="ic-movies-cat-name">All Movies</span>
            <span class="ic-movies-cat-count">${list.length}</span>
        </button>
    `;
    for (const [tag, count] of sortedTags) {
        html += `
            <button class="ic-movies-cat-btn ${CURRENT_CATEGORY === tag ? "active" : ""}" data-tag="${tag}" onclick="setCategory('${tag.replace(/'/g, "\\'")}')">
                <i class="ic ic-tag-fill"></i>
                <span class="ic-movies-cat-name">${tag}</span>
                <span class="ic-movies-cat-count">${count}</span>
            </button>
        `;
    }
    box.innerHTML = html;
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
(function buildWatchHeader() {
    if (!currentfile || !currentfile.parentNode) return;
    const header = document.createElement("div");
    header.id = "watch-header";
    header.style.display = "none";
    const backBtn = document.createElement("button");
    backBtn.id = "vp-back-btn";
    backBtn.classList = "button";
    backBtn.type = "button";
    backBtn.setAttribute("aria-label", "Back To Movies");
    backBtn.innerHTML = `<i class="ic ic-chevron-left"></i> Back`;
    backBtn.addEventListener("click", () => closeWatchPanel());
    const div = document.createElement('div');
    currentfile.parentNode.insertBefore(header, currentfile);
    header.appendChild(backBtn);
    div.appendChild(currentfile);
    header.appendChild(div);
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
    video.addEventListener("click", (e) => {
        if (autoOpenedMovie && video.muted) {
            video.muted = false;
            autoOpenedMovie = false;
            vpUpdateVolIcon();
            vpUpdateVolSlider();
        }
        if (e.target.closest("#vp-controls") || e.target.closest("#vp-center-btn")) return;
        const isDesktop = window.matchMedia("(hover: hover)").matches;
        if (isDesktop) {
            vpTogglePlay();
            vpShowUI();
        } else {
            const ui = document.getElementById("vp-ui");
            if (ui && ui.classList.contains("visible")) {
                vpTogglePlay();
                vpShowUI();
            } else {
                vpShowUI();
            }
        }
    });
    ui?.addEventListener("click", (e) => {
        if (e.target.closest("#vp-controls") || e.target.closest("#vp-center-btn")) return;
        const isDesktop = window.matchMedia("(hover: hover)").matches;
        if (isDesktop) {
            vpTogglePlay();
            vpShowUI();
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
    if (MOVIES_LOCKED_DOWN) {
        showError("Movies Have Been Taken Down By An Admin");
        return;
    }
    updateMovieURL(name);
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const before = document.getElementById("before");
    section.style.display = "none";
    movies.style.display = "none";
    before.style.display = "none";
    currentlyOpenMoreMenu = null;
    currentfile.textContent = `Currently Watching: ${name}`;
    currentfile.style.display = "flex";
    const watchHeader = document.getElementById("watch-header");
    if (watchHeader) watchHeader.style.display = "flex";
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
            const vttRes = await fetch(BACKEND + "/subtitles/x9a7b2/" + subtitleUrl);
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
    if (autoOpenedMovie) {
        player.muted = true;
    }
    player.play();
    fetch(BACKEND + "/watch_x9a7b2/" + name, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" }
    }).then(async (res) => {
        try {
            const data = await res.json();
            if (data && typeof data.popularity === "number") {
                const cached = MOVIE_CACHE.find(m => m.name === name);
                if (cached) cached.popularity = data.popularity;
            }
        } catch {}
    }).catch(err => console.warn("Failed To Record Watch:", err));
    panel.style.display = "flex";
    const dlBtn = document.getElementById("vp-download-btn");
    if (dlBtn) dlBtn.dataset.src = streamURL;
    vpUpdateVolIcon();
    vpUpdateVolSlider();
    vpUpdatePlayIcon();
    startMoviesStatusPoll();
}
function startMoviesStatusPoll() {
    stopMoviesStatusPoll();
    moviesStatusPoll = setInterval(async () => {
        try {
            const res = await fetch(BACKEND + "/movies_status_x9a7b2", {
                headers: { "ngrok-skip-browser-warning": "true" }
            });
            const data = await res.json();
            if (data && data.disabled) {
                stopMoviesStatusPoll();
                showError("Movies Have Been Taken Down By An Admin");
                closeWatchPanel();
            }
        } catch (err) {
        }
    }, 4000);
}
function stopMoviesStatusPoll() {
    if (moviesStatusPoll) {
        clearInterval(moviesStatusPoll);
        moviesStatusPoll = null;
    }
}
function closeWatchPanel() {
    const panel = document.getElementById("watchPanel");
    const player = document.getElementById("watchVideo");
    const before = document.getElementById("before");
    stopMoviesStatusPoll();
    updateMovieURL(null);
    autoOpenedMovie = false;
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
    const watchHeader = document.getElementById("watch-header");
    if (watchHeader) watchHeader.style.display = "none";
    currentfile.textContent = "";
    section.style.display = "flex";
    movies.style.removeProperty("display");
}
window.openWatchPanel = openWatchPanel;
window.closeWatchPanel = closeWatchPanel;
loadMovies().then(() => {
    if (manuallySelectedMovie) return;
    const movie = getMovieFromURL();
    if (!movie) return;
    const found = MOVIE_CACHE.find(
        m => m.name.toLowerCase() === decodeURIComponent(movie).toLowerCase()
    );
    if (found && !manuallySelectedMovie) {
        autoOpenedMovie = true;
        openWatchPanel(found.name, found.subtitleUrl || null);
    }
});
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
initMovieLockdownListener();