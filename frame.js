const headerHTML = `
<style>
    .dropdown {
        position: absolute;
        top: 50px;
        right: 590px;
        display: none;
        flex-direction: column;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 1000;
        background: inherit;
    }
    .dropdown button {
        background: transparent;
        border: none;
        padding: 10px 15px;
        text-align: left;
        cursor: pointer;
        color: white;
        transition: background 0.3s;
    }
    .dropdown button:hover {
    background-color:transparent
    }
    .dropdown-toggle {
        cursor: pointer;
    }
</style>
<strong>
    <header id="site-header">
        <div class="test">
        </div>
        <div id="location">
        </div>
        <div style="margin-top:1.5vh;" id="weather-container">
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
            <img class="logo" src="/InfiniteCampus/res/logo.svg">
        </a>
        <a class="headerbtn" style="right:710; top:14" href="InfiniteAbouts.html">
            About
        </a>
        <a class="headerbtn" style="right:650; top:14" href="InfiniteApps.html">
            Apps
        </a>
        <div id="chatToggle" class="dropdown-toggle headerbtn" style="right:595; top:14; position:absolute;">
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
        <div id="helpToggle" class="dropdown-toggle headerbtn" style="right:470; top:14; position:absolute;">
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
        <div id="downloadToggle" class="dropdown-toggle headerbtn" style="right:120; top:14; position:absolute;">
            Download Games
        </div>
        <div style="right:50; top:50px;" class="dropdown" id="downloadDropdown">
            <button style="font-weight:bold;" onclick="location.href='InfiniteMiners.html'">
                How To Download Minecraft
            </button>
            <button style="font-weight:bold;" onclick="location.href='InfiniteOpeners.html'">
                Download This Website
            </button>
            <button style="font-weight:bold;" onclick="location.href='https://downloadgames-14894445.codehs.me/ngon.html'">
                Download Ngon
            </button>
            <button style="font-weight:bold;" onclick="location.href='https://downloadgames-14894445.codehs.me/OVO.html'">
                Download 0v0
            </button>
        </div>
        <a class="contactme" style="right:0; top:10; margin-right:10px" href="InfiniteContacts.html">
            Contact Me
        </a>
    </header>
</strong>
<footer id="site-footer" style="z-index:9; bottom:-4; text-align:left">
    <p>
        Totally Made By Noah White And Not A Different Person.
    </p>
</footer>
<footer id="text-only-footer" style="z-index:10; background-color:transparent; text-align:right; bottom:-4">
    <p>
        Pissing Off Your Teachers Since 2024
    </p>
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