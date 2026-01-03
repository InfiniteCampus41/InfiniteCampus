const urlList = document.getElementById("urlList");
const searchInput = document.getElementById("search");
async function fetchLogs() {
    try {
        const res = await fetch("https://included-touched-joey.ngrok-free.app/api/logs", {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        const logs = await res.json();
        displayLogs(logs);
    } catch(e) { 
        console.error("Failed To Fetch Logs", e); 
    }
}
function displayLogs(logs) {
    const filter = searchInput.value.toLowerCase();
    logs.sort((a,b) => b.count - a.count || a.url.localeCompare(b.url));
    urlList.innerHTML = logs
    .filter(log => log.url.toLowerCase().includes(filter))
    .map((log, idx) => {
        let className = "";
        if(idx===0) className="top1";
        else if(idx===1) className="top2";
        else if(idx===2) className="top3";
        const displayText = log.count > 1 ? `${log.url} (${log.count})` : log.url;
        const visitTimes = log.visits.map(t => new Date(t).toLocaleString()).join(", ");
        return `<li class="${className}">
            <div>${displayText}</div>
            <div class="visit-times">${visitTimes}</div>
        </li>`;
    }).join("");
}
searchInput.addEventListener("input", fetchLogs);
fetchLogs();
setInterval(fetchLogs, 10000);