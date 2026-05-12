const audio = document.getElementById('audio');
let currentTrack = null;
let isPlaying = false;
let isLooped = false;
let navStack = [];
const scCache = {};
async function resolveSCPermalinks(artistName, title) {
    const key = `${artistName}||${title}`;
    if (scCache[key]) return scCache[key];
    try {
        const res  = await fetch(`${a}/music/resolve?artist=${encodeURIComponent(artistName)}&title=${encodeURIComponent(title)}`);
        if (!res.ok) return null;
        const data = await res.json();
        scCache[key] = data;
        return data;
    } catch {
        return null;
    }
}
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', onEnded);
audio.addEventListener('play',  () => { 
    isPlaying = true;  
    syncPlayIcon(); 
});
audio.addEventListener('pause', () => { 
    isPlaying = false; 
    syncPlayIcon(); 
});
document.getElementById('seekBar').addEventListener('input', e => {
    if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});
document.getElementById('volumeBar').addEventListener('input', e => {
    audio.volume = e.target.value / 100;
    e.target.style.setProperty('--pct', e.target.value + '%');
});
document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchSongs();
});
function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    const bar = document.getElementById('seekBar');
    bar.value = pct;
    bar.style.setProperty('--pct', pct + '%');
    document.getElementById('timeCurrent').textContent = fmt(audio.currentTime);
    document.getElementById('timeDuration').textContent = fmt(audio.duration);
}
function onEnded() {
    if (isLooped) { 
        audio.currentTime = 0; 
        audio.play(); 
    } else { 
        isPlaying = false; 
        syncPlayIcon(); 
    }
}
function fmt(s) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}
function syncPlayIcon() {
    document.getElementById('playIcon').className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    document.querySelectorAll('.song-card, .track').forEach(el => {
        el.classList.toggle('playing', el.dataset.trackId === String(currentTrack?.id));
    });
    document.querySelectorAll('.song-card').forEach(card => {
        const ov = card.querySelector('.play-overlay i');
        if (!ov) return;
        const active = card.dataset.trackId === String(currentTrack?.id);
        ov.className = (active && isPlaying) ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    });
}
function togglePlay() {
    if (!audio.src) return;
    isPlaying ? audio.pause() : audio.play();
}
function toggleLoop() {
    isLooped = !isLooped;
    audio.loop = isLooped;
    document.getElementById('loopBtn').classList.toggle('active', isLooped);
}
function seekRelative(sec) {
    if (audio.duration) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + sec));
}
function downloadCurrent() {
    if (!currentTrack?.downloadUrl) return;
    window.open(currentTrack.downloadUrl, '_blank');
}
function goToCurrentArtist() {
    if (currentTrack?.artistId) pushDetail(() => renderArtistPage(currentTrack.artistId));
}
function playTrack(track) {
    currentTrack = track;
    audio.src = track.streamUrl;
    audio.play();
    document.getElementById('playerTitle').textContent  = track.title;
    document.getElementById('playerArtist').textContent = track.artistName;
    const thumb = document.getElementById('playerThumb');
    thumb.innerHTML = track.artUrl ? `<img src="${track.artUrl}" alt="">` : `<i class="fa-solid fa-music"></i>`;
    document.getElementById('player').classList.add('visible');
    syncPlayIcon();
}
async function resolveAndPlay(deezerTrackId, artistName, title, artUrl, artistId, albumId) {
    document.querySelectorAll(`[data-track-id="${deezerTrackId}"]`).forEach(el => {
        el.classList.add('loading');
    });
    const sc = await resolveSCPermalinks(artistName, title);
    document.querySelectorAll(`[data-track-id="${deezerTrackId}"]`).forEach(el => {
        el.classList.remove('loading');
    });
    if (!sc) {
        showToast(`Couldn't Find "${title}" On SoundCloud`);
        return;
    }
    playTrack({
        id: deezerTrackId,
        title,
        artistName,
        artistId,
        albumId,
        artUrl: sc.artUrl || artUrl,
        streamUrl: sc.streamUrl,
        downloadUrl: sc.downloadUrl,
        source: 'hybrid'
    });
}
function showMain() {
    document.getElementById('mainPage').style.display = '';
    document.getElementById('detailPage').style.display = 'none';
    document.getElementById('detailPage').innerHTML = '';
    navStack = [];
}
function pushDetail(renderFn) {
    navStack.push(renderFn);
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('detailPage').style.display = '';
    renderFn();
}
function goBack() {
    navStack.pop();
    if (navStack.length === 0) {
        showMain();
    } else {
        const prev = navStack[navStack.length - 1];
        navStack.pop();
        pushDetail(prev);
    }
}
async function searchSongs() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    showMain();
    const results = document.getElementById('results');
    results.innerHTML = `
        <div class="loading-state">
            <div class="spinner">
            </div>
            Searching
        </div>
    `;
    try {
        const res = await fetch(`${a}/music/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        results.innerHTML = '';
        if (!data.data?.length) {
            results.innerHTML = '<div class="loading-state">No Songs Found.</div>';
            return;
        }
        document.getElementById('loadMoreBtn')?.remove();
        data.data.forEach(t => renderDeezerCard(t, results));
    } catch {
        results.innerHTML = '<div class="loading-state">Error Loading Songs.</div>';
    }
}
function renderDeezerCard(t, container) {
    const card = document.createElement('div');
    card.className = 'song-card' + (currentTrack?.id === t.id ? ' playing' : '');
    card.dataset.trackId = t.id;
    card.innerHTML = `
        <img class="cover" src="${t.album.cover_medium}" loading="lazy">
        <div class="play-overlay">
            <i class="fa-solid ${currentTrack?.id === t.id && isPlaying ? 'fa-pause' : 'fa-play'}">
            </i>
        </div>
        <div class="song-title">
            ${esc(t.title)}
        </div>
        <div class="album-name">
            ${esc(t.album.title || 'Single')}
        </div>
        <span class="artist-link">
            ${esc(t.artist.name)}
        </span>
    `;
    card.onclick = () => {
        if (currentTrack?.id === t.id) { 
            togglePlay(); 
            return; 
        }
        resolveAndPlay(t.id, t.artist.name, t.title, t.album.cover_medium, t.artist.id, t.album.id);
    };
    card.querySelector('.artist-link').onclick = e => {
        e.stopPropagation();
        pushDetail(() => renderArtistPage(t.artist.id));
    };
    container.appendChild(card);
}
async function renderArtistPage(id) {
    const page = document.getElementById('detailPage');
    page.innerHTML = `
        <div class="loading-state">
            <div class="spinner">
            </div>
            Loading Artist
        </div>
    `;
    try {
        const [aRes, albRes, trRes] = await Promise.all([
            fetch(`${a}/music/artist/${id}`),
            fetch(`${a}/music/artist/${id}/albums`),
            fetch(`${a}/music/artist/${id}/top`)
        ]);
        const artist = await aRes.json();
        const albums = await albRes.json();
        const tracks = await trRes.json();
        page.innerHTML = `
            <button class="button" onclick="goBack()">
                <i class="fa-solid fa-arrow-left">
                </i>
                 Back
            </button>
            <div class="artist-header">
                <img class="artist-banner" src="${artist.picture_xl || artist.picture_big}" loading="lazy">
                <div class="artist-overlay">
                    <img class="artist-avatar" src="${artist.picture_big}" loading="lazy">
                    <div class="artist-details">
                        <h2 class="btxt">
                            ${esc(artist.name)}
                        </h2>
                        <p>
                            ${(artist.nb_fan || 0).toLocaleString()} Followers
                        </p>
                    </div>
                </div>
            </div>
            <h3 class="section-title btxt">
                Popular
            </h3>
            <div id="artistTracks" class="btxt">
            </div>
            <h3 class="section-title">
                Albums
            </h3>
            <div class="album-grid" id="artistAlbums">
            </div>
        `;
        const tList = document.getElementById('artistTracks');
        (tracks.data || []).forEach((t, i) => {
            const div = document.createElement('div');
            div.className = 'track' + (currentTrack?.id === t.id ? ' playing' : '');
            div.dataset.trackId = t.id;
            div.innerHTML = `
                <span class="track-num">
                    ${i + 1}
                </span>
                <span>
                    ${esc(t.title)}
                </span>
            `;
            div.onclick = () => resolveAndPlay(t.id, artist.name, t.title, t.album?.cover_medium, id, t.album?.id);
            tList.appendChild(div);
        });
        const aGrid = document.getElementById('artistAlbums');
        (albums.data || []).slice(0, 12).forEach(album => {
            const div = document.createElement('div');
            div.className = 'album-card';
            div.innerHTML = `
                <img src="${album.cover_medium}" loading="lazy">
                <div class="album-title">
                    ${esc(album.title)}
                </div>
                <div>
                    ${album.release_date?.slice(0, 4) || ''}
                </div>
            `;
            div.onclick = () => pushDetail(() => renderAlbumPage(album.id));
            aGrid.appendChild(div);
        });
    } catch {
        page.innerHTML = '<div class="loading-state">Error Loading Artist.</div>';
    }
}
async function renderAlbumPage(id) {
    const page = document.getElementById('detailPage');
    page.innerHTML = `
        <div class="loading-state">
            <div class="spinner">
            </div>
            Loading Album
        </div>
    `;
    try {
        const res = await fetch(`${a}/music/album/${id}`);
        const album = await res.json();
        page.innerHTML = `
            <button class="button" onclick="goBack()">
                <i class="fa-solid fa-arrow-left">
                </i>
                 Back
            </button>
            <div class="artist-header">
                <img class="artist-banner" src="${album.cover_xl || album.cover_big}" loading="lazy">
                <div class="artist-overlay">
                    <img class="artist-avatar" style="border-radius:12px;" src="${album.cover_big}" loading="lazy">
                    <div class="artist-details">
                        <h2 class="btxt">
                            ${esc(album.title)}
                        </h2>
                        <p style="cursor:pointer;color:var(--accent);" onclick="pushDetail(()=>renderArtistPage(${album.artist.id}))">
                            ${esc(album.artist.name)}
                        </p>
                        <p>
                            ${album.nb_tracks} Songs
                        </p>
                    </div>
                </div>
            </div>
            <h3 class="section-title btxt">
                Tracks
            </h3>
            <div id="albumTracks" class="btxt">
            </div>
        `;
        const list = document.getElementById('albumTracks');
        (album.tracks?.data || []).forEach((t, i) => {
            const div = document.createElement('div');
            div.className = 'track' + (currentTrack?.id === t.id ? ' playing' : '');
            div.dataset.trackId = t.id;
            div.innerHTML = `
                <span class="track-num">
                    ${i + 1}
                </span>
                <span>
                    ${esc(t.title)}
                </span>
            `;
            div.onclick = () => resolveAndPlay(
                t.id, album.artist.name, t.title,
                album.cover_medium, album.artist.id, id
            );
            list.appendChild(div);
        });
    } catch {
        page.innerHTML = '<div class="loading-state">Error Loading Album.</div>';
    }
}
async function renderSongPage(id) {
    const page = document.getElementById('detailPage');
    page.innerHTML = `
        <div class="loading-state">
            <div class="spinner">
            </div>
            Loading Song
        </div>
    `;
    try {
        const res = await fetch(`${a}/music/track/${id}`);
        const track = await res.json();
        page.innerHTML = `
            <button class="button" onclick="goBack()">
                <i class="fa-solid fa-arrow-left">
                </i>
                 Back
            </button>
            <div class="song-detail-header">
                <img class="banner-img" src="${track.album.cover_xl || track.album.cover_big}" loading="lazy">
                <div class="song-detail-overlay">
                    <img class="song-cover-lg" src="${track.album.cover_big}" loading="lazy">
                    <div class="song-detail-info">
                        <h2>
                            ${esc(track.title)}
                        </h2>
                        <a onclick="pushDetail(()=>renderArtistPage(${track.artist.id}))">
                            ${esc(track.artist.name)}
                        </a>
                        <a onclick="pushDetail(()=>renderAlbumPage(${track.album.id}))">
                            ${esc(track.album.title)}
                        </a>
                        <button class="play-song-btn" data-track-id="${track.id}" onclick="resolveAndPlay(${track.id},'${esc(track.artist.name).replace(/'/g,"\\'")}','${esc(track.title).replace(/'/g,"\\'")}','${track.album.cover_medium}',${track.artist.id},${track.album.id})">
                            <i class="fa-solid fa-play">
                            </i>
                             Play
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch {
        page.innerHTML = '<div class="loading-state">Error Loading Song.</div>';
    }
}
function loadArtist(id) { 
    pushDetail(() => renderArtistPage(id)); 
}
function loadAlbum(id) { 
    pushDetail(() => renderAlbumPage(id));  
}
function loadSong(id) { 
    pushDetail(() => renderSongPage(id));
}
function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-show'), 10);
    setTimeout(() => { 
        t.classList.remove('toast-show'); 
        setTimeout(() => t.remove(), 300); 
    }, 3000);
}
function esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
window.onload = () => {
    document.getElementById('searchInput').value = 'trending';
    searchSongs();
};