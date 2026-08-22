export const STATUS_META = {
    online: { label: "Online", icon: "ib ic ic-online", color: "" },
    idle: { label: "Idle", icon: "ib ic ic-idle", color: "" },
    dnd: { label: "Do Not Disturb", icon: "ib ic ic-dnd", color: "" },
    invisible: { label: "Invisible", icon: "ib ic ic-offline", color: "" },
    offline: { label: "Offline", icon: "ib ic ic-offline", color: "" }
};
export const SELECTABLE_STATUSES = ["online", "idle", "dnd", "invisible"];
export function normalizeStatus(status) {
    return STATUS_META[status] ? status : "offline";
}
export function displayStatusFor(status) {
    const s = normalizeStatus(status);
    return s === "invisible" ? "offline" : s;
}
export async function postStatus(backendUrl, getAuthToken, status) {
    if (!SELECTABLE_STATUSES.includes(status)) return false;
    try {
        const token = await getAuthToken();
        if (!token) return false;
        const res = await fetch(`${backendUrl}/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return res.ok;
    } catch {
        return false;
    }
}
export function createIdleWatcher({ getManualStatus, onAutoIdle, onAutoResume, timeoutMs = 5 * 60 * 1000 }) {
    let timer = null;
    let autoIdled = false;
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (getManualStatus() === "online") {
                autoIdled = true;
                onAutoIdle();
            }
        }, timeoutMs);
    }
    function onActivity() {
        if (autoIdled) {
            autoIdled = false;
            onAutoResume();
        }
        schedule();
    }
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(evt => document.addEventListener(evt, onActivity, { passive: true }));
    schedule();
    return {
        stop() {
            clearTimeout(timer);
            events.forEach(evt => document.removeEventListener(evt, onActivity));
        }
    };
}