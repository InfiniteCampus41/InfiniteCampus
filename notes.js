import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');
const notesContainer = document.getElementById('notesContainer');
function saveNote() {
    if (!noteInput) return;
    const text = noteInput.value.trim();
    if (text) {
        push(ref(db, 'notes'), { text });
        noteInput.value = '';
    }
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
let isOwner = false;
let isTester = false;
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        applyOwnerPermissions(false);
        return;
    }
    const ownerRef = ref(db, `users/${user.uid}/profile/isOwner`);
    const ownerSnap = await get(ownerRef);
    isOwner = ownerSnap.exists() && ownerSnap.val() === true;
    const testerRef = ref(db, `users/${user.uid}/profile/isTester`);
    const testerSnap = await get(testerRef);
    isTester = testerSnap.exists() && testerSnap.val() === true;
    applyOwnerPermissions(isOwner || isTester);
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
    applyOwnerPermissions(isOwner || isTester);
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!isOwner || !isTester) return;
            const key = button.getAttribute('data-key');
            remove(ref(db, 'notes/' + key));
        });
    });
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!isOwner || !isTester) return;
            const key = button.getAttribute('data-key');
            const txtDiv = document.querySelector(`.txt[data-key="${key}"]`);
            const saveButton = document.querySelector(`.save-edit-btn[data-key="${key}"]`);
            const currentText = txtDiv.innerText;
            txtDiv.innerHTML = `<input type="text" class="edit-input button" value="${currentText}">`;
            const input = txtDiv.querySelector('.edit-input');
            saveButton.style.display = "inline-block";
            input.focus();
            input.select();
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit(key, txtDiv, saveButton);
                }
                if (e.key === 'Escape') {
                    txtDiv.innerText = currentText;
                    saveButton.style.display = "none";
                }
            });
            saveButton.onclick = () => {
                saveEdit(key, txtDiv, saveButton);
            };
        });
    });
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