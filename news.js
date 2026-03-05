import { auth, onAuthStateChanged, db, ref, get, update, onValue, increment, remove, set, firestore, doc, getDoc, updateDoc, deleteDoc, setDoc} from "./imports.js";
const articlePage = document.getElementById('articles-view');
const viewPage = document.getElementById('view-page');
let currentUser = null;
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
    const roleSnap = await get(ref(db, `users/${uid}/profile`));
    const profile = roleSnap.val() || {};
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
            initArticles();
        }
    }
});
let profilePics = [];
async function loadProfilePics() {
    const pfpDate = Date.now();
    try {
        const res = await fetch(`/pfps/index.json?t=${pfpDate}`);
        const files = await res.json();
        profilePics = files.map(file => `/pfps/${file}?t=${pfpDate}`);
    } catch (e) {
        console.error("Failed To Load Profile Pics:", e);
        profilePics = [`/pfps/1.jpeg?t=${pfpDate}`];
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
        const articlesSnap = await get(ref(db, "articles"));
        const articlesData = articlesSnap.val() || {};
        const existingNumbers = Object.keys(articlesData)
        .map(key => parseInt(key))
        .filter(num => !isNaN(num));
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        const slug = String(nextNumber);
        await set(ref(db, "articles/" + slug), {
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
    await loadProfilePics();
    const container = document.getElementById("articles-container");
    const searchInput = document.getElementById("search");
    if (container) {
        const articlesRef = ref(db, "articles");
        let allArticles = {};
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
                        if (!article.title.toLowerCase().includes(searchTerm)) {
                            continue;
                        }
                        const userSnap = await get(ref(db, "users/" + article.author));
                        const userData = userSnap.val();
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
                        onValue(ref(db, "articles/" + slug), snap => {
                            const views = snap.val()?.views || 0;
                            const span = document.getElementById(`views-${slug}`);
                            if (span) span.innerText = views;
                        });
                    }
                    container.appendChild(fragment);
                    container.classList.remove("fade-out");
                    container.classList.add("fade-in");
                }, 200);
            }, 200);
        }
        onValue(articlesRef, (snapshot) => {
            allArticles = snapshot.val() || {};
            renderArticles(searchInput?.value || "");
        });
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                renderArticles(e.target.value);
            });
        }
    }
    const params = new URLSearchParams(window.location.search);
    currentSlug = params.get("slug");
    if (!currentSlug) return;
    const articleRef = ref(db, "articles/" + currentSlug);
    const sessionKey = `viewed-${currentSlug}`;
    (async () => {
        const snap = await get(articleRef);
        currentArticleData = snap.val();
        articlePage.style.display = 'none';
        viewPage.style.display = 'block';
        if (!currentArticleData) return;
        if (!sessionStorage.getItem(sessionKey)) {
            await update(articleRef, { views: increment(1) });
            sessionStorage.setItem(sessionKey, "true");
        }
        document.getElementById("article-title").innerText = currentArticleData.title;
        const userSnap = await get(ref(db, "users/" + currentArticleData.author));
        const userData = userSnap.val();
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
        if (currentUser && (isOwner || isTester || isDev)) {
                initArticles();
        }        
        onValue(articleRef, snapshot => {
            document.getElementById("article-views").innerText = `${snapshot.val()?.views || 0} View(s)`;
        });
    })();
});
function initArticles() {
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
                    await update(ref(db, "articles/" + currentSlug), {
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
                await remove(ref(db, "articles/" + currentSlug));
                await deleteDoc(doc(firestore, "articles", currentSlug));
                window.location.href = "InfiniteArticles.html";
            });
        }
        const resetArticleViews = document.getElementById("reset-btn");
        if (resetArticleViews) {
            resetArticleViews.addEventListener("click", async () => {
                await update(ref(db, "articles/" + currentSlug), { views: 0 });
                showSuccess("Views Reset!");
            });
        }
    }
}