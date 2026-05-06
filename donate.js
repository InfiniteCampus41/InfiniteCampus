import { auth, onAuthStateChanged } from "./imports.js";
const _errorLog = [];
const _origConsoleError = console.error.bind(console);
console.error = (...args) => {
    _errorLog.push({ ts: new Date().toISOString(), args });
    _origConsoleError(...args);
};
window.__errorLog = _errorLog;
window.addEventListener("unhandledrejection", (event) => {
    console.error("[UnhandledRejection]", event.reason);
});
const backend = `${a}`;
const perksParams = new URLSearchParams(window.location.search);
const showPerks = perksParams.get("perks");
const amountInput = document.getElementById("amount-input");
const payBtn = document.getElementById("pay-btn");
const paymentMethodSelect = document.getElementById("payment-method");
let currentUser = null;
let currentUserToken = null;
let authReady = false;
let applePayInstance = null;
let googlePayInstance = null;
let lastAmount = null;
const GOAL = 201.16;
const progressBar = document.getElementById("donation-progress-bar");
const progressText = document.getElementById("donation-progress-text");
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        sessionStorage.setItem("donUID", user.uid);
        currentUserToken = await user.getIdToken();
    }
});
const authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authReady = true;
        resolve(user);
    });
});
async function getAuthToken() {
    await authReadyPromise;
    if (currentUser) {
        return await currentUser.getIdToken();
    }
    return null;
}
async function fetchAPI(endpoint, body) {
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(`${backend}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json?.error || "Request failed");
    }
    return json;
}
function pathToArray(path) {
    return path.split("/").filter(Boolean);
}
async function dbGet(path) {
    const res = await fetchAPI("read", { path: pathToArray(path) });
    return res.data;
}
updateProgress(await dbGet("/donations/amount"));
function getAmount() {
    let value = parseFloat(amountInput.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 1000) value = 1000;
    amountInput.value = value;
    payBtn.textContent = `Pay $${value.toFixed(2)}`;
    return value;
}
function createPaymentRequest() {
    const amount = getAmount();
    return payments.paymentRequest({
        countryCode: 'US',
        currencyCode: 'USD',
        total: {
            amount: amount.toFixed(2),
            label: 'Donation',
        },
        lineItems: [
            { amount: amount.toFixed(2), label: 'Donation' }
        ],
        requestBillingContact: true
    });
}
let walletUpdateTimeout;
amountInput.addEventListener("input", () => {
    getAmount();
    clearTimeout(walletUpdateTimeout);
    walletUpdateTimeout = setTimeout(() => refreshWallets(), 300);
});
async function refreshWallets() {
    const amount = getAmount();
    if (amount === lastAmount) return;
    lastAmount = amount;
    const paymentRequest = createPaymentRequest();
    try {
        if (applePayInstance) {
            try { await applePayInstance.destroy(); } catch (_) {}
        }
        applePayInstance = await payments.applePay(paymentRequest);
        let canPay = false;
        try {
            canPay = await applePayInstance.canMakePayment();
        } catch (canPayErr) {
            const msg = `Apple Pay canMakePayment() threw: ${canPayErr?.message || canPayErr}`;
            console.error("[ApplePay]", msg, canPayErr);
            showError(msg);
        }
        if (canPay) {
            await applePayInstance.attach("#apple-pay-container");
            const appleContainer = document.getElementById("apple-pay-container");
            const newAppleContainer = appleContainer.cloneNode(true);
            appleContainer.parentNode.replaceChild(newAppleContainer, appleContainer);
            const capturedInstance = applePayInstance;
            newAppleContainer.addEventListener("click", async () => {
                try {
                    const currentAmount = getAmount();
                    const tokenResult = await capturedInstance.tokenize();
                    if (tokenResult.status === "OK") {
                        await sendPayment(tokenResult.token, currentAmount, "Apple Pay");
                    } else {
                        const errDetail = tokenResult.errors?.map(e => e.message).join(", ") || "Unknown error";
                        const msg = `Apple Pay tokenization failed: ${errDetail}`;
                        console.error("[ApplePay]", msg, tokenResult);
                        showError(msg);
                    }
                } catch (tokenErr) {
                    const msg = `Apple Pay tokenize() threw: ${tokenErr?.message || tokenErr}`;
                    console.error("[ApplePay]", msg, tokenErr);
                    showError(msg);
                }
            });
        } else if (canPay === false) {
            const msg = "Apple Pay is not available on this device or browser.";
            console.error("[ApplePay]", msg);
            showError(msg);
        }
    } catch (e) {
        const msg = `Apple Pay init failed: ${e?.message || e}`;
        console.error("[ApplePay]", msg, e);
        showError(msg);
    }
    try {
        if (googlePayInstance) await googlePayInstance.destroy();
        googlePayInstance = await payments.googlePay(paymentRequest);
        if (googlePayInstance) {
            await googlePayInstance.attach("#google-pay-container");
            payBtn.onclick = async () => {
                try {
                    const currentAmount = getAmount();
                    const tokenResult = await googlePayInstance.tokenize();
                    if (tokenResult.status === "OK") {
                        await sendPayment(tokenResult.token, currentAmount, "Google Pay");
                    } else {
                        showError("Google Pay Failed");
                    }
                } catch (err) {
                    console.error(err);
                    showError("Google Pay Error");
                }
            };
        }
    } catch (e) {
        console.warn("Google Pay Not Available", e);
    }
}
async function sendPayment(token, amount, methodName) {
    try {
        const response = await fetch(`${backend}/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentUserToken}`
            },
            body: JSON.stringify({
                token,
                amount: Math.round(amount * 100)
            })
        });
        const data = await response.json();
        showSuccess(`${methodName} Payment Of $${amount} Successful!`);
        console.log(data);
    } catch (err) {
        console.error(err);
        showError(`${methodName} Payment Failed`);
    }
}
function updatePaymentUI() {
    const method = paymentMethodSelect.value;
    document.getElementById("card-container").style.display = method === "card" ? "block" : "none";
    document.getElementById("apple-pay-container").style.display = method === "applePay" ? "block" : "none";
    document.getElementById("google-pay-container").style.display = method === "googlePay" ? "block" : "none";
    payBtn.style.display = method === "card" ? "inline-block" : "none";
}
paymentMethodSelect.addEventListener("change", updatePaymentUI);
updatePaymentUI();
const payments = Square.payments(
  "sq0idp-ZwyFevqeeIAhxJX3XWBVQQ",
  "L96ZX33510ER5"
);
async function initPayments() {
    const card = await payments.card();
    await card.attach("#card-container");
    await refreshWallets();
    payBtn.addEventListener("click", async () => {
        if (!currentUser) return location.href = "InfiniteLogins.html";
        const result = await card.tokenize();
        if (result.status === "OK") {
            const amount = getAmount();
            await sendPayment(result.token, amount, "Credit Card");
        } else {
            console.error(result.errors);
            showError("Credit Card Payment Failed");
        }
    });
}
function updateProgress(amount) {
    if (!amount) amount = 0;
    let percent = (amount / GOAL) * 100;
    if (percent > 100) percent = 100;
    progressBar.style.width = percent + "%";
    progressText.textContent = `$${amount.toFixed(2)} / $${GOAL.toFixed(2)}`;
}
getAmount();
initPayments();
const perks1 = document.getElementById('perks1');
const perks2 = document.getElementById('perks2');
const donatecontainer = document.getElementById('pollContainer');
const perksContainer = document.getElementById('perksContainer');
if (showPerks) {
    perksContainer.style.display = "block";
    donatecontainer.style.display = "none";
}
perks1.addEventListener("click", () => {
    perksContainer.style.display = 'block';
    donatecontainer.style.display = 'none';
});
perks2.addEventListener("click", () => {
    perksContainer.style.display = 'none';
    donatecontainer.style.display = 'block';
});