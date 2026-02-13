import { ref, push, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { auth, db } from "./firebase.js";
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
    push(ref(db, 'notes'), { text });
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
    const ownerSnap = await get(ref(db, `users/${user.uid}/profile/isOwner`));
    const testerSnap = await get(ref(db, `users/${user.uid}/profile/isTester`));
    const coOwnerSnap = await get(ref(db, `users/${user.uid}/profile/isCoOwner`));
    const hAdminSnap = await get(ref(db, `users/${user.uid}/profile/isHAdmin`));
    const adminSnap = await get(ref(db, `users/${user.uid}/profile/isAdmin`));
    const devSnap = await get(ref(db, `users/${user.uid}/profile/isDev`));
    isOwner = ownerSnap.exists() && ownerSnap.val() === true;
    isTester = testerSnap.exists() && testerSnap.val() === true;
    isCoOwner = coOwnerSnap.exists() && coOwnerSnap.val() === true;
    isHAdmin = hAdminSnap.exists() && hAdminSnap.val() === true;
    isAdmin = adminSnap.exists() && adminSnap.val() === true;
    isDev = devSnap.exists() && devSnap.val() === true;
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
onValue(ref(db, 'notes'), (snapshot) => {
    if (!notesContainer) return;
    notesContainer.innerHTML = '';
    snapshot.forEach((child) => {
        const note = child.val();
        const key = child.key;
        const div = document.createElement('div');
        div.className = 'note';
        div.innerHTML = `
            <div class="btxt" data-key="${key}">${note.text}</div>
            <button class="edit-btn button" data-key="${key}" style="display:none">Edit</button>
            <button class="save-edit-btn button" data-key="${key}" style="display:none">Save</button>
            <button class="delete-btn button" data-key="${key}" style="display:none">Delete</button>
        `;
        notesContainer.appendChild(div);
    });
    applyOwnerPermissions(isOwner || isTester || isCoOwner || isHAdmin || isAdmin || isDev);
});
notesContainer.addEventListener('click', (e) => {
    const button = e.target;
    const key = button.dataset.key;
    if (!key) return;
    if (!(isOwner || isTester || isCoOwner || isHAdmin || isAdmin || isDev)) return;
    if (button.classList.contains('delete-btn')) {
        remove(ref(db, 'notes/' + key));
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
    update(ref(db, 'notes/' + key), { text: newText });
    txtDiv.innerText = newText;
    saveButton.style.display = "none";
}