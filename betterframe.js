const headerHTML = `
    <header id="site-header">
        <div id="weatherContainer">
            <div id="global-text">
                <pre id="weather">
                </pre>
                <button id="toggle">
                    °C
                </button>
            </div>
        </div>
        <div id="hbtns">
            <a href="index.html">
                <img src="/res/logo.svg">
            </a>
            <a href="InfiniteAbouts.html">
                About
            </a>
            <a href="InfiniteApps.html">
                Apps
            </a>
            <div id="chatToggle" class="dropdown-toggle">
                Chat
            </div>
            <div class="dropdown" id="chatDropdown">
                <button onclick="location.href='InfiniteTalkers.html'">
                    Padlet
                </button>
                <button onclick="location.href='InfiniteChatters.html'">
                    Website Chat
                </button>
                <button onclick="location.href='InfiniteDiscords.html'">
                    Live Discord Chat
                </button>
            </div>
            <div id="helpToggle" class="dropdown-toggle">
                Help/Support
            </div>
            <div class="dropdown" id="helpDropdown">
                <button onclick="location.href='InfiniteQuestions.html'">
                    FAQ
                </button>
                <button onclick="location.href='InfiniteIssues.html'">
                    Report A Bug
                </button>
                <button onclick="location.href='InfiniteErrors.html'">
                    Check Error Codes
                </button>
            </div>
            <a href="InfiniteGamers.html">
                Games
            </a>
            <a href="InfiniteCheaters.html">
                Cheats
            </a>
            <a href="InfiniteUpdaters.html">
                Updates
            </a>
            <div id="downloadToggle" class="dropdown-toggle">
                Download Games
            </div>
            <div class="dropdown" id="downloadDropdown">
                <button onclick="location.href='InfiniteOpeners.html'">
                    Download This Website
                </button>
                <button onclick="location.href='InfiniteDownloaders.html'">
                    Download Games
                </button>
            </div>
            <a class="contactme" href="InfiniteContacts.html">
                Contact Me
            </a>
        </header>
        <footer id="site-footer">
            <span>
                Totally Made By Noah White And Not A Different Person.
            </span>
            <span>
                Pissing Off Your Teachers Since 2024
            </span>
        </footer>
`;
document.addEventListener("DOMContentLoaded", () => {
    const headerWrapper = document.createElement("div");
    headerWrapper.innerHTML = headerHTML;
    document.body.insertBefore(headerWrapper, document.body.firstChild);
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
