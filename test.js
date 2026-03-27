import { auth, onAuthStateChanged } from "./imports.js";
const amountInput = document.getElementById("amount-input");
const payBtn = document.getElementById("pay-btn");
const paymentMethodSelect = document.getElementById("payment-method");
let currentUser = null;
let currentUserToken = null;
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
amountInput.addEventListener("input", getAmount);
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
    try {
        const applePay = await payments.applePay();
        if (applePay) {
            const appleBtn = await applePay.attach("#apple-pay-container");
            appleBtn.addEventListener("click", async () => {
                try {
                    const amount = getAmount();
                    const tokenResult = await applePay.tokenize({ amount: Math.round(amount*100), currencyCode: 'USD' });
                    if (tokenResult.status === "OK") {
                        const response = await fetch("https://api.infinitecampus.xyz/pay", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${currentUserToken}`
                            },
                            body: JSON.stringify({ token: tokenResult.token, amount: Math.round(amount*100) })
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
    try {
        const googlePay = await payments.googlePay();
        if (googlePay) {
            const googleBtn = await googlePay.attach("#google-pay-container");
            googleBtn.addEventListener("click", async () => {
                try {
                    const amount = getAmount();
                    const tokenResult = await googlePay.tokenize({ amount: Math.round(amount*100), currencyCode: 'USD' });
                    if (tokenResult.status === "OK") {
                        const response = await fetch("https://api.infinitecampus.xyz/pay", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${currentUserToken}`
                            },
                            body: JSON.stringify({ token: tokenResult.token, amount: Math.round(amount*100) })
                        });
                        const data = await response.json();
                        showSuccess(`Google Pay Payment Of $${amount} Successful!`);
                        console.log(data);
                    } else {
                        console.error(tokenResult.errors);
                        showError("Google Pay Failed");
                    }
                } catch (err) {
                    console.error(err);
                    showError("Google Pay Error");
                }
            });
        }
    } catch (e) {
        console.warn("Google Pay Not Available", e);
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