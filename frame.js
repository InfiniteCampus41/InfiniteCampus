let rightFtMsg = `Pissing off your teachers since 2024`;
let leftFtMsg = `Made with all the love we are legally allowed to give!`;
const frameToday = new Date();
const month = frameToday.getMonth() + 1;
const day = frameToday.getDate();
const isSecondSundayOfMay =
    month === 5 &&
    frameToday.getDay() === 0 &&
    day >= 8 &&
    day <= 14;
const isThirdSundayOfJune =
    month === 6 &&
    frameToday.getDay() === 0 &&
    day >= 15 &&
    day <= 21;
if (isSecondSundayOfMay) {
    leftFtMsg = `Made with motherly love`;
} else if (isThirdSundayOfJune) {
    leftFtMsg = `Made with fatherly love`;
} else if (month === 1 && day === 1) {
    rightFtMsg = `New year, same chaos since 2024`;
    leftFtMsg = `Starting the year questionably!`;
} else if (month === 2 && day === 14) {
    rightFtMsg = `Spreading love (And mild annoyance) since 2024`;
    leftFtMsg = `Made with slightly extra love today`;
} else if (month === 4 && day === 1) {
    rightFtMsg = `April fools!`;
    leftFtMsg = `This website will shut down for good in a month`;
} else if (month === 7 && day === 4) {
    rightFtMsg = `Independently annoying since 2024`;
    leftFtMsg = `Red, white, and playing games at school`;
} else if (month === 10 && day === 31) {
    rightFtMsg = `Scaring teachers since 2024`;
    leftFtMsg = `Powered by sugar and bad decisions`;
} else if (month === 11 && day >= 22 && day <= 28 && frameToday.getDay() === 4) {
    rightFtMsg = `Thankful for chaos since 2024`;
    leftFtMsg = `Stuffed with code and regret`;
} else if (month === 12 && day === 25) {
    rightFtMsg = `Sleighing teachers since 2024`;
    leftFtMsg = `Made with festive mischief`;
}
const headerHTML = `
    <header id="site-header" class="themed">
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
                <i class="ic ic-list">
                </i>
            </button>
            <div id="desktopNav">
                <div class="dropdown-wrap">
                    <button id="abtToggle" class="dropdown-toggle">
                        About
                    </button>
                    <div class="dropdown themed" id="abtDropdown">
                        <a href='InfiniteAbouts.html'>
                            About us
                        </a>
                        <a href='InfinitePolicies.html'>
                            Privacy policy
                        </a>
                        <a href='InfiniteTerms.html'>
                            Terms
                        </a>
                    </div>
                </div>
                <a href="InfiniteApps.html">
                    Apps
                </a>
                <a href="InfiniteChatters.html">
                    Chat
                </a>
                <div class="dropdown-wrap">
                    <button id="helpToggle" class="dropdown-toggle">
                        Help / Support
                    </button>
                    <div class="dropdown themed" id="helpDropdown">
                        <a href='InfiniteApps.html?question=true'>
                            FAQ
                        </a>
                        <a href='InfiniteEmbeds.html?choice=5'>
                            Report a bug
                        </a>
                        <a href='InfiniteApps.html?mirror=true'>
                            Mirror links
                        </a>
                    </div>
                </div>
                <a href="InfiniteGamers.html">
                    Games
                </a>
                <a href="InfinitePartners.html">
                    Partners
                </a>
                <div class="dropdown-wrap">
                    <button id="updateToggle" class="dropdown-toggle">
                        Updates
                    </button>
                    <div class="dropdown themed" id="updateDropdown">
                        <a href='InfiniteArticles.html'>
                            News
                        </a>
                        <a href="InfiniteUpdaters.html">
                            Updates
                        </a>
                        <a href="InfiniteUpdaters.html?future=true">
                            Future updates
                        </a>
                    </div>
                </div>
                <div class="dropdown-wrap">
                    <button id="downloadToggle" class="dropdown-toggle">
                        Downloads
                    </button>
                    <div class="dropdown themed" id="downloadDropdown">
                        <a href='InfiniteApps.html?website=true'>
                            Download this website
                        </a>
                        <a href='InfiniteApps.html?games=true'>
                            Download games
                        </a>
                    </div>
                </div>
                <a class="contactme" href="InfiniteContacts.html">
                    Contact me
                </a>
            </div>
        </div>
        <div id="snowContainer">
        </div>
    </header>
    <div id="mobileSidePanel" class="themed">
        <a id="lgbtn" href="index.html">
            <img src="/res/logo.svg" id="logo" style="width:fit-content; margin-bottom:-60px; display:block;">
        </a>
        <button id="closeMobilePanel" class="darkbuttons">
            <i class="ic ic-x-lg">
            </i>
        </button>
        <a href="InfiniteAbouts.html" class="darkbuttons">
            About
        </a>
        <a href="InfiniteApps.html" class="darkbuttons">
            Apps
        </a>
        <a href="InfiniteChatters.html" class="darkbuttons">
            Chat
        </a>
        <a href="InfiniteApps.html?question=true" class="darkbuttons">
            FAQ
        </a>
        <a href="InfiniteEmbeds.html?choice=5" class="darkbuttons">
            Report a bug
        </a>
        <a href="InfiniteApps.html?mirror=true" class="darkbuttons">
            Mirror links
        </a>
        <a href="InfiniteGamers.html" class="darkbuttons">
            Games
        </a>
        <a href="InfinitePartners.html" class="darkbuttons">
            Partners
        </a>
        <a href="InfiniteArticles.html" class="darkbuttons">
            News
        </a>
        <a href="InfiniteUpdaters.html" class="darkbuttons">
            Updates
        </a>
        <a href="InfiniteUpdaters.html?future=true" class="darkbuttons">
            Future updates
        </a>
        <a href="InfiniteApps.html?website=true" class="darkbuttons">
            Download this website
        </a>
        <a href="InfiniteApps.html?games=true" class="darkbuttons">
            Download games
        </a>
        <a href="InfiniteContacts.html" class="darkbuttons">
            Contact me
        </a>
        <a href="InfinitePolicies.html" class="darkbuttons">
            Privacy policy
        </a>
        <a href="InfiniteTerms.html" class="darkbuttons">
            Terms
        </a>
    </div>
    <footer id="site-footer" class="themed">
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
    function applyDiscordLink() {
        let discordLink = document.getElementById("discordLink");
        let discordBtn = document.getElementById("discordBtn");
        if (discordLink) {
            discordLink.innerText = i;
        }
        if (discordBtn) {
            discordBtn.href = i;
        }
    }
    applyDiscordLink();
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
            toggleBtn.textContent = "Toggle snow";
        } else if (monthIndex === 1) {
            toggleBtn.textContent = 'Toggle hearts';
        } else if (monthIndex >= 2 && monthIndex <= 8) {
            toggleBtn.style.display = 'none';
        } else if (monthIndex === 9) {
            toggleBtn.textContent = 'Toggle pumpkins';
        } else if (monthIndex === 10) {
            toggleBtn.textContent = 'Toggle leaves';
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
                iconClass = "ic ic-snow";
                iconColor = "white";
            } 
            else if (monthIndex === 1) {
                iconClass = "ic ic-heart-fill";
                iconColor = "red";
            } 
            else if (monthIndex >= 2 && monthIndex <= 8) {
                flake.style.display = "none";
                return;
            } 
            else if (monthIndex === 9) {
                iconClass = "ic ic-pumpkin";
                iconColor = "orange";
            } 
            else if (monthIndex === 10) {
                iconClass = "ic ic-leaf-fill";
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
    const downloadToggle = document.getElementById('downloadToggle');
    const downloadDropdown = document.getElementById('downloadDropdown');
    const helpToggle = document.getElementById('helpToggle');
    const helpDropdown = document.getElementById('helpDropdown');
    const abtToggle = document.getElementById('abtToggle');
    const abtDropdown = document.getElementById('abtDropdown');
    const updateToggle = document.getElementById('updateToggle');
    const updateDropdown = document.getElementById('updateDropdown');
    downloadToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadDropdown.style.display = downloadDropdown.style.display === 'flex' ? 'none' : 'flex';
        updateDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
        abtDropdown.style.display = 'none';
    });
    helpToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        helpDropdown.style.display = helpDropdown.style.display === 'flex' ? 'none' : 'flex';
        updateDropdown.style.display = 'none';
        downloadDropdown.style.display = 'none';
        abtDropdown.style.display = 'none';
    });
    abtToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        abtDropdown.style.display = abtDropdown.style.display === 'flex' ? 'none' : 'flex';
        updateDropdown.style.display = 'none';
        downloadDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
    });
    updateToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        updateDropdown.style.display = updateDropdown.style.display === 'flex' ? 'none' : 'flex';
        abtDropdown.style.display = 'none';
        downloadDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
        if (!downloadDropdown.contains(e.target) && !downloadToggle.contains(e.target)) {
            downloadDropdown.style.display = 'none';
        }
        if (!helpDropdown.contains(e.target) && !helpToggle.contains(e.target)) {
            helpDropdown.style.display = 'none';
        }
        if (!abtDropdown.contains(e.target) && !abtToggle.contains(e.target)) {
            abtDropdown.style.display = 'none';
        }
        if (!updateDropdown.contains(e.target) && !updateToggle.contains(e.target)) {
            updateDropdown.style.display = 'none';
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
    appendToMain();
});
function appendToMain() {
    const excludedPages = [
        "/InfiniteChatters.html",
        "/InfiniteEmbeds.html",
        "/InfiniteGamers.html",
        "/InfiniteBrowsers.html",
        "/InfiniteDonaters.html",
        "/InfiniteProxies.html",
        "/InfiniteOldProxies.html",
        "/InfiniteAccounts.html",
        "/InfiniteAdmins.html",
        "/InfiniteArchives.html",
        "/InfinitePolicies.html",
        "/InfiniteTerms.html",
        "/InfiniteAis.html",
        "/InfiniteApps.html?listen=true",
        "/InfiniteApps.html?player=true",
        "/InfiniteLegacyGames.html"
    ];
    const currentPage = window.location.pathname + window.location.search;
    if (excludedPages.some(page => currentPage.includes(page))) {
        return;
    }
    const main = document.querySelector("main");
    if (!main) return;
    const extraHTML = `
        <br>
        <br>
        <center>
            <div id="donation-auto-msg">
                <p class="btxt">
                    Infinite Campus is a free service, but it isn't free to run. If you would like to support us, consider donating
                </p>
                <a class="button apbtn" href="/InfiniteDonaters.html">
                    Donate
                </a>
            </div>
            <br>
            <p class="btxt">
                All new updates are on the updates page
                <br>
                Also join the
                <a href="${i}" class="discord" target="_blank">
                    Discord
                </a>
                ${i}
            </p>
            <br>
            <br>
            <br>
        </center>
    `;
    main.insertAdjacentHTML("beforeend", extraHTML);
}
const isChattersPage = window.location.pathname
    .toLowerCase()
    .includes("infinitechatters.html");
if (!isChattersPage) {
    const LOADER_CONFIG = {
        mode: "auto",
    };
    let loadingScreensDisabled = false;
    loadingScreensDisabled = localStorage.getItem("loadingScreensDisabled") === "true";
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
            <a href="https://status.infinitecampus.xyz" id="loader-maint-btn" class="discord">Check statuses</a>
        </div>
        <div id="loader-slow-msg">
            <div id="loader-slow-second-msg">Taking longer than usual<br><small>The site may be under heavy load.</small></div>
            <a href="https://status.infinitecampus.xyz" class="discord" style="font-size:13px; margin-top:8px;">Check statuses</a>
            <div id="loader-disable-row">
                <span id="loader-disable-label">Disable loading screens</span>
                <label class="switch" id="loader-disable-switch">
                    <input type="checkbox" id="loader-disable-checkbox" ${loadingScreensDisabled ? "checked" : ""}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    `;
    if (!loadingScreensDisabled) {
        document.body.prepend(loader);
    }
    const maintContent = loader.querySelector("#loader-maint-content");
    const maintMessage = loader.querySelector("#loader-maint-message");
    const maintBtn = loader.querySelector("#loader-maint-btn");
    const slowMsg = loader.querySelector("#loader-slow-msg");
    const disableCheckbox = loader.querySelector("#loader-disable-checkbox");
    disableCheckbox.addEventListener("change", () => {
        loadingScreensDisabled = disableCheckbox.checked;
        localStorage.setItem("loadingScreensDisabled", loadingScreensDisabled.toString());
        if (loadingScreensDisabled) {
            hideLoader();
        }
    });
    let isLoaded = false;
    let slowTimer = null;
    function showSlowMsg() {
        slowMsg.classList.add("visible");
    }
    function hideSlowMsg() {
        slowMsg.classList.remove("visible");
    }
    function startSlowTimer() {
        clearTimeout(slowTimer);
        slowTimer = setTimeout(() => {
            if (!isLoaded) {
                showSlowMsg();
            }
        }, 5000);
    }
    function cancelSlowTimer() {
        clearTimeout(slowTimer);
        hideSlowMsg();
    }
    function showLoader() {
        if (loadingScreensDisabled) return;
        loader.style.display = "flex";
        loader.style.flexDirection = "column";
        loader.style.opacity = "1";
        loader.style.color = "white";
        loader.style.top = "60px";
    }
    function hideLoader() {
        cancelSlowTimer();
        loader.style.opacity = "0";
        loader.style.top = "60px";
        setTimeout(() => {
            loader.style.display = "none";
        }, 600);
    }
    function showPxyLoader() {
        if (!document.getElementById("planet-loader")) {
            document.body.prepend(loader);
        }
        loader.style.display = "flex";
        loader.style.top = "134.8px";
        loader.style.opacity = "1";
    }
    function hidePxyLoader() {
        loader.style.opacity = "0";
        loader.style.top = '60px';
        setTimeout(() => {
            loader.style.display = "none";
        }, 600);
    }
    let bypassLoader = false;
    function applyLoaderMode(mode, message = "") {
        LOADER_CONFIG.mode = mode || "auto";
        if ((loadingScreensDisabled || bypassLoader) && (mode === "maint" || mode === "infinite" || mode === "time")) {
            hideLoader();
            return;
        }
        if (mode === "maint") {
            showLoader();
            maintContent.style.display = "flex";
            maintMessage.textContent = message || "Maintenance mode enabled";
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
                if (!loadingScreensDisabled) {
                    showLoader();
                    startSlowTimer();
                }
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
    window.showLoader = showLoader;
    window.hideLoader = hideLoader;
    window.showPxyLoader = showPxyLoader;
    window.hidePxyLoader = hidePxyLoader;
}