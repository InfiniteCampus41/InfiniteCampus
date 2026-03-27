import { auth, onAuthStateChanged } from "./imports.js";
const amountInput = document.getElementById("amount-input");
const payBtn = document.getElementById("pay-btn");
const paymentMethodSelect = document.getElementById("payment-method");
let currentUser = null;
let currentUserToken = null;
let applePayInstance = null;
let googlePayInstance = null;
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        sessionStorage.setItem("donUID", user.uid);
        currentUserToken = await user.getIdToken();
    }
});
function getAmount() {
    let value = parseFloat(amountInput.value);
    if (isNaN(value)) value = 1;
    if (value < 1) value = 1;
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
            {
                amount: amount.toFixed(2),
                label: 'Donation',
            }
        ],
        requestBillingContact: true
    });
}
let walletUpdateTimeout;
amountInput.addEventListener("input", () => {
    getAmount();
    clearTimeout(walletUpdateTimeout);
    walletUpdateTimeout = setTimeout(() => {
        refreshWallets();
    }, 300);
});
async function refreshWallets() {
    try {
        const paymentRequest = createPaymentRequest();
        if (applePayInstance) {
            await applePayInstance.destroy();
        }
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
        const paymentRequest = createPaymentRequest();
        if (googlePayInstance) {
            await googlePayInstance.destroy();
        }
        googlePayInstance = await payments.googlePay(paymentRequest);
        if (googlePayInstance && typeof googlePayInstance.canMakePayment === "function" && await googlePayInstance.canMakePayment()) {
            const googleBtn = await googlePayInstance.attach("#google-pay-container");
            googleBtn.onclick = async () => {
                const amount = getAmount();
                const tokenResult = await googlePayInstance.tokenize();
                if (tokenResult.status === "OK") {
                    await sendPayment(tokenResult.token, amount, "Google Pay");
                } else {
                    showError("Google Pay Failed");
                }
            };
        }
    } catch (e) {
        console.warn("Google Pay Not Available", e);
    }
}
async function sendPayment(token, amount, methodName) {
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
}
getAmount();
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
    try {
        const paymentRequest = createPaymentRequest();
        const applePay = await payments.applePay(paymentRequest);
        if (applePay && await applePay.canMakePayment()) {
            const appleBtn = await applePay.attach("#apple-pay-container");
            appleBtn.addEventListener("click", async () => {
                try {
                    const amount = getAmount();
                    const tokenResult = await applePay.tokenize();
                    if (tokenResult.status === "OK") {
                        const response = await fetch("https://api.infinitecampus.xyz/pay", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${currentUserToken}`
                            },
                            body: JSON.stringify({
                                token: tokenResult.token,
                                amount: Math.round(amount * 100)
                            })
                        });
                        const data = await response.json();
                        showSuccess(`Apple Pay Payment Of $${amount} Successful!`);
                        console.log(data);
                    } else {
                        console.error(tokenResult.errors);
                        showError("Apple Pay Failed");
                    }
                } catch (err) {
                    console.error(err);
                    showError("Apple Pay Error");
                }
            });
        }
    } catch (e) {
        console.warn("Apple Pay Not Available", e);
    }
    payBtn.addEventListener("click", async () => {
        if (!currentUser) return location.href = "InfiniteLogins.html";
        const result = await card.tokenize();
        if (result.status === "OK") {
            try {
                const amount = getAmount();
                const cents = Math.round(amount * 100);
                const response = await fetch("https://api.infinitecampus.xyz/pay", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentUserToken}`
                    },
                    body: JSON.stringify({ token: result.token, amount: cents })
                });
                const data = await response.json();
                showSuccess(`Credit Card Payment Of $${amount} Successful!`);
                console.log(data);
            } catch(err) {
                console.error(err);
                showError("Credit Card Payment Failed");
            }
        } else {
            console.error(result.errors);
            showError("You Must Be Logged In To Donate");
        }
    });
}
initPayments();