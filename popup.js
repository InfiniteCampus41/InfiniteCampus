(() => {
    const showPopup = localStorage.getItem('showpopup') === 'true';
    if (showPopup) {
        const FALLBACK_ART = "/res/icon.png";
        const DB_NAME = "dryPlayerDB";
        const DB_VERSION = 3;
        let db;
        let tracks = [], currentIndex = 0, isLooping = false;
        let selectedPlaylistId = localStorage.getItem('popup_playlistId') || null;
        const API_BASE = () => (typeof window.a === 'string' ? window.a : '');
        const scCache = {};
        async function resolveStreamUrl(sd) {
            const key = `${sd.artistName}||${sd.title}`;
            if (scCache[key]) return scCache[key];
            try {
                const res = await fetch(`${API_BASE()}/music/resolve?artist=${encodeURIComponent(sd.artistName||'')}&title=${encodeURIComponent(sd.title||'')}`);
                if (!res.ok) return null;
                const data = await res.json();
                scCache[key] = data;
                return data;
            } catch { return null; }
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
        function openDB() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = e => {
                    db = e.target.result;
                    let songStore;
                    if (!db.objectStoreNames.contains('songs')) {
                        songStore = db.createObjectStore('songs', { keyPath: 'id' });
                    } else {
                        songStore = e.target.transaction.objectStore('songs');
                    }
                    if (!songStore.indexNames.contains('position')) {
                        songStore.createIndex('position', 'position', { unique: false });
                    }
                    if (!db.objectStoreNames.contains('state')) {
                        db.createObjectStore('state', { keyPath: 'key' });
                    }
                    if (!db.objectStoreNames.contains('playlists')) {
                        db.createObjectStore('playlists', { keyPath: 'id' });
                    }
                };
                req.onsuccess = e => { db = e.target.result; resolve(db); };
                req.onerror = e => reject(e);
            });
        }
        function loadAllTracks() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('songs', 'readonly');
                const store = tx.objectStore('songs');
                const req = store.getAll();
                req.onsuccess = () => {
                    const allTracks = req.result || [];
                    allTracks.sort((a, b) => (a.position || 0) - (b.position || 0));
                    resolve(allTracks);
                };
                req.onerror = e => reject(e);
            });
        }
        function loadAllPlaylists() {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('playlists', 'readonly');
                const req = tx.objectStore('playlists').getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = e => reject(e);
            });
        }
        function saveState(key, value) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('state', 'readwrite');
                const store = tx.objectStore('state');
                store.put({ key, value });
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        }
        function loadState(key) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('state', 'readonly');
                const store = tx.objectStore('state');
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result ? req.result.value : null);
                req.onerror = reject;
            });
        }
        const floating = document.createElement('div');
        floating.style.cssText = 'position:fixed;right:24px;bottom:24px;width:320px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.15);box-shadow:0 10px 30px rgba(0,0,0,.35);backdropFilter:blur(6px);background:#1116;zIndex:9999;display:none';
        document.body.appendChild(floating);
        const bg = document.createElement('div');
        bg.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(2px);transform:scale(1.05)';
        floating.appendChild(bg);
        const content = document.createElement('div');
        content.style.cssText = 'position:relative;padding:12px;color:#fff';
        floating.appendChild(content);
        const top = document.createElement('div');
        top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:move;user-select:none;background:#0008;border-radius:10px;padding:3px';
        content.appendChild(top);
        const title = document.createElement('div');
        title.style.cssText = 'font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
        title.textContent = 'Now Playing';
        top.appendChild(title);
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="ic ic-x-circle"></i>';
        closeBtn.style.cssText = 'appearance:none;border:none;background:transparent;color:#fff;width:28px;height:28px;padding:3px;border-radius:10px;cursor:pointer';
        top.appendChild(closeBtn);
        const artistLine = document.createElement('div');
        artistLine.style.cssText = 'font-size:12px;color:#aaa;margin-top:4px;padding-left:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        artistLine.textContent = '';
        content.appendChild(artistLine);
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        document.body.appendChild(audio);
        const seek = document.createElement('input');
        seek.type = 'range'; seek.min = '0'; seek.max = '1000'; seek.value = '0'; seek.step = '1';
        const miniTimes = document.createElement('div');
        miniTimes.style.cssText = 'color:white;margin-left:8px;font-size:12px;white-space:nowrap';
        miniTimes.textContent = '0:00 / 0:00';
        const seekContainer = document.createElement('div');
        seekContainer.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px';
        seekContainer.appendChild(seek);
        seekContainer.appendChild(miniTimes);
        content.appendChild(seekContainer);
        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:8px;margin-top:10px';
        const btnPrev = document.createElement('button'); btnPrev.innerHTML = '<i class="ic ic-skip-start-fill"></i>'; controls.appendChild(btnPrev);
        const btnPlay = document.createElement('button'); btnPlay.innerHTML = '<i class="ic ic-play-fill"></i>'; controls.appendChild(btnPlay);
        const btnNext = document.createElement('button'); btnNext.innerHTML = '<i class="ic ic-skip-end-fill"></i>'; controls.appendChild(btnNext);
        const btnLoop = document.createElement('button'); btnLoop.innerHTML = '<i class="ic ic-arrow-repeat"></i> Off'; controls.appendChild(btnLoop);
        [btnPrev, btnPlay, btnNext, btnLoop].forEach(b => {
            b.style.cssText = 'background:#0007;border:1px solid #ffffff33;color:white;padding:6px 12px;border-radius:8px;cursor:pointer';
        });
        content.appendChild(controls);
        const offlineRow = document.createElement('div');
        offlineRow.style.cssText = 'display:none;margin-top:8px';
        const btnSaveOffline = document.createElement('button');
        btnSaveOffline.style.cssText = 'width:100%;background:#0009;border:1px solid #ffffff33;color:white;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;text-align:left';
        btnSaveOffline.innerHTML = '<i class="ic ic-cloud-arrow-down"></i> Save playlist offline';
        offlineRow.appendChild(btnSaveOffline);
        const offlineStatus = document.createElement('div');
        offlineStatus.style.cssText = 'font-size:11px;color:#8c8;margin-top:3px;padding-left:2px;display:none';
        offlineRow.appendChild(offlineStatus);
        content.appendChild(offlineRow);
        const plPanel = document.createElement('div');
        plPanel.style.cssText = 'display:none;padding:8px 4px 4px;';
        content.appendChild(plPanel);
        const plLabel = document.createElement('div');
        plLabel.style.cssText = 'font-size:12px;color:#aaa;margin-bottom:6px';
        plLabel.textContent = 'Choose A Playlist:';
        plPanel.appendChild(plLabel);
        const plSelect = document.createElement('select');
        plSelect.style.cssText = 'width:100%;background:#0007;border:1px solid #ffffff33;color:white;padding:6px 8px;border-radius:8px;font-size:13px;cursor:pointer';
        plPanel.appendChild(plSelect);
        const plPlayBtn = document.createElement('button');
        plPlayBtn.textContent = 'Play Playlist';
        plPlayBtn.style.cssText = 'margin-top:8px;width:100%;background:#0009;border:1px solid #ffffff55;color:white;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:13px';
        plPanel.appendChild(plPlayBtn);
        function fmtTime(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, '0'); }
        function setTrackUI() {
            const t = tracks[currentIndex];
            if (!t) return;
            title.textContent = t.title || 'Untitled';
            artistLine.textContent = t.artist || '';
            artistLine.style.display = t.artist ? '' : 'none';
            bg.style.backgroundImage = `url("${(t.artworkDataUrl || FALLBACK_ART).replace(/"/g, '\\"')}")`;
        }
        function nextTrack() { currentIndex = (currentIndex + 1) % tracks.length; loadTrack(true); }
        function prevTrack() {
            audio.currentTime > 10
                ? (audio.currentTime = 0)
                : (currentIndex = (currentIndex - 1 + tracks.length) % tracks.length, loadTrack(true));
        }
        async function loadTrack(autoplay = false) {
            if (tracks.length === 0) return;
            const t = tracks[currentIndex];
            setTrackUI();
            if (t.blob) {
                audio.src = URL.createObjectURL(t.blob);
                if (autoplay) { audio.play().catch(() => {}); btnPlay.innerHTML = '<i class="ic ic-pause-fill"></i>'; }
                else btnPlay.innerHTML = '<i class="ic ic-play-fill"></i>';
            } else if (t._streamData) {
                btnPlay.innerHTML = '<i class="ic ic-hourglass-split"></i>';
                title.textContent = (t.title || 'Loading…') + ' ⟳';
                const sc = await resolveStreamUrl(t._streamData);
                if (!sc?.streamUrl) {
                    title.textContent = (t.title || 'Untitled') + ' ✗';
                    btnPlay.innerHTML = '<i class="ic ic-play-fill"></i>';
                    return;
                }
                t._resolvedStreamUrl = sc.streamUrl;
                if (sc.artUrl && !t._streamData.artUrl) t.artworkDataUrl = sc.artUrl;
                setTrackUI();
                audio.src = sc.streamUrl;
                if (autoplay) { audio.play().catch(() => {}); btnPlay.innerHTML = '<i class="ic ic-pause-fill"></i>'; }
                else btnPlay.innerHTML = '<i class="ic ic-play-fill"></i>';
            }
        }
        audio.addEventListener('timeupdate', () => {
            const cur = audio.currentTime || 0;
            const dur = audio.duration || 0;
            seek.value = Math.round(cur / dur * 1000) || 0;
            miniTimes.textContent = fmtTime(cur) + ' / ' + fmtTime(dur);
        });
        seek.addEventListener('input', () => { audio.currentTime = seek.value / 1000 * (audio.duration || 0); });
        btnPlay.addEventListener('click', () => { audio.paused ? audio.play() : audio.pause(); });
        btnLoop.addEventListener('click', async () => {
            isLooping = !isLooping;
            await saveState("isLooping", isLooping);
            btnLoop.innerHTML = isLooping ? "<i class='ic ic-arrow-repeat'></i> On" : "<i class='ic ic-arrow-repeat'></i> Off";
            btnLoop.style.outline = isLooping ? "1px solid lime" : "none";
        });
        audio.addEventListener('play', () => btnPlay.innerHTML = '<i class="ic ic-pause-fill"></i>');
        audio.addEventListener('pause', () => btnPlay.innerHTML = '<i class="ic ic-play-fill"></i>');
        btnNext.addEventListener('click', () => nextTrack());
        btnPrev.addEventListener('click', () => prevTrack());
        closeBtn.addEventListener('click', () => {
            audio.pause();
            floating.style.display = 'none';
            localStorage.setItem('showpopup', 'false');
            localStorage.removeItem('popup_playlistId');
            location.reload();
        });
        audio.addEventListener('ended', () => {
            if (currentIndex < tracks.length - 1) nextTrack();
            else if (isLooping) { currentIndex = 0; loadTrack(true); }
        });
        (() => {
            let dragging = false, startX = 0, startY = 0, originX = 0, originY = 0;
            top.addEventListener('mousedown', (e) => {
                dragging = true;
                const rect = floating.getBoundingClientRect();
                originX = rect.left; originY = rect.top;
                startX = e.clientX; startY = e.clientY;
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
            function onMove(e) {
                if (!dragging) return;
                floating.style.left = (originX + e.clientX - startX) + 'px';
                floating.style.top  = (originY + e.clientY - startY) + 'px';
                floating.style.right = 'auto'; floating.style.bottom = 'auto';
            }
            function onUp() { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
        })();
        function buildTracksFromPlaylist(pl, allSongs) {
            const result = [];
            for (const pt of pl.tracks) {
                if (pt.source === 'local') {
                    const s = allSongs.find(s => s.id === pt.localId);
                    if (s) result.push(s);
                } else if (pt.source === 'stream' && pt.streamData) {
                    const cached = allSongs.find(s => s._sourceStreamId === String(pt.streamData.id));
                    if (cached) {
                        result.push(cached);
                    } else {
                        result.push({
                            id: 'stream_' + pt.streamData.id,
                            title: pt.streamData.title || pt.title || 'Untitled',
                            artist: pt.streamData.artistName || '',
                            artworkDataUrl: pt.streamData.artUrl || pt.artUrl || FALLBACK_ART,
                            blob: null,
                            _streamData: pt.streamData
                        });
                    }
                }
            }
            return result;
        }
        async function cacheTrackOffline(t) {
            if (!t._streamData) return null;
            const sd = t._streamData;
            const tx0 = db.transaction('songs', 'readonly');
            const existing = await new Promise(res => {
                const store = tx0.objectStore('songs');
                const req = store.getAll();
                req.onsuccess = () => res((req.result||[]).find(s => s._sourceStreamId === String(sd.id)));
            });
            if (existing) return existing;
            const sc = await resolveStreamUrl(sd);
            if (!sc?.streamUrl && !sc?.downloadUrl) return null;
            const fetchUrl = sc.downloadUrl || sc.streamUrl;
            const res = await fetch(fetchUrl);
            if (!res.ok) return null;
            const arrayBuf = await res.arrayBuffer();
            const blob = new Blob([arrayBuf], { type: 'audio/mpeg' });
            let artworkDataUrl = sd.artUrl || FALLBACK_ART;
            if (sd.artUrl && !sd.artUrl.startsWith('data:')) {
                try {
                    const artRes = await fetch(sd.artUrl);
                    if (artRes.ok) {
                        const artBuf = await artRes.arrayBuffer();
                        artworkDataUrl = await new Promise(r => {
                            const fr = new FileReader();
                            fr.onload = () => r(fr.result);
                            fr.onerror = () => r(sd.artUrl);
                            fr.readAsDataURL(new Blob([artBuf], { type: 'image/jpeg' }));
                        });
                    }
                } catch {}
            }
            const countTx = db.transaction('songs', 'readonly');
            const count = await new Promise(res => {
                countTx.objectStore('songs').count().onsuccess = e => res(e.target.result);
            });
            const id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
            const newTrack = {
                id, title: sd.title || 'Untitled', artist: sd.artistName || '',
                blob, artworkDataUrl, position: count,
                _sourceStreamId: String(sd.id)
            };
            await new Promise((resolve, reject) => {
                const tx = db.transaction('songs', 'readwrite');
                tx.objectStore('songs').put(newTrack);
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
            t.blob = blob;
            t.artworkDataUrl = artworkDataUrl;
            delete t._streamData;
            delete t._resolvedStreamUrl;
            return newTrack;
        }
        btnSaveOffline.addEventListener('click', async () => {
            const streamOnly = tracks.filter(t => !t.blob && t._streamData);
            if (!streamOnly.length) {
                offlineStatus.textContent = 'All tracks already cached ✓';
                offlineStatus.style.display = '';
                return;
            }
            btnSaveOffline.disabled = true;
            offlineStatus.style.display = '';
            let done = 0;
            for (const t of streamOnly) {
                offlineStatus.textContent = `Caching ${done + 1}/${streamOnly.length}: "${t.title}"…`;
                try { await cacheTrackOffline(t); } catch {}
                done++;
            }
            offlineStatus.textContent = `✓ ${done} track(s) saved offline`;
            btnSaveOffline.disabled = false;
        });
        (async () => {
            await openDB();
            const allSongs  = await loadAllTracks();
            const playlists = await loadAllPlaylists();
            floating.style.display = 'block';
            const savedLoop = await loadState("isLooping");
            if (savedLoop !== null) {
                isLooping = savedLoop;
                btnLoop.innerHTML = isLooping ? "<i class='ic ic-arrow-repeat'></i> On" : "<i class='ic ic-arrow-repeat'></i> Off";
                btnLoop.style.outline = isLooping ? "1px solid lime" : "none";
            }
            const playablePlaylists = playlists.filter(pl =>
                pl.tracks.some(pt =>
                    pt.source === 'local'
                        ? allSongs.some(s => s.id === pt.localId)
                        : pt.source === 'stream' && pt.streamData
                )
            );
            const hasLibrary = allSongs.length > 0;
            function showOfflineRowIfNeeded() {
                const hasStreamOnly = tracks.some(t => !t.blob && t._streamData);
                offlineRow.style.display = hasStreamOnly ? '' : 'none';
            }
            if (playablePlaylists.length === 0) {
                if (!hasLibrary) { floating.style.display = 'none'; return; }
                tracks = allSongs;
                currentIndex = 0;
                loadTrack(false);
                showOfflineRowIfNeeded();
                return;
            }
            if (playablePlaylists.length === 1) {
                selectedPlaylistId = playablePlaylists[0].id;
                localStorage.setItem('popup_playlistId', selectedPlaylistId);
                tracks = buildTracksFromPlaylist(playablePlaylists[0], allSongs);
                currentIndex = 0;
                if (tracks.length === 0) { floating.style.display = 'none'; return; }
                loadTrack(false);
                showOfflineRowIfNeeded();
                return;
            }
            if (selectedPlaylistId) {
                const saved = playablePlaylists.find(p => p.id === selectedPlaylistId);
                if (saved) {
                    tracks = buildTracksFromPlaylist(saved, allSongs);
                    currentIndex = 0;
                    if (tracks.length > 0) { loadTrack(false); showOfflineRowIfNeeded(); return; }
                }
            }
            plSelect.innerHTML = '';
            playablePlaylists.forEach(pl => {
                const opt = document.createElement('option');
                opt.value = pl.id;
                opt.textContent = `${pl.name} (${pl.tracks.length} tracks)`;
                plSelect.appendChild(opt);
            });
            artistLine.style.display = 'none';
            seekContainer.style.display = 'none';
            controls.style.display = 'none';
            offlineRow.style.display = 'none';
            title.textContent = 'Select a Playlist';
            plPanel.style.display = '';
            plPlayBtn.addEventListener('click', () => {
                const chosen = playablePlaylists.find(p => p.id === plSelect.value);
                if (!chosen) return;
                selectedPlaylistId = chosen.id;
                localStorage.setItem('popup_playlistId', selectedPlaylistId);
                tracks = buildTracksFromPlaylist(chosen, allSongs);
                currentIndex = 0;
                if (!tracks.length) { title.textContent = 'No playable tracks'; return; }
                plPanel.style.display = 'none';
                seekContainer.style.display = '';
                controls.style.display = '';
                loadTrack(false);
                showOfflineRowIfNeeded();
            });
        })();
    } else {
        const showpopup = document.createElement("div");
        showpopup.innerHTML = "<i class='ic ic-chevron-up'></i>";
        showpopup.className = "showpopup";
        showpopup.addEventListener('click', () => {
            localStorage.setItem('showpopup', "true");
            location.reload();
        });
        document.body.appendChild(showpopup);
    }
})();