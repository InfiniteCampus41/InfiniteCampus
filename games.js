;(function () {
    const grid = document.getElementById("glGrid");
    if (!grid) return;
    const searchInput = document.getElementById("glSearch");
    const sortSelect = document.getElementById("glSort");
    const prevBtn = document.getElementById("glPrevPage");
    const nextBtn = document.getElementById("glNextPage");
    const PAGE_SIZE = 100;
    let allGames = [];
    let sortBy = "popularity";
    let searchTerm = "";
    let page = 0;
    async function loadGamesData() {
        try {
            const res = await fetch(`${a}/api/zone-games?t=${Date.now()}`);
            const data = await res.json();
            allGames = (data && data.ok && Array.isArray(data.games)) ? data.games : [];
        } catch (e) {
            console.error("Failed To Load Games:", e);
            allGames = [];
        }
        render();
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
        return `${a}/zonegames/${encodeURIComponent(game.id)}/thumbnail`;
    }
    function render() {
        const filtered = getFiltered();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (page >= totalPages) page = totalPages - 1;
        if (page < 0) page = 0;
        const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
        grid.innerHTML = "";
        for (const game of pageItems) {
            const card = document.createElement("div");
            card.className = "glCard";
            const thumb = document.createElement("div");
            thumb.className = "glCardThumb";
            const thumbSrc = thumbUrlFor(game);
            if (thumbSrc) {
                const img = document.createElement("img");
                img.src = thumbSrc;
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
    async function bumpPopularity(id) {
        try {
            await fetch(`${a}/api/zone-games/${encodeURIComponent(id)}/popularity`, { method: "POST" });
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
        currentGameUrl = `${a}/games/${encodeURIComponent(game.id)}?id=${game.id}`;
        window.history.replaceState(null, null, `?play=${game.id}`);
        frame.src = currentGameUrl;
        overlay.style.display = "flex";
        metaType.textContent = "GAME";
        metaId.textContent = `ID: ${game.id}`;
        metaDate.textContent = game.dateAdded ? new Date(game.dateAdded).toLocaleDateString() : "Unknown";
        metaDesc.textContent = "";
        setAuthor(game);
        bumpPopularity(game.id);
    }
    function closeGame() {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
        frame.src = "";
        overlay.style.display = "none";
        document.body.classList.remove("gl-scroll-locked");
        scrollLocked = false;
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
        await loadGamesData();
        try {
            const params = new URLSearchParams(window.location.search);
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