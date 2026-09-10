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
const DEFAULT_ACCENT_COLOR = "#8cbe37";
const DEFAULT_TEXT_COLOR = "#f2eff0";
function generateNoUserId() {
    return "nouser-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
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
async function createPartnerRecord(uid, name, link, desc, color1, color2, noUser) {
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(`${a}/partners/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ uid, name, link, desc, color1, color2, noUser: !!noUser })
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Failed To Create Partner");
    }
    return json;
}
async function uploadPartnerPhotoFile(file, uid, name) {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append("uid", uid);
    formData.append("name", name);
    formData.append("file", file);
    const headers = {};
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(`${a}/upload-partner-photo`, {
        method: "POST",
        headers,
        body: formData
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Upload Failed");
    }
    return json.url;
}
function buildPhotoUploadField(initialUrl) {
    const photoDiv = document.createElement("div");
    photoDiv.style.display = "flex";
    photoDiv.style.flexDirection = "column";
    photoDiv.innerHTML = `
        <label class="btxt">Photo:</label>
        <img class="ptnPhotoPreview" src="${initialUrl ? a + initialUrl : a + "/pfps/1.jpeg"}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;">
        <input type="file" accept="image/png,image/jpeg,image/webp,image/x-icon" class="button ptnPhotoFileInput">
        <span class="ptnPhotoStatus" style="font-size:12px;opacity:0.8;"></span>
    `;
    const photoFileInput = photoDiv.querySelector(".ptnPhotoFileInput");
    const photoPreview = photoDiv.querySelector(".ptnPhotoPreview");
    const photoStatus = photoDiv.querySelector(".ptnPhotoStatus");
    let selectedFile = null;
    photoFileInput.onclick = (e) => e.stopPropagation();
    photoFileInput.onchange = () => {
        const file = photoFileInput.files[0] || null;
        selectedFile = file;
        if (file) {
            photoPreview.src = URL.createObjectURL(file);
            photoStatus.textContent = "Will Upload On Save";
        } else {
            photoStatus.textContent = "";
        }
    };
    return {
        element: photoDiv,
        currentUrl: initialUrl || "",
        getSelectedFile: () => selectedFile,
        setStatus: (text) => { photoStatus.textContent = text; }
    };
}
function buildColorFields(initialColor1, initialColor2) {
    const wrap = document.createElement("div");
    wrap.className = "ptn-color-row";
    wrap.innerHTML = `
        <div class="ptn-color-field">
            <label class="btxt">
                Accent Color (Glow / Arrow):
            </label>
            <input type="color" class="ptnColor1Input" value="${initialColor1 || DEFAULT_ACCENT_COLOR}">
        </div>
        <div class="ptn-color-field">
            <label class="btxt">Text Color:</label>
            <input type="color" class="ptnColor2Input" value="${initialColor2 || DEFAULT_TEXT_COLOR}">
        </div>
    `;
    const color1Input = wrap.querySelector(".ptnColor1Input");
    const color2Input = wrap.querySelector(".ptnColor2Input");
    color1Input.onclick = (e) => e.stopPropagation();
    color2Input.onclick = (e) => e.stopPropagation();
    return {
        element: wrap,
        getColor1: () => color1Input.value,
        getColor2: () => color2Input.value
    };
}
function createPartnerBox(uid, partnerName, data) {
    if (!data) return;
    const color1 = data.color1 || DEFAULT_ACCENT_COLOR;
    const color2 = data.color2 || DEFAULT_TEXT_COLOR;
    const box = document.createElement("div");
    box.className = "partner-box";
    box.style.setProperty("--ptn-accent", color1);
    box.style.setProperty("--ptn-text", color2);
    const top = document.createElement("div");
    top.className = "ptn-top";
    const iconWrap = document.createElement("div");
    iconWrap.className = "ptn-icon";
    const img = document.createElement("img");
    img.alt = partnerName;
    if (data.photo) {
        img.src = a + data.photo;
    } else if (data.link) {
        img.src = getMetadataImage(data.link);
    } else {
        img.src = a + "/pfps/1.jpeg";
    }
    iconWrap.appendChild(img);
    const name = document.createElement("span");
    name.className = "ptnName";
    name.textContent = partnerName;
    top.appendChild(iconWrap);
    top.appendChild(name);
    const desc = document.createElement("p");
    desc.className = "ptnDesc";
    desc.textContent = data.desc || "No Description Provided.";
    const arrow = document.createElement("a");
    arrow.className = "ptn-arrow";
    arrow.innerHTML = `<i class="ic ic-arrow-right"></i>`;
    arrow.onclick = (e) => e.stopPropagation();
    if (data.link) {
        arrow.href = data.link;
        arrow.target = "_blank";
    } else {
        arrow.href = "#";
        arrow.classList.add("ptn-arrow-disabled");
    }
    box.appendChild(top);
    box.appendChild(desc);
    box.appendChild(arrow);
    if (canEdit(uid)) {
        const editBtn = document.createElement("button");
        editBtn.innerHTML = `<i class="ic ic-pencil-fill"></i>`;
        editBtn.title = "Edit";
        editBtn.className = "ptnEdit-btn";
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = `<i class="ic ic-trash"></i>`;
        deleteBtn.title = "Delete";
        deleteBtn.className = "ptnDelete-btn";
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
        const photoField = buildPhotoUploadField(data.photo);
        const descDiv = document.createElement("div");
        descDiv.style.display = "flex";
        descDiv.style.flexDirection = "column";
        descDiv.innerHTML = `<label class="btxt">Description:</label><input class="button ptnDescInput" value="${data.desc || ""}" placeholder="Enter Description Here">`;        
        const colorFields = buildColorFields(data.color1, data.color2);
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.className = "button";
        saveBtn.onclick = async (e) => {
            e.stopPropagation();
            const nameInput = panel.querySelector(".ptnNameInput");
            const linkInput = panel.querySelector(".ptnLinkInput");
            const descInput = panel.querySelector(".ptnDescInput");
            const newName = nameInput.value.trim();
            const newColor1 = colorFields.getColor1();
            const newColor2 = colorFields.getColor2();
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
                photo: photoField.currentUrl,
                desc: descInput.value,
                color1: newColor1,
                color2: newColor2
            });
            box.style.setProperty("--ptn-accent", newColor1);
            box.style.setProperty("--ptn-text", newColor2);
            const selectedFile = photoField.getSelectedFile();
            if (selectedFile) {
                try {
                    photoField.setStatus("Uploading Photo...");
                    const url = await uploadPartnerPhotoFile(selectedFile, uid, newName);
                    await dbSet(`/partners/${uid}/${newName}/photo`, url);
                } catch (err) {
                    showError(err.message || "Photo Upload Failed");
                }
            }
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
        panel.appendChild(photoField.element);
        panel.appendChild(descDiv);
        panel.appendChild(colorFields.element);
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
                if (!partnerData) return;
                createPartnerBox(uid, partnerName, partnerData);
            });
        });
    });
}
async function createAddPartnerButton() {
    if (!currentUser || !profileData) return;
    if (!profileData.isOwner) return;
    const addBtn = document.createElement("button");
    addBtn.innerHTML = `Create A Partner <i class="ic ic-arrow-right"></i>`;
    addBtn.className = "button add-partner-btn ic-partners-apply-btn";
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
        max-height:90vh; overflow-y:auto; box-sizing:border-box;
    `;
    const userSelectDiv = document.createElement("div");
    userSelectDiv.style.display = "flex";
    userSelectDiv.style.flexDirection = "column";
    userSelectDiv.style.transition = "opacity 0.2s ease";
    const userSelectLabel = document.createElement("label");
    userSelectLabel.className = "btxt";
    userSelectLabel.textContent = "Select User:";
    const userSelect = document.createElement("select");
    userSelect.className = "button";
    userSelect.innerHTML = `<option value="">--Select User--</option>`;
    userSelectDiv.appendChild(userSelectLabel);
    userSelectDiv.appendChild(userSelect);
    form.appendChild(userSelectDiv);
    const noUserDiv = document.createElement("div");
    noUserDiv.style.display = "flex";
    noUserDiv.style.alignItems = "center";
    noUserDiv.style.gap = "8px";
    noUserDiv.innerHTML = `
        <input type="checkbox" class="ptnNoUserCheckbox" id="ptnNoUserCheckbox">
        <label class="btxt" for="ptnNoUserCheckbox">No User (Don't Assign The Partner Role To Anyone)</label>
    `;
    form.appendChild(noUserDiv);
    const noUserCheckbox = noUserDiv.querySelector(".ptnNoUserCheckbox");
    noUserCheckbox.onchange = () => {
        userSelect.disabled = noUserCheckbox.checked;
        userSelectDiv.style.opacity = noUserCheckbox.checked ? "0.4" : "1";
    };
    const fields = [
        {label: "Partner Name", class: "ptnNameInput"},
        {label: "Link", class: "ptnLinkInput"},
        {label: "Description", class: "ptnDescInput"}
    ];
    fields.forEach(f => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.innerHTML = `<label class="btxt">${f.label}:</label><input class="button ${f.class}" placeholder="Enter ${f.label}">`;
        form.appendChild(div);
    });
    const photoField = buildPhotoUploadField("");
    form.appendChild(photoField.element);
    const colorFields = buildColorFields(DEFAULT_ACCENT_COLOR, DEFAULT_TEXT_COLOR);
    form.appendChild(colorFields.element);
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
        const noUser = noUserCheckbox.checked;
        let selectedUid = userSelect.value;
        if (!noUser && !selectedUid) return showError("Select A User, Or Check \"No User\"");
        if (noUser) selectedUid = generateNoUserId();
        const name = form.querySelector(".ptnNameInput").value.trim();
        const link = form.querySelector(".ptnLinkInput").value.trim();
        const desc = form.querySelector(".ptnDescInput").value.trim();
        const color1 = colorFields.getColor1();
        const color2 = colorFields.getColor2();
        if (!name) return showError("Partner Name Cannot Be Empty");
        try {
            await createPartnerRecord(selectedUid, name, link, desc, color1, color2, noUser);
        } catch (err) {
            return showError(err.message || "Failed To Create Partner");
        }
        await dbSet(`/partners/${selectedUid}/${name}/color1`, color1);
        await dbSet(`/partners/${selectedUid}/${name}/color2`, color2);
        const selectedFile = photoField.getSelectedFile();
        if (selectedFile) {
            try {
                photoField.setStatus("Uploading Photo...");
                const url = await uploadPartnerPhotoFile(selectedFile, selectedUid, name);
                await dbSet(`/partners/${selectedUid}/${name}/photo`, url);
            } catch (err) {
                showError(err.message || "Photo Upload Failed");
            }
        }
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