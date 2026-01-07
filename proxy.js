const form = document.getElementById('pform');
const input = document.getElementById('purl');
const iframe = document.getElementById('pframe');
const errorDiv = document.getElementById('error');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let url = input.value.trim();
    if (!url) return;
    errorDiv.style.display = 'none';
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    errorDiv.textContent = '';
    iframe.srcdoc = '';
    try {
        const response = await fetch('https://included-touched-joey.ngrok-free.app/scramjet/url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        if (!response.ok) {
            const err = await response.json();
            errorDiv.style.display = 'block';
            errorDiv.style.color = 'red';
            throw new Error(err.error || 'Failed To Fetch URL');
        }
        const html = await response.text();
        iframe.srcdoc = html;
    } catch (err) {
        errorDiv.textContent = err.message;
    }
});