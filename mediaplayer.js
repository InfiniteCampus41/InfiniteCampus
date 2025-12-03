const FALLBACK_ART = "/res/icon.png";
const MAX_FILES = 20;
const PREV_RESTART_THRESHOLD = 10;
const DB_NAME = "dryPlayerDB";
const DB_VERSION = 2;
let db;
let tracks = [];
let currentIndex = 0;
let isLooping = false;
let isLoadedFromDB = false;
const els = {
    fileInput: document.getElementById('fileInput'),
    playlist: document.getElementById('playlist'),
    nowTitle: document.getElementById('nowTitle'),
    artImg: document.getElementById('artImg'),
    audio: document.getElementById('audio'),
    seek: document.getElementById('seek'),
    curTime: document.getElementById('curTime'),
    durTime: document.getElementById('durTime'),
    btnPrev: document.getElementById('btnPrev'),
    btnPlay: document.getElementById('btnPlay'),
    btnNext: document.getElementById('btnNext'),
    btnLoop: document.getElementById('btnLoop'),
    countInfo: document.getElementById('countInfo'),
    saveStatus: document.getElementById('saveStatus'),
    floating: document.getElementById('floating'),
    floatingBg: document.getElementById('floatingBg'),
    floatingTitle: document.getElementById('floatingTitle'),
    floatingClose: document.getElementById('floatingClose'),
    floatingDragHandle: document.getElementById('floatingDragHandle'),
    seekMini: document.getElementById('seekMini'),
    miniTimes: document.getElementById('miniTimes'),
    miniPrev: document.getElementById('miniPrev'),
    miniPlay: document.getElementById('miniPlay'),
    miniNext: document.getElementById('miniNext'),
    miniLoop: document.getElementById('miniLoop'),
};
function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + String(r).padStart(2, '0');
}
function stripExt(name) {
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(0, dot) : name;
}
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            db = e.target.result;
            let store;
            if (!db.objectStoreNames.contains('songs')) {
                store = db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
            } else {
                store = e.target.transaction.objectStore('songs');
            }
            if (!store.indexNames.contains('position')) {
                store.createIndex('position', 'position', { unique: false });
            }
            if (!db.objectStoreNames.contains('state')) {
                db.createObjectStore('state', { keyPath: 'key' });
            }
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(db); };
        req.onerror = (e) => reject(e);
    });
}
function saveAll() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['songs','state'], 'readwrite');
        const songsStore = tx.objectStore('songs');
        const stateStore = tx.objectStore('state');
        const clearReq = songsStore.clear();
        clearReq.onsuccess = () => {
            let pending = tracks.length;
            if (pending === 0) {
                stateStore.put({ key:'currentIndex', value: currentIndex });
                stateStore.put({ key:'isLooping', value: isLooping });
                resolve();
                return;
            }
            tracks.forEach(t => {
                const putReq = songsStore.put({
                    id: t.id ?? undefined,
                    title: t.title,
                    blob: t.blob,
                    artworkDataUrl: t.artworkDataUrl,
                    position: t.position
                });
                putReq.onsuccess = () => { if (--pending === 0) {
                    stateStore.put({ key:'currentIndex', value: currentIndex });
                    stateStore.put({ key:'isLooping', value: isLooping });
                    resolve();
                }};
                putReq.onerror = (e) => reject(e);
            });
        };
        clearReq.onerror = (e) => reject(e);
    }).then(() => showSaved('Saved')).catch(()=> showSaved('Save Failed', true));
}
function loadAll() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['songs','state'], 'readonly');
        const songsStore = tx.objectStore('songs');
        const idx = songsStore.index('position');
        const tracksOut = [];
        idx.openCursor(null, 'next').onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                const v = cursor.value;
                tracksOut.push({ id: v.id, title: v.title, blob: v.blob, artworkDataUrl: v.artworkDataUrl, position: v.position });
                cursor.continue();
            } else {
                const stateStore = tx.objectStore('state');
                const getCur = stateStore.get('currentIndex');
                const getLoop = stateStore.get('isLooping');
                getCur.onsuccess = () => {
                    getLoop.onsuccess = () => {
                        resolve({
                            tracks: tracksOut,
                            currentIndex: getCur.result?.value ?? 0,
                            isLooping: !!(getLoop.result?.value)
                        });
                    };
                };
            }
        };
        idx.openCursor().onerror = reject;
    });
}
function showSaved(msg, error=false) {
    els.saveStatus.textContent = msg;
    els.saveStatus.style.color = error ? 'red' : 'white';
    setTimeout(() => { els.saveStatus.textContent = " "; }, 1800);
}
async function extractArtworkDataUrl(file) {
    try {
        const head = await file.slice(0, 262144).arrayBuffer();
        const view = new DataView(head);
        if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2)) !== 'ID3') {
            return FALLBACK_ART;
        }
        const version = view.getUint8(3);
        const flags = view.getUint8(5);
        const size = ((view.getUint8(6) & 0x7f) << 21) | ((view.getUint8(7) & 0x7f) << 14) |
                     ((view.getUint8(8) & 0x7f) << 7)  |  (view.getUint8(9) & 0x7f);
        let offset = 10;
        if (flags & 0x40) {
            const extSize = version === 4
            ? ((view.getUint8(offset) & 0x7f) << 21) | ((view.getUint8(offset+1) & 0x7f) << 14) |
            ((view.getUint8(offset+2) & 0x7f) << 7) | (view.getUint8(offset+3) & 0x7f)
            : view.getUint32(offset);
            offset += extSize + 4;
        }
        while (offset + 10 <= head.byteLength) {
            const fid = String.fromCharCode(
                view.getUint8(offset+0),
                view.getUint8(offset+1),
                view.getUint8(offset+2),
                view.getUint8(offset+3)
            );
            let fsize = version === 4
                ? ((view.getUint8(offset+4) & 0x7f) << 21) | ((view.getUint8(offset+5) & 0x7f) << 14) |
                ((view.getUint8(offset+6) & 0x7f) << 7)  |  (view.getUint8(offset+7) & 0x7f)
                : view.getUint32(offset+4);
            const fflags = view.getUint16(offset+8);
            offset += 10;
            if (!fid.trim() || fsize <= 0) break;
            if (fid === 'APIC' && offset + fsize <= head.byteLength) {
                const apic = new Uint8Array(head, offset, fsize);
                let p = 0;
                const textEnc = apic[p++];
                let mimeEnd = p;
                while (mimeEnd < apic.length && apic[mimeEnd] !== 0) mimeEnd++;
                const mime = new TextDecoder('iso-8859-1').decode(apic.subarray(p, mimeEnd)) || 'image/jpeg';
                p = mimeEnd + 1;
                p += 1;
                if (textEnc === 1) {
                    while (p+1 < apic.length && !(apic[p]===0 && apic[p+1]===0)) p+=2;
                    p+=2;
                } else {
                    while (p < apic.length && apic[p] !== 0) p++;
                    p++;
                }
                const imgBytes = apic.subarray(p);
                const blob = new Blob([imgBytes], { type: mime || 'image/jpeg' });
                const dataUrl = await blobToDataURL(blob);
                return dataUrl || FALLBACK_ART;
            }
            offset += fsize;
        }
    } catch {}
        return FALLBACK_ART;
}
function blobToDataURL(blob) {
    return new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(blob);
    });
}
function refreshListUI() {
    els.playlist.innerHTML = '';
    tracks.sort((a,b) => a.position - b.position);
    tracks.forEach((t, i) => {
        const li = document.createElement('li');
        li.className = 'track' + (i === currentIndex ? ' active' : '');
        li.draggable = true;
        li.dataset.id = t.id;
        li.innerHTML = `
            <span class="drag-handle" title="Drag">☰</span>
            <span class="index">${i+1}</span>
            <span class="track-title" title="${t.title}">${t.title}</span>
        `;
        li.addEventListener('click', () => {
            if (currentIndex !== i) {
                currentIndex = i;
                loadCurrentTrack(true);
            }
        });
        addDragHandlers(li);
        els.playlist.appendChild(li);
    });
    els.countInfo.textContent = `${tracks.length} track${tracks.length===1?'':'s'}`;
}
function setNowPlayingUI() {
    const t = tracks[currentIndex];
    if (!t) {
        els.nowTitle.textContent = '–';
        els.artImg.src = FALLBACK_ART;
        return;
    }
    els.nowTitle.textContent = t.title || 'Untitled';
    els.artImg.src = t.artworkDataUrl || FALLBACK_ART;
    els.floatingTitle.textContent = t.title || 'Untitled';
    els.floatingBg.style.backgroundImage = `url("${(t.artworkDataUrl || FALLBACK_ART).replace(/"/g,'\\"')}")`;
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: t.title || 'Untitled',
            artist: '',
            album: 'Playlist',
            artwork: [
                { src: t.artworkDataUrl || FALLBACK_ART, sizes: '512x512', type: 'image/png' }
            ]
        });
    }
}
function setLoopUI() {
    els.btnLoop.classList.toggle('toggled', isLooping);
    els.miniLoop.classList.toggle('toggled', isLooping);
}
let objectUrlCache = new Map();
function getObjectURLForTrack(t) {
    if (objectUrlCache.has(t.id)) return objectUrlCache.get(t.id);
    const url = URL.createObjectURL(t.blob);
    objectUrlCache.set(t.id, url);
    return url;
}
function revokeAllObjectURLs() {
    for (const url of objectUrlCache.values()) URL.revokeObjectURL(url);
    objectUrlCache.clear();
}
function loadCurrentTrack(autoplay=false, keepTime=false) {
    const t = tracks[currentIndex];
    if (!t) return;
    [...els.playlist.children].forEach((li, i) => li.classList.toggle('active', i === currentIndex));
    setNowPlayingUI();
    const url = getObjectURLForTrack(t);
    const wasPlaying = !els.audio.paused;
    const prevTime = els.audio.currentTime || 0;
    els.audio.src = url;
    if (keepTime) els.audio.currentTime = prevTime;
    if (autoplay || wasPlaying) {
        els.audio.play().catch(()=>{});
        setPlayButtons(true);
    } else {
        setPlayButtons(false);
    }
    saveAll();
}
function setPlayButtons(playing) {
    els.btnPlay.textContent = playing ? '||' : '▶';
    els.miniPlay.textContent = playing ? '||' : '▶';
}
function nextTrack(autoplay=true) {
    if (tracks.length === 0) return;
    if (currentIndex < tracks.length - 1) {
        currentIndex++;
        loadCurrentTrack(autoplay);
    } else {
        if (isLooping) {
            currentIndex = 0;
            loadCurrentTrack(true);
        } else {
            els.audio.pause();
            els.audio.currentTime = 0;
            setPlayButtons(false);
        }
    }
}
function prevTrackSmart() {
    if (tracks.length === 0) return;
    if (els.audio.currentTime > PREV_RESTART_THRESHOLD) {
        els.audio.currentTime = 0;
    } else {
        if (currentIndex > 0) {
            currentIndex--;
            loadCurrentTrack(true);
        } else {
            if (isLooping) {
                currentIndex = tracks.length - 1;
                loadCurrentTrack(true);
            } else {
                els.audio.currentTime = 0;
            }
        }
    }
}
let dragSrcEl = null;
function addDragHandlers(li) {
    li.addEventListener('dragstart', (e) => {
        dragSrcEl = li;
        li.classList.add('ghost');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', li.dataset.id);
    });
    li.addEventListener('dragend', () => {
        dragSrcEl = null;
        li.classList.remove('ghost');
    });
    li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    li.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData('text/plain');
        const toId = li.dataset.id;
        if (fromId === toId) return;
        const fromIdx = tracks.findIndex(t => String(t.id) === String(fromId));
        const toIdx = tracks.findIndex(t => String(t.id) === String(toId));
        if (fromIdx === -1 || toIdx === -1) return;
        const [moved] = tracks.splice(fromIdx, 1);
        tracks.splice(toIdx, 0, moved);
        tracks.forEach((t,i)=> t.position = i);
        if (currentIndex === fromIdx) currentIndex = toIdx;
        else if (fromIdx < currentIndex && toIdx >= currentIndex) currentIndex--;
        else if (fromIdx > currentIndex && toIdx <= currentIndex) currentIndex++;
        refreshListUI();
        saveAll();
    });
}
(function makeFloatingDraggable() {
    const dragHandle = els.floatingDragHandle;
    const floating = els.floating;
    let startX=0, startY=0, originX=0, originY=0, dragging=false;
    function onDown(e) {
        dragging = true;
        const rect = floating.getBoundingClientRect();
        originX = rect.left;
        originY = rect.top;
        startX = e.clientX;
        startY = e.clientY;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
    function onMove(e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        floating.style.left = (originX + dx) + 'px';
        floating.style.top = (originY + dy) + 'px';
        floating.style.right = 'auto';
        floating.style.bottom = 'auto';
    }
    function onUp() {
        dragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    }
    dragHandle.addEventListener('mousedown', onDown);
})();
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', async () => { await els.audio.play().catch(()=>{}); setPlayButtons(true); });
    navigator.mediaSession.setActionHandler('pause', () => { els.audio.pause(); setPlayButtons(false); });
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrackSmart());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack(true));
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in els.audio) {
            els.audio.fastSeek(details.seekTime);
        } else {
            els.audio.currentTime = details.seekTime ?? els.audio.currentTime;
        }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const step = details.seekOffset || 10;
        els.audio.currentTime = Math.max(0, els.audio.currentTime - step);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const step = details.seekOffset || 10;
        els.audio.currentTime = Math.min(els.audio.duration || Infinity, els.audio.currentTime + step);
    });
}
function makeUUID() {
    if (crypto && crypto.getRandomValues) {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
els.fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('audio/'));
    if (files.length === 0) return;
    const allowed = Math.max(0, MAX_FILES - tracks.length);
    const toAdd = files.slice(0, allowed);
    if (toAdd.length < files.length) {
        showError(`Only ${allowed} More File(s) Allowed (Max ${MAX_FILES}).`);
    }
    for (let i=0;i<toAdd.length;i++) {
        const f = toAdd[i];
        const artworkDataUrl = await extractArtworkDataUrl(f);
        const blob = new Blob([await f.arrayBuffer()], { type: f.type || 'audio/mpeg' });
        const title = stripExt(f.name);
        const position = tracks.length + i;
        tracks.push({ id: makeUUID(), title, blob, artworkDataUrl, position });
    }
    refreshListUI();
    if (tracks.length > 0) {
        if (els.floating.classList.contains('hidden')) {
            els.floating.classList.remove('hidden');
        }
        if (tracks.length === toAdd.length) currentIndex = 0;
        loadCurrentTrack(false);
    }
    await saveAll();
    e.target.value = '';
});
els.btnPlay.addEventListener('click', async () => {
    if (els.audio.paused) { await els.audio.play().catch(()=>{}); setPlayButtons(true); }
    else { els.audio.pause(); setPlayButtons(false); }
});
els.btnNext.addEventListener('click', () => nextTrack(true));
els.btnPrev.addEventListener('click', () => prevTrackSmart());
els.btnLoop.addEventListener('click', () => { isLooping = !isLooping; setLoopUI(); saveAll(); });
function syncSeekers() {
    const cur = els.audio.currentTime || 0;
    const dur = isFinite(els.audio.duration) ? (els.audio.duration || 0) : 0;
    const ratio = dur ? (cur / dur) : 0;
    const val = Math.round(ratio * 1000);
    els.seek.value = String(val);
    els.curTime.textContent = fmtTime(cur);
    els.durTime.textContent = fmtTime(dur);
    els.seekMini.value = String(val);
    els.miniTimes.textContent = fmtTime(cur) + " / " + fmtTime(dur);
}
els.seek.addEventListener('input', () => {
    const dur = els.audio.duration || 0;
    els.audio.currentTime = +els.seek.value / 1000 * dur;
});
els.seekMini.addEventListener('input', () => {
    const dur = els.audio.duration || 0;
    els.audio.currentTime = +els.seekMini.value / 1000 * dur;
});
els.audio.addEventListener('timeupdate', syncSeekers);
els.audio.addEventListener('loadedmetadata', syncSeekers);
els.audio.addEventListener('durationchange', syncSeekers);
els.audio.addEventListener('ended', () => nextTrack(true));
els.miniPlay.addEventListener('click', async () => {
    if (els.audio.paused) { await els.audio.play().catch(()=>{}); setPlayButtons(true); }
    else { els.audio.pause(); setPlayButtons(false); }
});
els.miniPrev.addEventListener('click', () => prevTrackSmart());
els.miniNext.addEventListener('click', () => nextTrack(true));
els.miniLoop.addEventListener('click', () => { isLooping = !isLooping; setLoopUI(); saveAll(); });
els.floatingClose.addEventListener('click', () => {
    els.audio.pause();
    setPlayButtons(false);
    els.floating.classList.add('hidden');
});
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        e.preventDefault();
        if (els.audio.paused) els.audio.play().then(()=> setPlayButtons(true));
        else { els.audio.pause(); setPlayButtons(false); }
    }
});
async function clearPlaylistAndDB() {
    tracks = [];
    currentIndex = 0;
    isLooping = false;
    revokeAllObjectURLs();
    refreshListUI();
    setNowPlayingUI();
    setLoopUI();
    els.audio.pause();
    els.audio.src = '';
    setPlayButtons(false);
    return new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(DB_NAME);
        deleteReq.onsuccess = () => {
            showSaved("Playlist Cleared");
            resolve();
        };
        deleteReq.onerror = (e) => {
            showSaved("Failed To Clear", true);
            reject(e);
        };
    }).then(() => openDB());
}
els.btnClear = document.getElementById('btnClear');
els.btnClear.addEventListener('click', () => {
    if (confirm("Are You Sure You Want To Clear The Playlist?")) {
        clearPlaylistAndDB();
    }
});
(async function init() {
    await openDB();
    const data = await loadAll();
    tracks = (data.tracks || []).map((t,i)=>({
        ...t,
        position: Number.isFinite(t.position) ? t.position : i
    }));
    currentIndex = Math.min(Math.max(0, data.currentIndex || 0), Math.max(0, tracks.length-1));
    isLooping = !!data.isLooping;
    isLoadedFromDB = tracks.length > 0;
    refreshListUI();
    setLoopUI();
    if (tracks.length > 0) {
        els.floating.classList.remove('hidden');
        loadCurrentTrack(false);
    } else {
        els.artImg.src = FALLBACK_ART;
    }
})();
window.addEventListener('beforeunload', () => {
    revokeAllObjectURLs();
});