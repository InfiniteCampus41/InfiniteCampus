const params = new URLSearchParams(window.location.search);
const byod = params.get("byod");
const byodSection = document.getElementById('byod');
const mirrorSection = document.getElementById('mirror');
if (byod) {
    mirrorSection.style.display = 'none';
    byodSection.style.display = 'block';
}