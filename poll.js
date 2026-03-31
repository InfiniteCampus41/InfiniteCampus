import { auth, onAuthStateChanged } from "./imports.js";
let uid = null;
let displayName = "Anonymous";
let currentVotes = 0;
let isStaff = false;
let currentUser = null;
let authReady = false;
const authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authReady = true;
        resolve(user);
    });
});
async function getAuthToken() {
    await authReadyPromise;
    if (currentUser) {
        return await currentUser.getIdToken();
    }
    return null;
}
async function fetchAPI(endpoint, body) {
    const token = await getAuthToken();
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
async function dbSet(path, value) {
    return await fetchAPI("write", {
        path: pathToArray(path),
        value
    });
}
async function dbPush(path, value) {
    const key = Date.now().toString();
    await dbSet(`${path}/${key}`, value);
    return key;
}
async function dbUpdate(path, updates) {
    for (const key in updates) {
        await dbSet(path + "/" + key, updates[key]);
    }
}
function dbListen(path, callback) {
    return getAuthToken().then(token => {
        const pathArray = pathToArray(path);
        const wsUrl = `${h}/?token=${token}&path=${encodeURIComponent(JSON.stringify(pathArray))}`;
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            if (!event.data) return;
            if (event.data instanceof Blob) {
                event.data.text().then(text => {
                    if (!text || text.trim() === "" || text === "undefined") return;
                    try {
                        callback(JSON.parse(text));
                    } catch (e) {
                        console.warn("Invalid JSON from Blob:", text, e);
                    }
                });
                return;
            }
            const raw = String(event.data).trim();
            if (!raw || raw === "undefined") return;
            try {
                callback(JSON.parse(raw));
            } catch (e) {
                console.warn("Invalid JSON:", raw, e);
            }
        };
        ws.onerror = () => {
            ws.close();
        };
        ws.onclose = () => {
        };
        return ws;
    });
}
function updateVoteUI() {
    const voteCountEl = document.getElementById('voteCount');
    const remainingEl = document.getElementById('votesRemaining');
    if (voteCountEl) voteCountEl.textContent = currentVotes;
    const remaining = 5 - currentVotes;
    if (remainingEl) {
        remainingEl.textContent =
            remaining > 0 ? `${remaining} Votes Left` : '(No Votes Left)';
    }
}
async function incrementVoteCount() {
    if (currentVotes >= 5) return;
    currentVotes++;
    if (currentVotes > 5) currentVotes = 5;
    await dbUpdate(`users/${uid}/profile`, {
        votes: currentVotes
    });
    updateVoteUI();
}
function getVoteCount() {
    return currentVotes;
}
const iconsGrid = document.getElementById('iconsGrid');
const customSection = document.getElementById('customSection');
function setupVoting() {
    if (!iconsGrid) return;
    const iconCards = Array.from(iconsGrid.querySelectorAll('.icon-card'));
    iconCards.forEach((card, idx) => {
        const iTag = card.querySelector('i');
        if (!iTag) return;
        const iconNum = idx + 1;
        card.dataset.iconNum = String(iconNum);
        card.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (getVoteCount() >= 5) {
                showError('You Have Used All 5 Votes.');
                return;
            }
            openVoteForm(card, iTag.outerHTML);
        });
    });
}
function openVoteForm(card, iconHTML) {
    document.querySelectorAll('.small-form-wrapper').forEach(n => n.remove());
    const wrapper = document.createElement('div');
    wrapper.className = 'small-form-wrapper';
    wrapper.style.marginTop = '8px';
    wrapper.innerHTML = `
        <div class="small-form">
            <input type="text" placeholder="What Should This Icon Represent?" class="vote-text" />
            <div style="display:flex; gap:8px;">
                <button class="small-submit button">Submit</button>
                <button class="small-cancel button">Cancel</button>
            </div>
        </div>
    `;
    wrapper.addEventListener('click', e => e.stopPropagation());
    card.appendChild(wrapper);
    wrapper.querySelector('.small-cancel').onclick = () => wrapper.remove();
    wrapper.querySelector('.small-submit').onclick = async () => {
    const text = wrapper.querySelector('.vote-text').value.trim();
    if (!text) {
        showError('Please Enter What The Icon Should Represent.');
        return;
    }
    const iconNum = card.dataset.iconNum;
    const dbPath = `poll/${iconNum}`;
    try {
        const key = await dbPush(dbPath);
        await incrementVoteCount();
        wrapper.innerHTML = `<div>Vote Submitted</div>`;
        setTimeout(() => wrapper.remove(), 1000);
    } catch (err) {
        console.error(err);
        showError("Error Submitting Vote.");
    }
};
}
function showPollResults() {
    if (iconsGrid) iconsGrid.style.display = 'none';
    if (customSection) customSection.style.display = 'none';
    const before = document.getElementById('before');
    const resultsDiv = document.getElementById('results');
    resultsDiv.id = 'pollResults';
    resultsDiv.style.display = 'block';
    before.style.display = 'none';
    document.body.appendChild(resultsDiv);
    dbListen("poll", async (data) => {
        if (!data) {
            resultsDiv.innerHTML = `<h1 class="tptxt">Poll Results</h1><hr><br><div class="mdtxt">No Votes Yet.</div>`;
            return;
        }
        const iconCards = Array.from(iconsGrid.querySelectorAll('.icon-card'));
        for (const iconNum in data) {
            const votesObj = data[iconNum];
            if (!votesObj || typeof votesObj !== "object") continue;
            const voteEntries = Object.entries(votesObj);
            const card = iconCards[Number(iconNum) - 1];
            let iconHTML = `Icon ${iconNum}`;
            if (card) {
                const iconElement = card.querySelector('i');
                if (iconElement) {
                    iconHTML = iconElement.outerHTML;
                }
            }
            const iconBlock = document.createElement('div');
            iconBlock.style.marginBottom = '15px';
            iconBlock.style.width = '50%';
            iconBlock.style.padding = '10px';
            iconBlock.style.border = '1px solid #444';
            iconBlock.style.display = 'flex';
            iconBlock.style.flexDirection = 'column';
            iconBlock.style.color = 'white';
            iconBlock.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:24px;">${iconHTML}</div>
                    <strong>— ${voteEntries.length} Votes</strong>
                </div>
            `;
            const votesContainer = document.createElement('div');
            votesContainer.style.marginTop = '8px';
            for (const [voteId, vote] of voteEntries) {
                const voteDiv = document.createElement('div');
                voteDiv.style.marginTop = '5px';
                voteDiv.style.padding = '5px';
                voteDiv.style.borderBottom = '1px solid #333';
                let voteDisplayName = "Unknown User";
                if (vote.uid) {
                    const userProfile = await dbGet(`users/${vote.uid}/profile`);
                    if (userProfile) {
                        voteDisplayName = userProfile.displayName || voteDisplayName;
                    }
                }
                voteDiv.innerHTML = `
                    <strong>${voteDisplayName}</strong>: ${vote.voteText}
                `;
                const delBtn = document.createElement('button');
                delBtn.textContent = "Delete";
                delBtn.style.marginLeft = "10px";
                delBtn.classList = "button";
                delBtn.addEventListener('click', async () => {
                    await fetchAPI("delete", {
                        path: pathToArray(`poll/${iconNum}/${voteId}`)
                    });                    
                    location.reload();
                });
                voteDiv.appendChild(delBtn);
                votesContainer.appendChild(voteDiv);
            }
            iconBlock.appendChild(votesContainer);
            resultsDiv.appendChild(iconBlock);
        }
    });
}
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'InfiniteLogins.html?poll=true';
        return;
    }
    uid = user.uid;
    const profile = await dbGet(`users/${uid}/profile`) || {};
    displayName = profile.displayName || "Anonymous";
    currentVotes = profile.votes || 0;
    const roles = [
        profile.isOwner,
        profile.isTester,
        profile.isCoOwner,
        profile.isHAdmin,
        profile.isAdmin,
        profile.isDev
    ];
    isStaff = roles.some(r => r === true);
    updateVoteUI();
    if (isStaff) {
        showPollResults();
    } else {
        setupVoting();
    }
});