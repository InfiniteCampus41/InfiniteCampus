import { auth, onAuthStateChanged, get, ref } from "./imports.js";
const backend = `${a}`;
const perksParams = new URLSearchParams(window.location.search);
const showPerks = perksParams.get("perks");
const amountInput = document.getElementById("amount-input");
const payBtn = document.getElementById("pay-btn");
const paymentMethodSelect = document.getElementById("payment-method");
let currentUser = null;
let currentUserToken = null;
let applePayInstance = null;
let googlePayInstance = null;
let lastAmount = null;
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        sessionStorage.setItem("donUID", user.uid);
        currentUserToken = await user.getIdToken();
    }
});
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
        if (applePayInstance) await applePayInstance.destroy();
        applePayInstance = await payments.applePay(paymentRequest);
        if (applePayInstance && await applePayInstance.canMakePayment()) {
            const appleBtn = await applePayInstance.attach("#apple-pay-container");
            appleBtn.onclick = async () => {
                const amount = getAmount();
                const tokenResult = await applePayInstance.tokenize();
                if (tokenResult.status === "OK") {
                    await sendPayment(tokenResult.token, amount, "Apple Pay");
                } else {
                    showError("Apple Pay Failed");
                }
            };
        }
    } catch (e) {
        console.warn("Apple Pay Not Available", e);
    }
    try {
        if (googlePayInstance) await googlePayInstance.destroy();
        const paymentRequest = createPaymentRequest();
        googlePayInstance = await payments.googlePay(paymentRequest);
        if (googlePayInstance) {
            await googlePayInstance.attach("#google-pay-container");
            payBtn.onclick = async () => {
                try {
                    const amount = getAmount();
                    const tokenResult = await googlePayInstance.tokenize();
                    if (tokenResult.status === "OK") {
                        await sendPayment(tokenResult.token, amount, "Google Pay");
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
        const response = await fetch("https://api.infinitecampus.xyz/pay", {
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
  "sandbox-sq0idb-GrqAAKKEPcGMC6OBhif-DQ",
  "LGD763WC0NDTT"
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