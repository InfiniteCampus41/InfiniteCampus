const tableBody = document.querySelector("#url-table tbody");
async function fetchLogs() {
    try {
        const response = await fetch("https://included-touched-joey.ngrok-free.app/logs", {
            headers: {
                "ngrok-skip-browser-warning": "true",
            }
        });
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No Logs Found.</td></tr>';
            return;
        }
        const logsArray = Object.entries(data).map(([url, info]) => {
            let count, lastVisit;
            if (typeof info === "number") {
                count = info;
                lastVisit = "Unknown";
            } else if (typeof info === "object") {
                count = info.count;
                lastVisit = info.lastVisit;
            }
            return { url, count, lastVisit };
        });
        logsArray.sort((a, b) => b.count - a.count);
        tableBody.innerHTML = "";
        logsArray.forEach((log, index) => {
            const tr = document.createElement("tr");
            let bgColor = "#fff";
            if (index === 0) bgColor = "gold";
            else if (index === 1) bgColor = "silver";
            else if (index === 2) bgColor = "peru";
            tr.style.background = bgColor;
            tr.style.color = 'black';
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${log.url}</td>
                <td>${log.count}</td>
                <td>${log.lastVisit}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4">Error Fetching Logs: ${err.message}</td></tr>`;
    }
}
setInterval(fetchLogs, 5000);
fetchLogs();