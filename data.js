let overrideChecks = false;
document.getElementById('overrideBtn').addEventListener('click', () => {
    overrideChecks = !overrideChecks;
    const btn = document.getElementById('overrideBtn');
    if (overrideChecks) {
        btn.textContent = "Override URL Checks: ON";
        btn.classList.remove('override-off');
        btn.classList.add('override-on');
        showSuccess("URL checks overridden");
    } else {
        btn.textContent = "Override URL Checks: OFF";
        btn.classList.remove('override-on');
        btn.classList.add('override-off');
        showSuccess("URL checks restored");
    }
});
function normalizeUrl(url) {
    url = url.trim();
    if (/^https?:\/\//i.test(url)) {
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
                return { status: "network-blocked" };
            }
        }
        return { status: "network-blocked" };
    }
}
function asciiEncode(str) {
    return [...str].map(c => {
        const code = c.charCodeAt(0);
        if (
            (code >= 65 && code <= 90) ||
            (code >= 97 && code <= 122) ||
            (code >= 48 && code <= 57) ||
            c === '-' || c === '_' || c === '.' || c === '~'
        ) {
            return c;
        }
        if (code === 10) return '%0A';
        if (code === 13) return '';
        if (code === 9) return '%09';
        if (code === 32) return '%20';
        return '%' + code.toString(16).toUpperCase().padStart(2, '0');
    }).join('');
}
function base64Decode(str) {
    return decodeURIComponent(escape(window.atob(str)));
}
function generateBase64(url) {
    if (!url) {
        showError("Please Enter A URL.");
        return '';
    }
    url = normalizeUrl(url);
    let template = base64Decode(j);
    template = template.replace('${url}', url);
    const base64 = btoa(unescape(encodeURIComponent(template)));
    return `data:image/svg+xml;base64,${base64}`;
}
function generateAsciiEncodedHtml(url) {
    if (!url) {
        showError("Please Enter A URL.");
        return '';
    }
    url = normalizeUrl(url);
    let htmlCode = base64Decode(k);
    htmlCode = htmlCode.replace("PUT_URL_HERE", url);
    const encoded = asciiEncode(htmlCode);
    return 'data:text/html;charset=utf-8,' + encoded;
}
async function generateDataUrl() {
    let urlInput = document.getElementById('urlInput').value.trim();
    const preset = document.getElementById('presetSelect').value;
    const type = document.getElementById('typeSelect').value;
    if (!urlInput && preset) urlInput = preset;
    if (!urlInput) {
        showError("Please Select Or Enter A URL.");
        return;
    }
    if (overrideChecks) {
        let result = '';
        if (type === 'image') {
            result = generateBase64(urlInput);
        } else {
            result = generateAsciiEncodedHtml(urlInput);
        }
        document.getElementById('output').value = result;
        showSuccess("Generated With Override");
        return;
    }
    const check = await checkURLStatus(urlInput);
    if (
        check.status === "cors-ok" ||
        check.status === "cors-ok-but-error" ||
        check.status === "cors-blocked"
    ) {
        let result = '';
        if (type === 'image') {
            result = generateBase64(urlInput);
        } else {
            result = generateAsciiEncodedHtml(urlInput);
        }
        document.getElementById('output').value = result;
        if (check.status === "cors-blocked") {
            showError("Website Does Not Allow CORS So Link May Not Work");
        } else {
            showSuccess("done");
        }
    }
    else if (check.status === "not-exist") {
        showError("ERR#15 Website Does Not Exist");
        document.getElementById('output').value = '';
    }
    else if (check.status === "network-blocked") {
        showError("Website Blocked For Your Internet Or Website Does Not Exist");
        document.getElementById('output').value = '';
    }
}
document.getElementById('presetSelect').addEventListener('change', () => {
    const presetVal = document.getElementById('presetSelect').value;
    if (presetVal) {
        document.getElementById('urlInput').value = presetVal;
    }
});
document.getElementById('generateBtn').addEventListener('click', generateDataUrl);
document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        generateDataUrl();
    }
});
document.getElementById('copyBtn').addEventListener('click', () => {
    const output = document.getElementById('output').value;
    if (!output) {
        showError("Nothing To Copy. Generate A URL First.");
        return;
    }
    navigator.clipboard.writeText(output)
    .then(() => showSuccess("Copied To Clipboard!"))
    .catch(() => showError("ERR#14 Failed To Copy."));
});