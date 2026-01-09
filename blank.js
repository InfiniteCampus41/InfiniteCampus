let bypassCustomChecks = false;
function openGame(url) {
    var win = window.open('about:blank');
    if (win) {
        win.document.open();
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="icon" type="image/png" href="/res/icon.png">
                <title>${c}</title>
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: black;
                    }
                    iframe {
                        width: 100vw;
                        height: 100vh;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <iframe src="${url}"></iframe>
            </body>
            </html>
        `);

        win.document.close();
    } else {
        showError("Err#1 Popup Blocked");
    }
}
function normalizeUrl(url) {
    url = url.trim();
    if (/^https?:\/\/www\./i.test(url)) {
        return url;
    }
    url = url.replace(/^https?:\/\//i, '');
    return 'https://.' + url;
}
async function checkURLStatus(url) {
    url = normalizeUrl(url);
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            return { status: "cors-ok" };
        } else {
            return { status: "cors-ok-but-error", code: response.status };
        }
    } catch (error) {
        if (error.name === "TypeError") {
            try {
                await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                return { status: "cors-blocked" };
            } catch {
                return { status: "not-exist" };
            }
        }
        return { status: "not-exist" };
    }
}
document.getElementById('openCustomUrl').addEventListener('click', async () => {
    let url = document.getElementById('customUrl').value.trim();
    if (!url) {
        showError('Please Enter A URL.');
        return;
    }
    try {
        url = new URL(url).href;
    } catch {
        try {
            url = normalizeUrl(url);
            url = new URL(url).href;
        } catch {
            showError('Invalid URL. Please Enter A Valid URL.');
            return;
        }
    }
    if (bypassCustomChecks) {
        openGame(url);
        return;
    }
    const existingWarning = document.getElementById('corsWarning');
    if (existingWarning) existingWarning.remove();
    const check = await checkURLStatus(url);
    if (check.status === "cors-ok" || check.status === "cors-ok-but-error") {
        openGame(url);
    } else if (check.status === "cors-blocked") {
        const container = document.createElement('div');
        container.id = 'corsWarning';
        container.style.marginTop = '15px';
        container.style.textAlign = 'center';
        const warningText = document.createElement('p');
        warningText.style.color = 'red';
        warningText.textContent =
            'Website Does Not Have CORS Enabled — About:Blank May Not Work';
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.classList.add('button');
        okButton.style.marginTop = '8px';
        okButton.addEventListener('click', () => {
            openGame(url);
            container.remove();
        });
        container.appendChild(warningText);
        container.appendChild(okButton);
        document
            .getElementById('openCustomUrl')
            .insertAdjacentElement('afterend', container);
    } else {
        showError('ERR#15 Website Does Not Exist');
    }
});
document.getElementById('openInfiniteCampus').addEventListener('click', () => {
    openGame(`${b}`);
});
const bypassBtn = document.createElement('button');
bypassBtn.textContent = 'Bypass URL Checks OFF';
bypassBtn.classList.add('button');
bypassBtn.style.marginTop = '10px';
bypassBtn.style.display = 'block';
bypassBtn.addEventListener('click', () => {
    bypassCustomChecks = !bypassCustomChecks;
    bypassBtn.textContent = bypassCustomChecks
        ? 'Bypass URL Checks ON'
        : 'Bypass URL Checks OFF';
});
document.getElementById('customUrl').insertAdjacentElement('afterend', bypassBtn);