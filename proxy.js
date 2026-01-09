document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("sj-form");
    const addressInput = document.getElementById("sj-address");
    const errorEl = document.getElementById("sj-error");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let input = addressInput.value.trim();
        if (!input) {
            errorEl.textContent = "Please Enter A URL Or Search Term.";
            return;
        }
        let logUrl;
        try {
            const parsedUrl = new URL(input.startsWith("http") ? input : `https://${input}`);
            logUrl = `https://${parsedUrl.hostname.toLowerCase()}`;
        } catch {
            logUrl = input.toLowerCase();
        }
        const now = new Date().toISOString();
        const payload = {
            url: logUrl,
            timestamp: now
        };
        try {
            const response = await fetch("/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            addressInput.value = "";
            errorEl.textContent = "";
        } catch (err) {
            console.error(err);
        }
    });
});