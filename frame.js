const headerHTML = `
    <header id="site-header" class="rgb-element">
        <div id="header-left">
            <div id="weatherContainer">
                <div id="global-text">
                    <span id="weather"></span>
                    <button class="darkbuttons"id="toggle">°C</button>
                </div>
            </div>
        </div>
        <div id="header-center">
            <a href="index.html">
                <img src="/res/logo.svg" id="logo">
            </a>
        </div>
        <div id="header-right">
            <a href="InfiniteAbouts.html">About</a>
            <a href="InfiniteApps.html">Apps</a>
            <div class="dropdown-wrap">
                <button id="chatToggle" class="dropdown-toggle">Chat</button>
                <div class="dropdown test" id="chatDropdown">
                    <button onclick="location.href='InfiniteTalkers.html'">Padlet</button>
                    <button onclick="location.href='InfiniteChatters.html'">Website Chat</button>
                    <button onclick="location.href='InfiniteDiscords.html'">Live Discord Chat</button>
                </div>
            </div>
            <div class="dropdown-wrap">
                <button id="helpToggle" class="dropdown-toggle">Help / Support</button>
                <div class="dropdown test" id="helpDropdown">
                    <button onclick="location.href='InfiniteQuestions.html'">FAQ</button>
                    <button onclick="location.href='InfiniteIssues.html'">Report A Bug</button>
                    <button onclick="location.href='InfiniteErrors.html'">Check Error Codes</button>
                </div>
            </div>
            <a href="InfiniteGamers.html">Games</a>
            <a href="InfiniteCheaters.html">Cheats</a>
            <a href="InfiniteUpdaters.html">Updates</a>
            <div class="dropdown-wrap">
                <button id="downloadToggle" class="dropdown-toggle">Download Games</button>
                <div class="dropdown test" id="downloadDropdown">
                    <button onclick="location.href='InfiniteOpeners.html'">Download This Website</button>
                    <button onclick="location.href='InfiniteDownloaders.html'">Download Games</button>
                </div>
            </div>
            <a class="contactme" href="InfiniteContacts.html">Contact Me</a>
        </div>
    </header>
    <footer id="site-footer" class="rgb-element">
        <span>
            Totally Made By Noah White And Not A Different Person.
        </span>
        <span>
            Pissing Off Your Teachers Since 2024
        </span>
    </footer>
    <br>
    <br>
    <br>
    <div id="snowContainer">
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
        <div class="snowflake"></div>
    </div>
`;
document.addEventListener("DOMContentLoaded", () => {
    const headerWrapper = document.createElement("div");
    headerWrapper.innerHTML = headerHTML;
    document.body.insertBefore(headerWrapper, document.body.firstChild);
    const snowContainer = document.getElementById("snowContainer");
    const toggleBtn = document.getElementById("toggleSnowBtn");
    const snowflakes = Array.from(document.querySelectorAll(".snowflake"));
    let containerWidth = snowContainer.clientWidth;
    function updateSnowflakePositions() {
        const spacing = containerWidth / snowflakes.length;
        snowflakes.forEach((flake, index) => {
            flake.startX = spacing * index + spacing / 2; // evenly spaced
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
        toggleBtn.addEventListener("click", () => {
            snowEnabled = !snowEnabled;
            localStorage.setItem("snowEnabled", snowEnabled.toString());
            snowEnabled ? startSnow() : stopSnow();
        });
    });
    snowflakes.forEach((flake) => {
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
                `translate(${x}px, ${y}px) rotate(${y * 6}deg)`;
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
    window.addEventListener("resize", () => {
        containerWidth = snowContainer.clientWidth;
        updateSnowflakePositions();
    });
    const chatToggle = document.getElementById('chatToggle');
    const chatDropdown = document.getElementById('chatDropdown');
    const downloadToggle = document.getElementById('downloadToggle');
    const downloadDropdown = document.getElementById('downloadDropdown');
    const helpToggle = document.getElementById('helpToggle');
    const helpDropdown = document.getElementById('helpDropdown');
    chatToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        chatDropdown.style.display = chatDropdown.style.display === 'flex' ? 'none' : 'flex';
        downloadDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
    });
    downloadToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadDropdown.style.display = downloadDropdown.style.display === 'flex' ? 'none' : 'flex';
        chatDropdown.style.display = 'none';
        helpDropdown.style.display = 'none';
    });
    helpToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        helpDropdown.style.display = helpDropdown.style.display === 'flex' ? 'none' : 'flex';
        downloadDropdown.style.display = 'none';
        chatDropdown.style.display = 'none';
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
    });
});