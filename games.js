;(function () {
    const grid = document.getElementById("glGrid");
    if (!grid) return;
    const searchInput = document.getElementById("glSearch");
    const sortSelect = document.getElementById("glSort");
    const sourceButtonsWrap = document.getElementById("glSourceButtons");
    const prevBtn = document.getElementById("glPrevPage");
    const nextBtn = document.getElementById("glNextPage");
    const PAGE_SIZE = 100;
    let allGames = [];
    let sortBy = "popularity";
    let searchTerm = "";
    let page = 0;
    const SOURCE_STORAGE_KEY = "icGameSource_v1";
    const GAMES_CACHE_PREFIX = "icZoneGamesCache_v1";
    let sources = [];
    let currentSource = null;
    function gamesCacheKey(source) {
        return `${GAMES_CACHE_PREFIX}:${source}`;
    }
    function readGamesCache(source) {
        try {
            const raw = localStorage.getItem(gamesCacheKey(source));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.games)) return null;
            return parsed.games;
        } catch {
            return null;
        }
    }
    function writeGamesCache(source, games) {
        try {
            localStorage.setItem(gamesCacheKey(source), JSON.stringify({ games, savedAt: Date.now() }));
        } catch {}
    }
    function canonicalize(list) {
        return JSON.stringify(list.slice().sort((x, y) => String(x.id).localeCompare(String(y.id))));
    }
    async function loadSources() {
        try {
            const res = await fetch(`${a}/api/game-sources`);
            const data = await res.json();
            if (data && data.ok && Array.isArray(data.sources) && data.sources.length) {
                sources = data.sources;
            } else {
                sources = [{ id: "zone", name: "Zone" }];
            }
        } catch (e) {
            console.error("Failed To Load Game Sources:", e);
            sources = [{ id: "zone", name: "Zone" }];
        }
        const saved = localStorage.getItem(SOURCE_STORAGE_KEY);
        currentSource = (saved && sources.some((s) => s.id === saved)) ? saved : sources[0].id;
        renderSourceButtons();
    }
    function renderSourceButtons() {
        if (!sourceButtonsWrap) return;
        sourceButtonsWrap.innerHTML = "";
        for (const src of sources) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "glSourceBtn" + (src.id === currentSource ? " active" : "");
            btn.textContent = src.name;
            btn.dataset.source = src.id;
            btn.addEventListener("click", () => selectSource(src.id));
            sourceButtonsWrap.appendChild(btn);
        }
        sourceButtonsWrap.style.display = sources.length > 1 ? "" : "none";
    }
    function updateSourceButtonsActive() {
        if (!sourceButtonsWrap) return;
        for (const btn of sourceButtonsWrap.children) {
            btn.classList.toggle("active", btn.dataset.source === currentSource);
        }
    }
    function selectSource(next) {
        if (!next || next === currentSource) return;
        currentSource = next;
        localStorage.setItem(SOURCE_STORAGE_KEY, currentSource);
        updateSourceButtonsActive();
        searchTerm = "";
        if (searchInput) searchInput.value = "";
        page = 0;
        allGames = [];
        render();
        const newUrl = window.location.pathname;
        window.history.replaceState(null, "", newUrl);
        loadGamesData();
    }
    function updateSearchPlaceholder() {
        if (!searchInput) return;
        const count = allGames.length;
        searchInput.placeholder = count > 0 ? `Search ${count - 1}+ Games` : "Search Games";
    }
    async function loadGamesData() {
        const source = currentSource;
        const cached = readGamesCache(source);
        if (cached && cached.length && source === currentSource) {
            allGames = cached;
            render();
        }
        try {
            const res = await fetch(`${a}/api/games/${encodeURIComponent(source)}`);
            const data = await res.json();
            const fresh = (data && data.ok && Array.isArray(data.games)) ? data.games : null;
            if (source !== currentSource) return; // user switched sources while this was in flight
            if (fresh) {
                const changed = !cached || canonicalize(fresh) !== canonicalize(cached);
                writeGamesCache(source, fresh);
                if (changed) {
                    allGames = fresh;
                    render();
                }
            } else if (!cached) {
                allGames = [];
                render();
            }
        } catch (e) {
            console.error("Failed To Load Games:", e);
            if (source !== currentSource) return;
            if (!cached) {
                allGames = [];
                render();
            }
        }
    }
    function getFiltered() {
        let list = allGames.slice();
        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            list = list.filter(g => (g.name || "").toLowerCase().includes(q));
        }
        if (sortBy === "name") {
            list.sort((x, y) => (x.name || "").localeCompare(y.name || ""));
        } else if (sortBy === "date") {
            list.sort((x, y) => (y.dateAdded || 0) - (x.dateAdded || 0));
        } else {
            list.sort((x, y) => (y.popularity || 0) - (x.popularity || 0));
        }
        return list;
    }
    function thumbUrlFor(game) {
        if (!game.hasThumbnail) return null;
        return `${a}/games/${encodeURIComponent(currentSource)}/${encodeURIComponent(game.id)}/thumbnail`;
    }
    let gameLoadInProgress = false;
    let thumbQueue = [];
    function scheduleThumbnail(img, src) {
        if (gameLoadInProgress) {
            thumbQueue.push(() => { img.src = src; });
        } else {
            img.src = src;
        }
    }
    function flushThumbQueue() {
        gameLoadInProgress = false;
        const queued = thumbQueue;
        thumbQueue = [];
        for (const run of queued) run();
    }
    function render() {
        updateSearchPlaceholder();
        const filtered = getFiltered();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (page >= totalPages) page = totalPages - 1;
        if (page < 0) page = 0;
        const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
        grid.innerHTML = "";
        for (const game of pageItems) {
            const card = document.createElement("div");
            card.classList = "glCard niceTitle";
            card.title = game.name;
            const thumb = document.createElement("div");
            thumb.className = "glCardThumb";
            const thumbSrc = thumbUrlFor(game);
            if (thumbSrc) {
                const img = document.createElement("img");
                img.loading = "lazy";
                img.decoding = "async";
                if ("fetchPriority" in img) img.fetchPriority = "low";
                scheduleThumbnail(img, thumbSrc);
                img.alt = game.name;
                img.onerror = () => { img.remove(); thumb.innerHTML = '<i class="ic ic-controller"></i>'; };
                thumb.appendChild(img);
            } else {
                thumb.innerHTML = '<i class="ic ic-controller"></i>';
            }
            const title = document.createElement("div");
            title.className = "glCardTitle";
            title.textContent = game.name;
            card.appendChild(thumb);
            card.appendChild(title);
            card.addEventListener("click", () => openGame(game));
            grid.appendChild(card);
        }
        prevBtn.style.display = totalPages > 1 && page > 0 ? "inline-block" : "none";
        nextBtn.style.display = totalPages > 1 && page < totalPages - 1 ? "inline-block" : "none";
    }
    prevBtn.addEventListener("click", () => { page--; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    nextBtn.addEventListener("click", () => { page++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    searchInput.addEventListener("input", () => { searchTerm = searchInput.value; page = 0; render(); });
    sortSelect.addEventListener("change", () => { sortBy = sortSelect.value; page = 0; render(); });
    const overlay = document.getElementById("glPlayerOverlay");
    const frame = document.getElementById("glPlayerFrame");
    const closeBtn = document.getElementById("glCloseBtn");
    const fullscreenBtn = document.getElementById("glFullscreenBtn");
    const newTabBtn = document.getElementById("glNewTabBtn");
    const scrollLockBtn = document.getElementById("glScrollLockBtn");
    const metaType = document.getElementById("glMetaType");
    const metaId = document.getElementById("glMetaId");
    const metaDate = document.getElementById("glMetaDate");
    const metaUploader = document.getElementById("glMetaUploader");
    const metaDesc = document.getElementById("glMetaDesc");
    let currentGameUrl = "";
    let scrollLocked = false;
    async function bumpPopularity(source, id) {
        try {
            await fetch(`${a}/api/games/${encodeURIComponent(source)}/${encodeURIComponent(id)}/popularity`, { method: "POST" });
        } catch {}
    }
    function setAuthor(game) {
        metaUploader.textContent = game.author || "Unknown";
        if (game.authorLink) {
            metaUploader.setAttribute("href", game.authorLink);
            metaUploader.classList.add("gl-author-link");
        } else {
            metaUploader.removeAttribute("href");
            metaUploader.classList.remove("gl-author-link");
        }
    }
    async function openGame(game) {
        const gameSource = currentSource;
        gameLoadInProgress = true;
        currentGameUrl = `${a}/games/${encodeURIComponent(gameSource)}/${encodeURIComponent(game.id)}?id=${game.id}`;
        window.history.replaceState(null, null, `?source=${encodeURIComponent(gameSource)}&play=${game.id}`);
        if ("fetchPriority" in frame) frame.fetchPriority = "high";
        frame.src = currentGameUrl;
        overlay.style.display = "flex";
        metaType.textContent = "GAME";
        metaId.textContent = `ID: ${game.id}`;
        metaDate.textContent = game.dateAdded ? new Date(game.dateAdded).toLocaleDateString() : "Unknown";
        metaDesc.textContent = "";
        setAuthor(game);
        bumpPopularity(gameSource, game.id);
        const flushTimeout = setTimeout(() => {
            flushThumbQueue();
        }, 8000);
        if (game.frameType === "zone") {
            const wait = setInterval(() => {
                try {
                    const outerDoc = frame.contentDocument;
                    if (!outerDoc) return;
                    const zoneFrame = outerDoc.getElementById("zoneFrame");
                    if (!zoneFrame) return;
                    const innerDoc = zoneFrame.contentDocument;
                    if (!innerDoc) return;
                    const content = innerDoc.getElementById("content");
                    if (!content) return;
                    content.style.maxHeight = "100%";
                    const canvas = content.querySelector("canvas");
                    if (canvas) canvas.style.maxHeight = "100%";
                    clearInterval(wait);
                    clearTimeout(flushTimeout);
                    flushThumbQueue();
                } catch (e) {
                }
            }, 100);
        } else {
            frame.addEventListener("load", () => {
                clearTimeout(flushTimeout);
                flushThumbQueue();
            }, { once: true });
        }
    }
    function closeGame() {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
        frame.src = "";
        overlay.style.display = "none";
        document.body.classList.remove("gl-scroll-locked");
        scrollLocked = false;
        flushThumbQueue();
    }
    closeBtn.addEventListener("click", closeGame);
    newTabBtn.addEventListener("click", () => {
        if (currentGameUrl) window.open(currentGameUrl, "_blank");
    });
    fullscreenBtn.addEventListener("click", () => {
        if (frame.requestFullscreen) frame.requestFullscreen();
    });
    scrollLockBtn.addEventListener("click", () => {
        scrollLocked = !scrollLocked;
        document.body.classList.toggle("gl-scroll-locked", scrollLocked);
        scrollLockBtn.style.color = scrollLocked ? "#8cbe37" : "white";
    });
    async function loadGamesDataAndMaybeAutoOpen() {
        await loadSources();
        const params = new URLSearchParams(window.location.search);
        const requestedSource = params.get("source");
        if (requestedSource && sources.some((s) => s.id === requestedSource)) {
            currentSource = requestedSource;
            localStorage.setItem(SOURCE_STORAGE_KEY, currentSource);
            updateSourceButtonsActive();
        }
        await loadGamesData();
        try {
            const playId = params.get("play");
            if (playId) {
                const target = allGames.find(g => String(g.id) === playId);
                if (target) {
                    document.getElementById("gameLibrary")?.scrollIntoView({ behavior: "instant", block: "start" });
                    openGame(target);
                }
            }
        } catch {}
    }
    loadGamesDataAndMaybeAutoOpen();
})();