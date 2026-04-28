import { auth, onAuthStateChanged, firestore, doc, getDoc, updateDoc, deleteDoc, setDoc } from "./imports.js";
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
async function dbUpdate(path, updates) {
    for (const key in updates) {
        await dbSet(path + "/" + key, updates[key]);
    }
}
async function dbPush(path, value) {
    const key = Date.now().toString();
    await dbSet(path + "/" + key, value);
    return key;
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
const x3tfypage = window.location.pathname;
const x3tfyparams = new URLSearchParams(window.location.search);
if (x3tfypage === '/InfiniteUpdaters.html') {
	const updatePage = document.getElementById('updatePage');
	const futurePage = document.getElementById('future');
	const pages = x3tfyparams.get("future");
	if (pages) {
		updatePage.style.display = "none";
		futurePage.style.display = "block";
		const noteInput = document.getElementById('noteInput');
		const saveBtn = document.getElementById('saveBtn');
		const notesContainer = document.getElementById('notesContainer');
		let isOwner = false;
		let isTester = false;
		let isCoOwner = false;
		let isHAdmin = false;
		let isAdmin = false;
		let isDev = false;
		function saveNote() {
			if (!noteInput) return;
			const text = noteInput.value.trim();
			if (!text) return;
			dbPush('notes', { text });
			noteInput.value = '';
		}
		if (saveBtn) saveBtn.addEventListener('click', saveNote);
		if (noteInput) {
			noteInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					saveNote();
				}
			});
		}
		onAuthStateChanged(auth, async (user) => {
			if (!user) {
				applyOwnerPermissions(false);
				return;
			}
			const ownerSnap = await dbGet(`users/${user.uid}/profile/isOwner`);
			const testerSnap = await dbGet(`users/${user.uid}/profile/isTester`);
			const coOwnerSnap = await dbGet(`users/${user.uid}/profile/isCoOwner`);
			const hAdminSnap = await dbGet(`users/${user.uid}/profile/isHAdmin`);
			const adminSnap = await dbGet(`users/${user.uid}/profile/isAdmin`);
			const devSnap = await dbGet(`users/${user.uid}/profile/isDev`);
			isOwner = ownerSnap === true;
			isTester = testerSnap === true;
			isCoOwner = coOwnerSnap === true;
			isHAdmin = hAdminSnap === true;
			isAdmin = adminSnap === true;
			isDev = devSnap === true;
			applyOwnerPermissions(isOwner || isTester || isCoOwner || isHAdmin || isAdmin || isDev);
		});
		function applyOwnerPermissions(owner) {
			if (noteInput) noteInput.style.display = owner ? "block" : "none";
			if (saveBtn) saveBtn.style.display = owner ? "inline-block" : "none";
			document.querySelectorAll(".delete-btn").forEach(btn => {
				btn.style.display = owner ? "inline-block" : "none";
			});
			document.querySelectorAll(".edit-btn").forEach(btn => {
				btn.style.display = owner ? "inline-block" : "none";
			});
		}
		dbListen('notes', (data) => {
			const snapshot = {
				forEach: (cb) => {
					if (!data) return;
					Object.entries(data).forEach(([key, val]) => {
						cb({ key, val: () => val });
					});
				}
			};
			if (!notesContainer) return;
			notesContainer.innerHTML = '';
			snapshot.forEach((child) => {
				const note = child.val();
				const key = child.key;
				const div = document.createElement('div');
				div.className = 'note';
				div.style.marginBottom = "10px";
				div.innerHTML = `
					<div style="display:flex; align-items:center; justify-content:center;">
					<button class="edit-btn button" data-key="${key}" style="display:none">
						<i class='bi bi-pencil-square'>
						</i>
					</button>
					<div class="btxt" style="width:75%;" data-key="${key}">
						${note.text}
					</div>
					<button class="delete-btn button" data-key="${key}" style="display:none">
						<i class='bi bi-trash-fill'>
						</i>
					</button>
					</div>
					<button class="save-edit-btn button" data-key="${key}" style="display:none">
						Save
					</button>
				`;
				notesContainer.appendChild(div);
			});
			applyOwnerPermissions(isOwner || isTester || isCoOwner || isHAdmin || isAdmin || isDev);
		});
		notesContainer.addEventListener('click', (e) => {
			const button = e.target.closest('button');
			if (!button) return;
			const key = button.dataset.key;
			if (!key) return;
			if (!(isOwner || isTester || isCoOwner || isHAdmin || isAdmin || isDev)) return;
			if (button.classList.contains('delete-btn')) {
				fetchAPI("delete", {
                    path: pathToArray(`notes/${key}`)
                });      
			}
			if (button.classList.contains('edit-btn')) {
				const txtDiv = document.querySelector(`.btxt[data-key="${key}"]`);
				const saveButton = document.querySelector(`.save-edit-btn[data-key="${key}"]`);
				if (!txtDiv) return;
				const currentText = txtDiv.innerText;
				txtDiv.innerHTML = `<input type="text" class="edit-input button" value="${currentText}">`;
				const input = txtDiv.querySelector('.edit-input');
				saveButton.style.display = "inline-block";
				input.focus();
				input.select();
				input.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') saveEdit(key, txtDiv, saveButton);
					if (e.key === 'Escape') {
						txtDiv.innerText = currentText;
						saveButton.style.display = "none";
					}
				});
			}
			if (button.classList.contains('save-edit-btn')) {
				const txtDiv = document.querySelector(`.btxt[data-key="${key}"]`);
				saveEdit(key, txtDiv, button);
			}
		});
		function saveEdit(key, txtDiv, saveButton) {
			const input = txtDiv.querySelector('.edit-input');
			if (!input) return;
			const newText = input.value.trim();
			if (!newText) return;
			dbUpdate('notes/' + key, { text: newText });
			txtDiv.innerText = newText;
			saveButton.style.display = "none";
		}
	}
    let lastSentKey = null;
    let hasLoaded = false;
    let isOwner = false;
    let isTester = false;
    let isDev = false;
    let cleanupRunning = false;
    function sendToCustomDB(message) {
        const channelId = "1389703415810101308";
        fetch(`${a}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                channelId: channelId
            })
        }).catch((e) => console.error("Error: Server Post Error:", e));
    }
    async function enforceUpdateLimit(snapshot) {
        if (cleanupRunning) return;
        cleanupRunning = true;
        try {
            const updates = [];
            snapshot.forEach(child => {
                updates.push({ key: child.key, ...child.val() });
            });
            updates.sort((a, b) => b.timestamp - a.timestamp);
            if (updates.length <= 10) return;
            const toDelete = updates.slice(10);
            const multi = {};
            toDelete.forEach(u => {
                multi["updates/" + u.key] = null;
            });
			for (const path in multi) {
				await dbSet(path, multi[path]);
			}
        } finally {
            cleanupRunning = false;
        }
    }
    function addUpdate() {
        if (!isOwner && !isTester && !isDev) return;
        const contentEl = document.getElementById("newUpdate");
        const content = contentEl.value.trim();
        if (content) {
            dbPush('updates', {
                content,
                timestamp: Date.now()
            }).then(() => showSuccess("Update Added."));
            contentEl.value = "";
        }
    }
    function deleteUpdate(key) {
        if (!isOwner && !isTester && !isDev) return;
		fetchAPI("delete", {
            path: pathToArray(`updates/${key}`)
        });    
        if (lastSentKey === key) lastSentKey = null;
    }
    async function editUpdate(key, currentText) {
        if (!isOwner && !isTester && !isDev) return;
        const newText = await customPrompt("Edit Update:", false, currentText);
        if (newText !== null && newText.trim() !== "") {
            dbUpdate("updates/" + key, {
                content: newText.trim()
            });
        }
    }
    window.addUpdate = addUpdate;
    window.deleteUpdate = deleteUpdate;
    window.editUpdate = editUpdate;
    function renderUpdates(snapshot) {
        const updates = [];
        snapshot.forEach((child) => {
            updates.push({ key: child.key, ...child.val() });
        });
        updates.sort((a, b) => b.timestamp - a.timestamp);
        const container = document.getElementById("updates");
        container.innerHTML = "";
        updates.slice(0, 10).forEach((update, index) => {
            const div = document.createElement("div");
            div.className = `update-box ${index % 2 === 0 ? "r" : "y"}`;
            if (isOwner || isTester || isDev) {
                div.innerHTML = `
                    <button class="button" onclick="editUpdate('${update.key}', \`${update.content.replace(/`/g, "\\`")}\`)">
                        <i class='bi bi-pencil-square'></i>
                    </button>
                    ${index + 1}. ${update.content}
                    <button class="button" onclick="deleteUpdate('${update.key}')">
                        <i class='bi bi-trash-fill'></i>
                    </button>
                `;
            } else {
                div.innerHTML = `${index + 1}. ${update.content}`;
                div.style.border = "none";
            }
            container.appendChild(div);
        });
    }
	dbListen('updates', async (data) => {
		const snapshot = {
			forEach: (cb) => {
				if (!data) return;
				Object.entries(data).forEach(([key, val]) => {
					cb({ key, val: () => val });
				});
			}
		};
        const updates = [];
        snapshot.forEach(child => {
            updates.push({ key: child.key, ...child.val() });
        });
        updates.sort((a, b) => b.timestamp - a.timestamp);
        if (!hasLoaded && updates.length) {
            lastSentKey = updates[0].key;
            hasLoaded = true;
        } 
        else if (updates.length && updates[0].key !== lastSentKey) {
            lastSentKey = updates[0].key;
            sendToCustomDB(updates[0].content);
        }
        renderUpdates(snapshot);
        await enforceUpdateLimit(snapshot);
    });
    onAuthStateChanged(auth, async (user) => {
        const inputBox = document.getElementById("newUpdateContainer") || document.getElementById("newUpdate");
        isOwner = false;
        isTester = false;
        isDev = false;
        if (user) {
            const ownerRef = `users/${user.uid}/profile/isOwner`;
            const testerRef = `users/${user.uid}/profile/isTester`;
            const devRef = `users/${user.uid}/profile/isDev`;
            const ownerSnap = await dbGet(ownerRef);
            const testerSnap = await dbGet(testerRef);
            const devSnap = await dbGet(devRef);
            if (ownerSnap !== null && ownerSnap !== undefined && ownerSnap === true) {
                isOwner = true;
                if (inputBox) inputBox.style.display = "block";
            } else if (testerSnap !== null && testerSnap !== undefined && testerSnap === true) {
                isTester = true;
                if (inputBox) inputBox.style.display = "block";
            } else if (devSnap !== null && devSnap !== undefined && devSnap === true) {
                isDev = true;
                if (inputBox) inputBox.style.display = "block";
            }  else {
                if (inputBox) inputBox.style.display = "none";
            }
        } else {
            if (inputBox) inputBox.style.display = "none";
        }
        const data = await dbGet("updates");
		renderUpdates({
			forEach: (cb) => {
				if (!data) return;
				Object.entries(data).forEach(([key, val]) => {
					cb({ key, val: () => val });
				});
			}
		});
    });
    document.addEventListener("DOMContentLoaded", () => {
        const input = document.getElementById("newUpdate");
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    addUpdate();
                }
            });
        }
    });
} else if (x3tfypage === '/InfiniteArticles.html') {
	const articlePage = document.getElementById('articles-view');
	const viewPage = document.getElementById('view-page');
	let userRoles = {};
	let highestRole = null;
	let isOwner = false;
	let isTester = false;
	let isCoOwner = false;
	let isHAdmin = false;
	let isAdmin = false;
	let isDev = false;
	let isPartner = false;
	let currentArticleData = null;
	let existingContent = "";
	let currentSlug = null;
	let renderArticle = null;
	let pfpDomain = "/pfps";
	if (!(e.includes(window.location.host))) {
		pfpDomain = "https://raw.githubusercontent.com/InfiniteCampus41/InfiniteCampus/refs/heads/main/pfps"; 
	}
	const ROLE_CONFIG = [
		{key: "isOwner",innerHTML: `<i class="bi bi-shield-plus" style="color:lime" title="Owner"></i>`},
		{key: "isTester",innerHTML: `<i class="fa-solid fa-cogs" style="color:darkgoldenrod" title="Tester"></i>`},
		{key: "isCoOwner",innerHTML: `<i class="bi bi-shield-fill" style="color:lightblue" title="Co-Owner"></i>`},
		{key: "isHAdmin",innerHTML: `<i class="fa-solid fa-shield-halved" style="color:#00cc99" title="Head Admin"></i>`},
		{key: "isAdmin",innerHTML: `<i class="bi bi-shield" style="color:dodgerblue" title="Admin"></i>`},
		{key: "isDev",innerHTML: `<i class="bi bi-code-square" style="color:green" title="This User Is A Developer For Infinitecampus.xyz"></i>`},
		{key: "isPartner",innerHTML: `<i class="fa fa-handshake" style="color:cornflowerblue" title="This User Is A Partner Of Infinite Campus"></i>`}
	];
	async function loadUserRoles(uid) {
		const roleSnap = await dbGet(`users/${uid}/profile`);
		const profile = roleSnap || {};
		userRoles = profile;
		isOwner = profile.isOwner === true;
		isTester = profile.isTester === true;
		isCoOwner = profile.isCoOwner === true;
		isHAdmin = profile.isHAdmin === true;
		isAdmin = profile.isAdmin === true;
		isDev = profile.isDev === true;
		isPartner = profile.isPartner === true;
		highestRole = null;
		for (const role of ROLE_CONFIG) {
			if (profile[role.key] === true) {
				highestRole = role;
				break;
			}
		}
	}
	onAuthStateChanged(auth, async (user) => {
		currentUser = user;
		if (user) {
			await loadUserRoles(user.uid);
			if (isOwner || isTester || isDev) {
				addCreateButton();
				if (currentArticleData) {
					initArticles();
				}
			}
		}
	});
	let profilePics = [];
	async function loadProfilePics() {
		const pfpDate = Date.now();
		try {
			const res = await fetch(`${pfpDomain}/index.json?t=${pfpDate}`);
			const files = await res.json();
			profilePics = files.map(file => `${pfpDomain}/${file}?t=${pfpDate}`);
		} catch (e) {
			console.error("Failed To Load Profile Pics:", e);
			profilePics = [`${pfpDomain}/1.jpeg?t=${pfpDate}`];
		}
	}
	function slugify(text) {
		return text.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
	}
	function addCreateButton() {
		const btn = document.getElementById("create-article-btn");
		if (!btn) return;
		btn.style.display = 'block';
		btn.addEventListener("click", openCreateOverlay);
	}
	function openCreateOverlay() {
		const overlay = document.createElement("div");
		overlay.id = "create-overlay";
		overlay.style = `
			position:fixed;
			top:0; left:0;
			width:100%; height:100%;
			background:rgba(0,0,0,0.7);
			display:flex;
			justify-content:center;
			align-items:center;
			z-index:9999;
		`;
		overlay.innerHTML = `
			<div style="background:#111;padding:30px;width:500px;max-width:90%;border-radius:8px;">
				<h2 class="tptxt">
					Create New Article
				</h2>
				<label class="btxt">
					Title
				</label>
				<br>
				<input id="new-title" class="button" style="width:100%;">
				<br>
				<br>
				<label class="btxt">
					Description
				</label>
				<br>
				<input id="new-description" class="button" style="width:100%;">
				<br>
				<br>
				<label class="btxt">
					Article Content (Supports HTML)
				</label>
				<br>
				<textarea id="new-content" rows="10" class="button" style="width:100%;"></textarea>
				<br>
				<br>
				<button id="save-new" class="button">
					Save
				</button>
				<button id="cancel-new" class="button">
					Cancel
				</button>
			</div>
		`;
		document.body.appendChild(overlay);
		document.getElementById("cancel-new").onclick = () => overlay.remove();
		document.getElementById("save-new").onclick = async () => {
			const title = document.getElementById("new-title").value.trim();
			const desc = document.getElementById("new-description").value.trim();
			const content = document.getElementById("new-content").value.trim();
			if (!title || !desc || !content) {
				showError("All Fields Required.");
				return;
			}
			const articlesSnap = await dbGet("articles");
			const articlesData = articlesSnap || {};
			const existingNumbers = Object.keys(articlesData)
			.map(key => parseInt(key))
			.filter(num => !isNaN(num));
			const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
			const slug = String(nextNumber);
			await dbSet("articles/" + slug, {
				title,
				desc,
				author: currentUser.uid,
				views: 0
			});
			await setDoc(doc(firestore, "articles", slug), {
				content
			});
			overlay.remove();
			showSuccess("Article Created!");
		};
	}
	document.addEventListener("DOMContentLoaded", async () => {
		await authReadyPromise;
		await loadProfilePics();
		const container = document.getElementById("articles-container");
		const searchInput = document.getElementById("search");
		if (container) {
			const articlesRef = "articles";
			let allArticles = await dbGet(articlesRef) || {};
			let renderTimeout;
			function renderArticles(filter = "") {
				clearTimeout(renderTimeout);
				renderTimeout = setTimeout(async () => {
					const searchTerm = filter.toLowerCase();
					container.classList.remove("fade-in");
					container.classList.add("fade-out");
					setTimeout(async () => {
						container.innerHTML = "";
						const fragment = document.createDocumentFragment();
						const sortedSlugs = Object.keys(allArticles)
						.map(slug => parseInt(slug))
						.filter(num => !isNaN(num))
						.sort((a, b) => b - a)
						.map(num => String(num));
						for (const slug of sortedSlugs) {                        
							const article = allArticles[slug];
							if (!article || !article.title) {
								continue;
							}
							if (!article.title.toLowerCase().includes(searchTerm)) {
								continue;
							}
							const userSnap = await dbGet("users/" + article.author);
							const userData = userSnap;
							const div = document.createElement("div");
							div.className = "article";
							div.style.cursor = "pointer";
							div.onclick = () => { 
								window.location.href = `InfiniteArticles.html?slug=${slug}`; 
							};
							div.innerHTML = `
								<h2>
									${article.title}
								</h2>
								<p>
									${article.desc}
								</p>
								<div class="meta">
									<div id="person">
										${(() => {
											const profile = userData?.profile || {};
											let roleHTML = "";
											for (const role of ROLE_CONFIG) {
												if (profile[role.key] === true) {
													roleHTML = role.innerHTML;
													break;
												}
											}
											const picValue = profile.pic;
											let picSrc = "";
											if (picValue && !isNaN(picValue) && profilePics[picValue]) {
												picSrc = profilePics[picValue];
											} else if (picValue && picValue.startsWith("http")) {
												picSrc = picValue;
											} else {
												picSrc = profilePics[0] || "";
											}
											return `
												<img src="${picSrc}" width="30" height="30">
													<span style="color:${userData?.settings.color || ''}">
														${profile.displayName || "Unknown"}
													</span>
													${roleHTML ? `${roleHTML}` : ""}
												</div>
											`;
										})()}
										<span id="views-${slug}">
											${article.views || 0} View(s)
										</span>
									</div>
								</div>
							`;
							fragment.appendChild(div);
							const personDiv = div.querySelector("#person");
							personDiv.addEventListener("click", (e) => {
								e.stopPropagation();
								window.location.href = `InfiniteAccounts.html?user=${article.author}`;
							});
							dbListen("articles/" + slug, (data) => {
    							const views = data?.views || 0;
								const span = document.getElementById(`views-${slug}`);
								if (span) span.innerText = `${views} View(s)`;
							});
						}
						container.appendChild(fragment);
						container.classList.remove("fade-out");
						container.classList.add("fade-in");
					}, 200);
				}, 200);
			}
			dbListen(articlesRef, (data) => {
				allArticles = data || {};
				renderArticles(searchInput?.value || "");
			});
			if (searchInput) {
				searchInput.addEventListener("input", (e) => {
					renderArticles(e.target.value);
				});
			}
		}
		currentSlug = x3tfyparams.get("slug");
		if (!currentSlug) return;
		const articleRef = "articles/" + currentSlug;
		const sessionKey = `viewed-${currentSlug}`;
		(async () => {
			currentArticleData = await dbGet("articles/" + currentSlug);
			articlePage.style.display = 'none';
			viewPage.style.display = 'block';
			if (!currentArticleData || !currentArticleData.title) return;
			if (!sessionStorage.getItem(sessionKey)) {
				const current = await dbGet("articles/" + currentSlug);
				await dbUpdate("articles/" + currentSlug, {
					views: (current?.views || 0) + 1
				});
				sessionStorage.setItem(sessionKey, "true");
			}
			document.getElementById("article-title").innerText = currentArticleData.title;
			const userData = await dbGet("users/" + currentArticleData.author);
			document.getElementById("article-author").innerHTML = `
				${(() => {
					const profile = userData?.profile || {};
					let roleHTML = "";
					for (const role of ROLE_CONFIG) {
						if (profile[role.key] === true) {
							roleHTML = role.innerHTML;
							break;
						}
					}
					const picValue = profile.pic;
					let picSrc = "";
					if (picValue && !isNaN(picValue) && profilePics[picValue]) {
						picSrc = profilePics[picValue];
					} else if (picValue && picValue.startsWith("http")) {
						picSrc = picValue;
					} else {
						picSrc = profilePics[0] || "";
					}
					return `
						<img src="${picSrc}" width="40" height="40">
						<a href='InfiniteAccounts.html?user=${currentArticleData.author}'>
							<span style="color:${userData?.settings?.color}">
								${profile.displayName || "Unknown"}
							</span>
							${roleHTML ? roleHTML : ""}
						</a>
					`;
				})()}
			`;
			const docRef = doc(firestore, "articles", currentSlug);
			const docSnap = await getDoc(docRef);
			existingContent = "";
			if (docSnap.exists()) {
				existingContent = docSnap.data().content || "";
			}
			const contentHost = document.getElementById("article-content");
			renderArticle = function(html) {
				let shadow;
				if (contentHost.shadowRoot) {
					shadow = contentHost.shadowRoot;
					shadow.innerHTML = "";
				} else {
					shadow = contentHost.attachShadow({ mode: "open" });
				}
				shadow.innerHTML = `
					<style>
						:host {
							all: initial;
							font-family: Arial, sans-serif;
							display: block;
						}
						* {
							all: revert;
						}
					</style>
					<div>
						${html}
					</div>
				`;
			}
			renderArticle(existingContent);
			if (currentUser && (isOwner || isTester || isDev) && currentArticleData) {
				initArticles();
			}        
			dbListen("articles/" + currentSlug, (data) => {
				document.getElementById("article-views").innerText = `${data?.views || 0} View(s)`;
			});
		})();
	});
	function initArticles() {
		if (!currentArticleData) return;
		if (currentUser && (isOwner || isTester || isDev)) {
			let adminHTML = `
				<hr>
				<br>
				<button class="button" id="edit-btn">
					Edit Article
				</button>
				<button class="button" id="reset-btn">
					Reset Views
				</button>
			`;
			if (isOwner || isTester) {
				adminHTML += `
					<button class="button" id="delete-btn">
						Delete
					</button>
				`;
			}
			const adminArticle = document.getElementById("article-admin");
			if (adminArticle) {
				adminArticle.innerHTML = adminHTML;
			}
			const editorHost = document.getElementById("article-editor");
			const editorreplace = document.getElementById('article-content');
			const editArticleBtn = document.getElementById("edit-btn");
			if (editArticleBtn) {
				editArticleBtn.addEventListener("click", () => {
					editorreplace.style.display = "none";
					editorHost.style.display = "block";
					editorHost.innerHTML = `
						<hr>
						<h3>
							Edit Article
						</h3>
						<label>
							Title
						</label>
						<br>
						<input class="button" type="text" id="edit-title" value="${currentArticleData.title}" style="width:100%;">
						<br>
						<br>
						<label>
							Description
						</label>
						<br>
						<input class="button" type="text" id="edit-description" value="${currentArticleData.desc}" style="width:100%;">
						<br>
						<br>
						<label>
							Content
						</label>
						<br>
						<textarea class="button" id="edit-content" rows="15" style="width:100%;">${existingContent}</textarea>
						<br>
						<br>
						<button class="button" id="save-btn">
							Save Changes
						</button>
						<button class="button" id="cancel-btn">
							Cancel
						</button>
						<br>
						<br>
					`;
					document.getElementById("save-btn").addEventListener("click", async () => {
						editorreplace.style.display = "block";
						editorHost.style.display = "none";
						const newTitle = document.getElementById("edit-title").value;
						const newDescription = document.getElementById("edit-description").value;
						const newContent = document.getElementById("edit-content").value;
						if (!newTitle || !newDescription || !newContent) {
							showError("All Fields Are Required.");
							return;
						}
						await dbUpdate("articles/" + currentSlug, {
							title: newTitle,
							desc: newDescription
						});
						await updateDoc(doc(firestore, "articles", currentSlug), {
							content: newContent
						});
						document.getElementById("article-title").innerText = newTitle;
						existingContent = newContent;
						renderArticle(newContent);
						editorHost.style.display = "none";
						editorHost.innerHTML = "";
					});
					document.getElementById("cancel-btn").addEventListener("click", () => {
						editorHost.style.display = "none";
						editorreplace.style.display = "block";
						editorHost.innerHTML = "";
					});
				});
			}
			if (isOwner || isTester) {
				document.getElementById("delete-btn")?.addEventListener("click", async () => {
					if (!confirm("Delete This Article?")) return;
					await fetchAPI("delete", {
						path: pathToArray("articles/" + currentSlug)
					});
					await deleteDoc(doc(firestore, "articles", currentSlug));
					window.location.href = "InfiniteArticles.html";
				});
			}
			const resetArticleViews = document.getElementById("reset-btn");
			if (resetArticleViews) {
				resetArticleViews.addEventListener("click", async () => {
					await dbUpdate("articles/" + currentSlug, { views: 0 });
					showSuccess("Views Reset!");
				});
			}
		}
	}
}