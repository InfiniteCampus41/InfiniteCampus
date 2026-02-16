const loader = document.createElement("div");
const before = document.getElementById("before");
loader.id = "planet-loader";
loader.innerHTML = `
    <div class="planet-wrapper">
        <div class="ring ring1"></div>
        <div class="ring ring2"></div>
        <div class="ring ring3"></div>
        <div class="letter">C</div>
    </div>
`;
const style = document.createElement("style");
style.innerHTML = `
#planet-loader {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, #0d1117, #000);
    display: flex;
    top:60px;
    bottom:30px;
    justify-content: center;
    align-items: center;
    z-index: 10;
    transition: opacity 0.6s ease;
}
.planet-wrapper {
    position: relative;
    width: 200px;
    height: 200px;
}
.letter {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 120px;
    font-weight: bold;
    color: #8cbe37;
    transform: rotateX(20deg);
    text-shadow: 0 0 20px rgba(255,255,255,0.6);
}
.ring {
    position: absolute;
    border: 3px solid rgba(0,255,0,0.6);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform-style: preserve-3d;
}
.ring1 {
    width: 220px;
    height: 80px;
    margin: -40px 0 0 -110px;
    animation: spin1 3s linear infinite;
}
.ring2 {
    width: 180px;
    height: 60px;
    margin: -30px 0 0 -90px;
    animation: spin2 4s linear infinite;
}
.ring3 {
    width: 250px;
    height: 100px;
    margin: -50px 0 0 -125px;
    animation: spin3 5s linear infinite;
}
@keyframes spin1 {
    from { transform: rotateX(70deg) rotateZ(0deg); }
    to   { transform: rotateX(70deg) rotateZ(360deg); }
}
@keyframes spin2 {
    from { transform: rotateX(65deg) rotateZ(360deg); }
    to   { transform: rotateX(65deg) rotateZ(0deg); }
}
@keyframes spin3 {
    from { transform: rotateX(75deg) rotateZ(0deg); }
    to   { transform: rotateX(75deg) rotateZ(-360deg); }
}
`;
document.head.appendChild(style);
function showLoader() {
    if (!document.getElementById("planet-loader")) {
        document.body.prepend(loader);
    }
    loader.style.display = "flex";
    loader.style.opacity = "1";
}
function hideLoader() {
    loader.style.opacity = "0";
    setTimeout(() => {
        loader.style.display = "none";
    }, 600);
}
window.logProxyVisit = async function(input) {
    let logUrl;
    before.style.display = 'none';
    try {
        const parsedUrl = new URL(input.startsWith("http") ? input : `https://${input}`);
        logUrl = `https://${parsedUrl.hostname.toLowerCase()}`;
    } catch {
        logUrl = input.toLowerCase();
    }
    const payload = {
        url: logUrl,
        timestamp: new Date().toISOString()
    };
    try {
        await fetch("/logs", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(payload)
        });
    } catch {}
};
const observer = new MutationObserver(() => {
    const btn = document.getElementById('pxyFcrn');
    const frame = document.getElementById('sj-frame');
    if (!frame) return;
    frame.addEventListener("load", () => {
        hideLoader();
    });
    if (btn) {
        let fullscreen = false;
        btn.onclick = () => {
            fullscreen = !fullscreen;
            if (fullscreen) {
                frame.style.width = '100vw';
                frame.style.height = '100vh';
                frame.style.marginTop = '0px';
                frame.style.zIndex = '9998';
            } else {
                frame.style.width = '';
                frame.style.height = '87vh';
                frame.style.marginTop = '60px';
                frame.style.zIndex = '1';
            }
        };
    }
    if (frame.complete) {
        hideLoader();
    }
    observer.disconnect();
});
observer.observe(document.body, { childList:true, subtree:true });