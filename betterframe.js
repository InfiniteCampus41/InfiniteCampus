const headerHTML = `
    <header id="site-header">
        <div id="location">
        </div>
        <div id="weather-container">
            <div id="global-text">
                <pre id="weather">
                </pre>
            </div>
            <div id="global-text">
                <button class="cfbtn" id="toggle">
                    °C
                </button>
            </div>
        </div>
        <a href="index.html">
            <img class="logo" src="/res/logo.svg">
        </a>
        <a class="headerbtn" style="right:710; top:14" href="InfiniteAbouts.html">
            About
        </a>
        <a class="headerbtn" style="right:650; top:14" href="InfiniteApps.html">
            Apps
        </a>
        <div id="chatToggle" class="dropdown-toggle headerbtn" style="right:595; top:14;">
            Chat
        </div>
        <div class="dropdown" id="chatDropdown">
            <button style="font-weight:bold;" onclick="location.href='InfiniteTalkers.html'">
                Padlet
            </button>
            <button style="font-weight:bold;" onclick="location.href='InfiniteChatters.html'">
                Website Chat
            </button>
            <button style="font-weight:bold;" onclick="location.href='InfiniteDiscords.html'">
                Live Discord Chat
            </button>
        </div>
        <div id="helpToggle" class="dropdown-toggle headerbtn" style="right:470; top:14;">
            Help/Support
        </div>
        <div style="right:400;" class="dropdown" id="helpDropdown">
            <button style="font-weight:bold;" onclick="location.href='InfiniteQuestions.html'">
                FAQ
            </button>
            <button style="font-weight:bold;" onclick="location.href='InfiniteIssues.html'">
                Report A Bug
            </button>
            <button style="font-weight:bold;" onclick="location.href='InfiniteErrors.html'">
                Check Error Codes
            </button>
        </div>
        <a class="headerbtn" style="right:400; top:14" href="InfiniteGamers.html">
            Games
        </a>
        <a class="headerbtn" style="right:330; top:14" href="InfiniteCheaters.html">
            Cheats
        </a>
        <a class="headerbtn" style="right:250; top:14" href="InfiniteUpdaters.html">
            Updates
        </a>
        <div id="downloadToggle" class="dropdown-toggle headerbtn" style="right:120; top:14;">
            Download Games
        </div>
        <div style="right:50; top:50px;" class="dropdown" id="downloadDropdown">
            <button style="font-weight:bold;" onclick="location.href='InfiniteOpeners.html'">
                Download This Website
            </button>
            <button style="font-weight:bold;" onclick="location.href='InfiniteDownloaders.html'">
                Download Games
            </button>
        </div>
        <a class="contactme" style="right:0; top:10" href="InfiniteContacts.html">
            Contact Me
        </a>
    </header>
<footer id="site-footer" style="bottom:-4">
    <span style="margin-left:1%;">
        Totally Made By Noah White And Not A Different Person.
    </span>
    <span style="margin-right:1%;">
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
