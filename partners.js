import { auth, onAuthStateChanged } from "./imports.js";
const partnerContainer = document.getElementById("partners");
let currentUser = null;
let profileData = null;
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
function canEdit(partnerUid) {
    if (!currentUser || !profileData) return false;
    if (profileData.isOwner === true) return true;
    if (profileData.isTester === true) return true;
    if (profileData.isPartner === true && currentUser.uid === partnerUid) {
        return true;
    }
    return false;
}
function getMetadataImage(url) {
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=false&embed=image.url`;
}
function createPartnerBox(uid, partnerName, data) {
    const box = document.createElement("div");
    box.className = "partner-box";
    const name = document.createElement("span");
    name.classList = "ptnName";
    const img = document.createElement("img");
    name.textContent = partnerName;
    if (data.photo) {
        img.src = data.photo;
    } else if (data.link) {
        img.src = getMetadataImage(data.link);
    } else {
        img.src = "https://via.placeholder.com/300x200?text=No+Image";
    }
    box.appendChild(img);
    box.appendChild(name);
    const content = document.createElement("div");
    content.className = "partner-content";
    const desc = document.createElement("div");
    desc.textContent = data.desc || "No Description Provided.";
    const visitLink = document.createElement("a");
    visitLink.textContent = "Visit Site";
    visitLink.href = data.link || "#";
    visitLink.target = "_blank";
    visitLink.onclick = (e) => e.stopPropagation();
    content.appendChild(desc);
    if (data.link) box.appendChild(visitLink);
    box.appendChild(content);
    box.onclick = () => {
        if (box.classList.contains("editing")) return;
        box.classList.toggle("active");
        visitLink.classList.toggle("ptnShow");
    };
    if (canEdit(uid)) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "ptnEdit-btn";
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "ptnDelete-btn";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            showConfirm(
                `Are You Sure You Want To Delete Partner "${partnerName}"?`,
                async (result) => {
                    if (!result) return;
                    await dbUpdate(`/partners/${uid}`, {
                        [partnerName]: null
                    });
                    const userPartnersSnap = await dbGet(`/partners/${uid}`);
                    if (!userPartnersSnap || Object.keys(userPartnersSnap).length === 0) {
                        await dbUpdate(`users/${uid}/profile`, { isPartner: null });
                    }
                    box.remove();
                }
            );
        };
        const panel = document.createElement("div");
        panel.className = "ptnEdit-panel";
        const nameDiv = document.createElement("div");
        nameDiv.style.display = "flex";
        nameDiv.style.flexDirection = "column";
        nameDiv.innerHTML = `<label class="btxt">Name:</label><input class="button ptnNameInput" value="${partnerName}" placeholder="Enter Partner Name Here">`;
        const linkDiv = document.createElement("div");
        linkDiv.style.display = "flex";
        linkDiv.style.flexDirection = "column";
        linkDiv.innerHTML = `<label class="btxt">Link:</label><input class="button ptnLinkInput" value="${data.link || ""}" placeholder="Enter Link Here">`;        
        const photoDiv = document.createElement("div");
        photoDiv.style.display = "flex";
        photoDiv.style.flexDirection = "column";
        photoDiv.innerHTML = `<label class="btxt">Photo URL:</label><input class="button ptnPhotoInput" value="${data.photo || ""}" placeholder="Enter Icon URL Here">`;        
        const descDiv = document.createElement("div");
        descDiv.style.display = "flex";
        descDiv.style.flexDirection = "column";
        descDiv.innerHTML = `<label class="btxt">Description:</label><input class="button ptnDescInput" value="${data.desc || ""}" placeholder="Enter Description Here">`;        
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.className = "button";
        saveBtn.onclick = async (e) => {
            e.stopPropagation();
            const nameInput = panel.querySelector(".ptnNameInput");
            const linkInput = panel.querySelector(".ptnLinkInput");
            const photoInput = panel.querySelector(".ptnPhotoInput");
            const descInput = panel.querySelector(".ptnDescInput");
            const newName = nameInput.value.trim();
            const isEditing = box.classList.toggle("editing");
            if (isEditing != true) {
                location.reload();
            }
            if (!newName) return showError("Name Cannot Be Empty");
            if (newName !== partnerName) {
                await dbUpdate(`/partners/${uid}`, {
                    [partnerName]: null
                });
            }
            await dbSet(`/partners/${uid}/${newName}`, {
                link: linkInput.value,
                photo: photoInput.value,
                desc: descInput.value
            });
            panel.style.display = "none";
            box.classList.remove("editing");
        };
        editBtn.onclick = (e) => {
            e.stopPropagation();
            const isEditing = box.classList.toggle("editing");
            if (isEditing != true) {
                location.reload();
            }
            panel.style.display = isEditing ? "flex" : "none";
            const allBoxes = document.querySelectorAll(".partner-box");
            allBoxes.forEach(b => {
                if (b !== box) b.style.display = isEditing ? "none" : "block";
            });
        };
        panel.appendChild(nameDiv);
        panel.appendChild(linkDiv);
        panel.appendChild(photoDiv);
        panel.appendChild(descDiv);
        panel.appendChild(saveBtn);
        box.appendChild(editBtn);
        box.appendChild(deleteBtn);
        box.appendChild(panel);
    }
    partnerContainer.appendChild(box);
}
function loadPartners() {
    dbListen("/partners", (data) => {
        partnerContainer.innerHTML = "";
        Object.entries(data || {}).forEach(([uid, userData]) => {
            Object.entries(userData || {}).forEach(([partnerName, partnerData]) => {
                createPartnerBox(uid, partnerName, partnerData);
            });
        });
    });
}
async function createAddPartnerButton() {
    if (!currentUser || !profileData) return;
    if (!profileData.isOwner && !profileData.isTester) return;
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Partner";
    addBtn.className = "button add-partner-btn";
    partnerContainer.parentNode.insertBefore(addBtn, partnerContainer);
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.style.cssText = `
        position: fixed;
        top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.7);
        display:none; align-items:center; justify-content:center;
        z-index:1000;
    `;
    const form = document.createElement("div");
    form.style.cssText = `
        background:#222; color:white; padding:20px; border-radius:10px;
        display:flex; flex-direction:column; gap:10px; width:400px;
    `;
    const userSelectDiv = document.createElement("div");
    userSelectDiv.style.display = "flex";
    userSelectDiv.style.flexDirection = "column";
    const userSelectLabel = document.createElement("label");
    userSelectLabel.textContent = "Select User:";
    const userSelect = document.createElement("select");
    userSelect.className = "button";
    userSelect.innerHTML = `<option value="">--Select User--</option>`;
    userSelectDiv.appendChild(userSelectLabel);
    userSelectDiv.appendChild(userSelect);
    form.appendChild(userSelectDiv);
    const fields = [
        {label: "Partner Name", class: "ptnNameInput"},
        {label: "Link", class: "ptnLinkInput"},
        {label: "Photo URL", class: "ptnPhotoInput"},
        {label: "Description", class: "ptnDescInput"}
    ];
    fields.forEach(f => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.innerHTML = `<label>${f.label}:</label><input class="button ${f.class}" placeholder="Enter ${f.label}">`;
        form.appendChild(div);
    });
    const btnDiv = document.createElement("div");
    btnDiv.style.display = "flex"; 
    btnDiv.style.justifyContent = "space-between";
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "button";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "button";
    btnDiv.appendChild(saveBtn);
    btnDiv.appendChild(cancelBtn);
    form.appendChild(btnDiv);
    overlay.appendChild(form);
    document.body.appendChild(overlay);
    const usersSnap = await dbGet("/users");
    if (usersSnap) {
        Object.entries(usersSnap).forEach(([uid, userData]) => {
            const displayName = userData?.profile?.displayName || uid;
            const option = document.createElement("option");
            option.value = uid;
            option.textContent = displayName;
            userSelect.appendChild(option);
        });
    }
    addBtn.onclick = () => overlay.style.display = "flex";
    cancelBtn.onclick = () => overlay.style.display = "none";
    saveBtn.onclick = async () => {
        const selectedUid = userSelect.value;
        if (!selectedUid) return showError("Select A User");
        const name = form.querySelector(".ptnNameInput").value.trim();
        const link = form.querySelector(".ptnLinkInput").value.trim();
        const photo = form.querySelector(".ptnPhotoInput").value.trim();
        const desc = form.querySelector(".ptnDescInput").value.trim();
        if (!name) return showError("Partner Name Cannot Be Empty");
        await dbUpdate(`/partners/${selectedUid}/${name}`, { link, photo, desc });
        await dbUpdate(`users/${selectedUid}/profile`, { isPartner: true });
        overlay.style.display = "none";
        showSuccess("Added Partner");
        loadPartners();
    };
}
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        const snap = await dbGet(`/users/${user.uid}/profile`);
        profileData = snap || {};
    }
    loadPartners();
    createAddPartnerButton();
});