import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
let rightFtMsg = `Pissing Off Your Teachers Since 2024`;
let leftFtMsg = `Made With All The Love We Are Legally Allowed To Give!`;
const frameToday = new Date();
const month = frameToday.getMonth() + 1;
const day = frameToday.getDate();
if (month === 1 && day === 1) {
    rightFtMsg = `New Year, Same Chaos Since 2024`;
    leftFtMsg = `Starting The Year Questionably!`;
} else if (month === 2 && day === 14) {
    rightFtMsg = `Spreading Love (And Mild Annoyance) Since 2024`;
    leftFtMsg = `Made With Slightly Extra Love Today`;
} else if (month === 7 && day === 4) {
    rightFtMsg = `Independently Annoying Since 2024`;
    leftFtMsg = `Red, White, And Playing Games At School`;
} else if (month === 10 && day === 31) {
    rightFtMsg = `Scaring Teachers Since 2024`;
    leftFtMsg = `Powered By Sugar And Bad Decisions`;
} else if (month === 11 && day >= 22 && day <= 28 && frameToday.getDay() === 4) {
    rightFtMsg = `Thankful For Chaos Since 2024`;
    leftFtMsg = `Stuffed With Code And Regret`;
} else if (month === 12 && day === 25) {
    rightFtMsg = `Sleighing Teachers Since 2024`;
    leftFtMsg = `Made With Festive Mischief`;
}
const headerHTML = `
    <header id="site-header" class="rgb-element">
        <div id="header-left">
            <div id="weatherContainer">
                <div id="global-text">
                    <span id="weather">
                    </span>
                    <button class="darkbuttons"id="toggle">
                        °C
                    </button>
                </div>
            </div>
        </div>
        <div id="header-center">
            <a href="index.html">
                <img src="/res/logo.svg" id="logo">
            </a>
        </div>
        <div id="header-right">
            <button id="mobileMenuBtn" class="mobile-menu-btn">
                <i class="bi bi-list">
                </i>
            </button>
            <div id="desktopNav">
                <div class="dropdown-wrap">
                    <button id="abtToggle" class="dropdown-toggle">
                        About
                    </button>
                    <div class="dropdown test" id="abtDropdown">
                        <button onclick="location.href='InfiniteAbouts.html'">
                            About Us
                        </button>
                        <button onclick="location.href='InfinitePolicies.html'">
                            Privacy Policy
                        </button>
                        <button onclick="location.href='InfiniteTerms.html'">
                            Terms
                        </button>
                    </div>
                </div>
                <a href="InfiniteApps.html">
                    Apps
                </a>
                <div class="dropdown-wrap">
                    <button id="chatToggle" class="dropdown-toggle">
                        Chat
                    </button>
                    <div class="dropdown test" id="chatDropdown">
                        <button onclick="location.href='InfiniteEmbeds.html?choice=1'">
                            Padlet
                        </button>
                        <button onclick="location.href='InfiniteChatters.html'">
                            Website Chat
                        </button>
                        <button onclick="location.href='InfiniteDiscords.html'">
                            Live Discord Chat
                        </button>
                    </div>
                </div>
                <div class="dropdown-wrap">
                    <button id="helpToggle" class="dropdown-toggle">
                        Help / Support
                    </button>
                    <div class="dropdown test" id="helpDropdown">
                        <button onclick="location.href='InfiniteQuestions.html'">
                            FAQ
                        </button>
                        <button onclick="location.href='InfiniteEmbeds.html?choice=5'">
                            Report A Bug
                        </button>
                        <button onclick="location.href='InfiniteErrors.html'">
                            Check Error Codes
                        </button>
                    </div>
                </div>
                <a href="InfiniteGamers.html">
                    Games
                </a>
                <a href="InfinitePartners.html">
                    Partners
                </a>
                <a href="InfiniteUpdaters.html">
                    Updates
                </a>
                <div class="dropdown-wrap">
                    <button id="downloadToggle" class="dropdown-toggle">
                        Download Games
                    </button>
                    <div class="dropdown test" id="downloadDropdown">
                        <button onclick="location.href='InfiniteOpeners.html'">
                            Download This Website
                        </button>
                        <button onclick="location.href='InfiniteDownloaders.html'">
                            Download Games
                        </button>
                    </div>
                </div>
                <a class="contactme" href="InfiniteContacts.html">
                    Contact Me
                </a>
            </div>
        </div>
        <div id="snowContainer">
        </div>
    </header>
    <div id="mobileSidePanel" class="test rgb-element">
        <a id="lgbtn" href="index.html">
            <img src="/res/logo.svg" id="logo" style="width:fit-content; margin-bottom:-60px; display:block;">
        </a>
        <button id="closeMobilePanel" class="darkbuttons">
            <i class="bi bi-x-lg">
            </i>
        </button>
        <a href="InfiniteAbouts.html" class="darkbuttons">
            About
        </a>
        <a href="InfiniteApps.html" class="darkbuttons">
            Apps
        </a>
        <a href="InfiniteEmbeds.html?choice=1" class="darkbuttons">
            Padlet
        </a>
        <a href="InfiniteChatters.html" class="darkbuttons">
            Website Chat
        </a>
        <a href="InfiniteDiscords.html" class="darkbuttons">
            Live Discord Chat
        </a>
        <a href="InfiniteQuestions.html" class="darkbuttons">
            FAQ
        </a>
        <a href="InfiniteEmbeds.html?choice=5" class="darkbuttons">
            Report A Bug
        </a>
        <a href="InfiniteErrors.html" class="darkbuttons">
            Check Error Codes
        </a>
        <a href="InfiniteGamers.html" class="darkbuttons">
            Games
        </a>
        <a href="InfinitePartners.html" class="darkbuttons">
            Partners
        </a>
        <a href="InfiniteUpdaters.html" class="darkbuttons">
            Updates
        </a>
        <a href="InfiniteOpeners.html" class="darkbuttons">
            Download This Website
        </a>
        <a href="InfiniteDownloaders.html" class="darkbuttons">
            Download Games
        </a>
        <a href="InfiniteContacts.html" class="darkbuttons">
            Contact Me
        </a>
        <a href="InfinitePolicies.html" class="darkbuttons">
            Privacy Policy
        </a>
        <a href="InfiniteTerms.html" class="darkbuttons">
            Terms
        </a>
    </div>
    <footer id="site-footer" class="rgb-element">
        <span>
            ${leftFtMsg}
        </span>
        <span>
            ${rightFtMsg}
        </span>
    </footer>
`;
document.addEventListener("DOMContentLoaded", () => {
    const headerWrapper = document.createElement("div");
    headerWrapper.innerHTML = headerHTML;
    document.body.insertBefore(headerWrapper, document.body.firstChild);
    const snowContainer = document.getElementById("snowContainer");
    function calculateFlakeCount() {
        const width = window.innerWidth;
        if (width < 500) return 8;
        if (width < 800) return 15;
        return 40;
    }
    function createSnowflakes() {
        snowContainer.innerHTML = "";
        const count = calculateFlakeCount();
        const flakes = [];
        for (let i = 0; i < count; i++) {
            const flake = document.createElement("div");
            flake.className = "snowflake";
            snowContainer.appendChild(flake);
            flakes.push(flake);
        }
        return flakes;
    }
    let snowflakes = createSnowflakes();
    const toggleBtn = document.getElementById("toggleSnowBtn");
    function adjustSnowflakeCount() {
        const width = window.innerWidth;
        let maxFlakes;
        if (width < 500) {
            maxFlakes = 8;
        } else if (width < 800) {
            maxFlakes = 15;
        } else {
            maxFlakes = snowflakes.length;
        }
        snowflakes.forEach((flake, index) => {
            if (index < maxFlakes) {
                flake.style.display = "";
            } else {
                flake.style.display = "none";
            }
        });
    }
    adjustSnowflakeCount();
    window.addEventListener("resize", adjustSnowflakeCount);
    let containerWidth = snowContainer.clientWidth;
    function updateSnowflakePositions() {
        const spacing = containerWidth / snowflakes.length;
        snowflakes.forEach((flake, index) => {
            flake.startX = spacing * index + spacing / 2;
        });
    }
    updateSnowflakePositions();
    function startSnow() {
        snowContainer.style.display = "block";
        snowflakes.forEach(flake => flake.start && flake.start());
    }
    function stopSnow() {
        snowContainer.style.display = "none";
        snowflakes.forEach(flake => flake.stop && flake.stop());
    }
    let snowEnabled = localStorage.getItem("snowEnabled") === "true";
    if (localStorage.getItem("snowEnabled") === null) {
        snowEnabled = true;
        localStorage.setItem("snowEnabled", "true");
    }
    if (snowEnabled) {
        startSnow();
    } else {
        stopSnow();
    }
    function waitForToggleSnowBtn(callback) {
        const existing = document.getElementById("toggleSnowBtn");
        if (existing) {
            callback(existing);
            return;
        }
        const observer = new MutationObserver(() => {
            const btn = document.getElementById("toggleSnowBtn");
            if (btn) {
                observer.disconnect();
                callback(btn);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    waitForToggleSnowBtn((toggleBtn) => {
        const monthIndex = new Date().getMonth();
        if (monthIndex === 11 || monthIndex === 0) {
            toggleBtn.textContent = "Toggle Snow";
        } else if (monthIndex === 1) {
            toggleBtn.textContent = 'Toggle Hearts';
        } else if (monthIndex >= 2 && monthIndex <= 8) {
            toggleBtn.style.display = 'none';
        } else if (monthIndex === 9) {
            toggleBtn.textContent = 'Toggle Pumpkins';
        } else if (monthIndex === 10) {
            toggleBtn.textContent = 'Toggle Leaves';
        }
        toggleBtn.addEventListener("click", () => {
            snowEnabled = !snowEnabled;
            localStorage.setItem("snowEnabled", snowEnabled.toString());
            snowEnabled ? startSnow() : stopSnow();
        });
    });
    function initSnowflakeAnimations() {
        const monthIndex = new Date().getMonth();
        snowflakes.forEach((flake) => {
            flake.style.display = "";
            let iconClass = "";
            let iconColor = "";
            if (monthIndex === 11 || monthIndex === 0) {
                iconClass = "bi bi-snow";
                iconColor = "white";
            } 
            else if (monthIndex === 1) {
                iconClass = "bi bi-suit-heart-fill";
                iconColor = "red";
            } 
            else if (monthIndex >= 2 && monthIndex <= 8) {
                flake.style.display = "none";
                return;
            } 
            else if (monthIndex === 9) {
                iconClass = "fa-solid fa-pumpkin";
                iconColor = "orange";
            } 
            else if (monthIndex === 10) {
                iconClass = "bi bi-leaf-fill";
                iconColor = "darkgoldenrod";
            }
            flake.innerHTML = `<i class="${iconClass}" style="color:${iconColor}"></i>`;
            let y = Math.random() * 60;
            let swayOffset = Math.random() * Math.PI * 2;
            let running = false;
            const size = 3 + Math.random() * 4;
            const startX = flake.startX;
            const swayAmplitude = 5 + Math.random() * 5;
            const speedY = 0.3 + Math.random() * 0.4;
            const swaySpeed = 0.02 + Math.random() * 0.02;
            flake.style.width = `${size}px`;
            flake.style.height = `${size}px`;
            function animate() {
                if (!running) return;
                y += speedY;
                if (y > 60) y = -10;
                const x = startX + Math.sin(swayOffset) * swayAmplitude;
                swayOffset += swaySpeed;
                flake.style.transform =
                    `translate(${x}px, ${y}px) rotate(${y * 4}deg)`;
                requestAnimationFrame(animate);
            }
            flake.start = () => {
                if (!running) {
                    running = true;
                    animate();
                }
            };
            flake.stop = () => {
                running = false;
            };
            if (snowEnabled) flake.start();
        });
    }
    initSnowflakeAnimations();
    window.addEventListener("resize", () => {
        containerWidth = snowContainer.clientWidth;
        snowflakes = createSnowflakes();
        updateSnowflakePositions();
        initSnowflakeAnimations();
        if (snowEnabled) {
            snowflakes.forEach(flake => flake.start && flake.start());
        }
    });
    const chatToggle = document.getElementById('chatToggle');
    const chatDropdown = document.getElementById('chatDropdown');
    const downloadToggle = document.getElementById('downloadToggle');
    const downloadDropdown = document.getElementById('downloadDropdown');
    const helpToggle = document.getElementById('helpToggle');
    const helpDropdown = document.getElementById('helpDropdown');
    const abtToggle = document.getElementById('abtToggle');
    const abtDropdown = document.getElementById('abtDropdown');
    chatToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        chatDropdown.style.display = chatDropdown.style.display === 'flex' ? 'none' : 'flex';
        downloadDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
        abtDropdown.style.display = 'none';
    });
    downloadToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadDropdown.style.display = downloadDropdown.style.display === 'flex' ? 'none' : 'flex';
        chatDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
        abtDropdown.style.display = 'none';
    });
    helpToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        helpDropdown.style.display = helpDropdown.style.display === 'flex' ? 'none' : 'flex';
        downloadDropdown.style.display = 'none';
        chatDropdown.style.display = 'none';
        abtDropdown.style.display = 'none';
    });
    abtToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        abtDropdown.style.display = abtDropdown.style.display === 'flex' ? 'none' : 'flex';
        downloadDropdown.style.display = 'none';
        chatDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
        if (!chatDropdown.contains(e.target) && !chatToggle.contains(e.target)) {
            chatDropdown.style.display = 'none';
        }
        if (!downloadDropdown.contains(e.target) && !downloadToggle.contains(e.target)) {
            downloadDropdown.style.display = 'none';
        }
        if (!helpDropdown.contains(e.target) && !helpToggle.contains(e.target)) {
            helpDropdown.style.display = 'none';
        }
        if (!abtDropdown.contains(e.target) && !abtToggle.contains(e.target)) {
            abtDropdown.style.display = 'none';
        }
    });
    const mobileBtn = document.getElementById("mobileMenuBtn");
    const mobilePanel = document.getElementById("mobileSidePanel");
    const closeMobile = document.getElementById("closeMobilePanel");
    const overlay = document.createElement("div");
    overlay.id = "mobileOverlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () => {
        mobilePanel.style.right = "-100%";
        overlay.style.display = "none";
    });
    mobileBtn.addEventListener("click", () => {
        mobilePanel.style.right = "0";
        overlay.style.display = "block";
    });
    closeMobile.addEventListener("click", () => {
        mobilePanel.style.right = "-100%";
        overlay.style.display = 'none';
    });
    function updateHeaderFooterHeights() {
        const header = document.getElementById("site-header");
        const footer = document.getElementById("site-footer");
        if (!header || !footer) return;
        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;
        document.documentElement.style.setProperty(
            "--headerHeight",
            headerHeight + "px"
        );
        document.documentElement.style.setProperty(
            "--footerHeight",
            footerHeight + "px"
        );
    }
    updateHeaderFooterHeights();
    window.addEventListener("resize", updateHeaderFooterHeights);
});
const LOADER_CONFIG = {
    mode: "auto",
};
const loader = document.createElement("div");
loader.id = "planet-loader";
loader.innerHTML = `
    <div class="planet-wrapper">
        <div class="ring ring1"></div>
        <div class="ring ring2"></div>
        <div class="ring ring3"></div>
        <div class="letter">C</div>
    </div>
    <div id="loader-maint-content" style="display:none; flex-direction:column; align-items:center; margin-top:20px;">
        <div id="loader-maint-message" style="margin-bottom:15px; font-size:18px; text-align:center;"></div>
        <a href="https://status.infinitecampus.xyz" id="loader-maint-btn" class="discord">Check Statuses</a>
    </div>
`;
document.body.prepend(loader);
const maintContent = loader.querySelector("#loader-maint-content");
const maintMessage = loader.querySelector("#loader-maint-message");
const maintBtn = loader.querySelector("#loader-maint-btn");
let isLoaded = false;
function showLoader() {
    loader.style.display = "flex";
    loader.style.flexDirection = "column";
    loader.style.opacity = "1";
    loader.style.color = "white";
    loader.style.top = "60px";
}
function hideLoader() {
    loader.style.opacity = "0";
    loader.style.top = "60px";
    setTimeout(() => {
        loader.style.display = "none";
    }, 600);
}
function applyLoaderMode(mode, message = "") {
    LOADER_CONFIG.mode = mode || "auto";
    if (mode === "maint") {
        showLoader();
        maintContent.style.display = "flex";
        maintMessage.textContent = message || "Maintenance Mode Enabled";
    }
    else if (mode === "infinite") {
        maintContent.style.display = "none";
        showLoader();
    }
    else if (mode === "time") {
        maintContent.style.display = "none";
        showLoader();
        setTimeout(hideLoader, 3000);
    }
    else if (mode === "auto") {
        if (isLoaded) {
            hideLoader();
        } else {
            maintContent.style.display = "none";
            showLoader();
        }
    }
}
applyLoaderMode("auto");
window.addEventListener("load", () => {
    isLoaded = true;
    if (LOADER_CONFIG.mode === "auto") {
        hideLoader();
    }
});
const loaderModeRef = ref(db, "/site/loader/mode");
const loaderMessageRef = ref(db, "/site/loader/message");
let currentMessage = "";
onValue(loaderMessageRef, (snap) => {
    currentMessage = snap.val() || "";
    if (LOADER_CONFIG.mode === "maint") {
        maintMessage.textContent = currentMessage;
    }
    if (LOADER_CONFIG.mode === "auto") {
        maintMessage.textContent = currentMessage;
    }
});
onValue(loaderModeRef, (snap) => {
    const mode = snap.val() || "auto";
    applyLoaderMode(mode, currentMessage);
});