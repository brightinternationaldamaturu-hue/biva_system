import { renderBottomNav } from "../components/bottomNav.js";

import { auth, db } from "../firebase/config.js";
console.log("PROJECT:", db.app.options.projectId);

import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { listenToTransactions } from "../services/transaction.service.js";

import { showLoader, hideLoader } from "../ui/loader.js";

import { showTransactionDetails } from "../ui/transactionModal.js";




// ===============================
// SHOW LOADER IMMEDIATELY
// ===============================
showLoader(
  "Loading..."
);



      // =========================
      // BALANCE Toggle
      // =========================

    let balanceHidden = false;
    let realBalance = 0;




// =========================
// OPTIONAL PAGE EXPORT
// =========================
export function loadHome(app) {
  app.innerHTML = `
    <div class="home-header">

      <div class="home-user">

        <div class="home-avatar" id="homeAvatar">
          B
        </div>

        <div class="home-user-text">

          <h2 id="welcomeText">
            Welcome
          </h2>

          <p id="greetingText">
            Good Evening 👋
          </p>

        </div>

      </div>

    </div>
  `;
}


// =========================
// BOTTOM NAV
// =========================
document.getElementById("bottomNav").innerHTML =
  renderBottomNav("home");





// =========================
// AUTH CHECK
// =========================
auth.onAuthStateChanged(async (user) => {

  if (!user) {
    hideLoader();
    window.location.href = "login.html";
    return;
  }

  try {

    // =========================
    // REALTIME USER DATA
    // =========================
    onSnapshot(doc(db, "users", user.uid), (snap) => {

      if (!snap.exists()) return;

      const data = snap.data();

      const firstName =
        (data.fullName || "User").split(" ")[0];

realBalance = Number(data.wallet || 0);

const el = document.getElementById("walletBalance");

if (!el) return;

if (balanceHidden) {
  el.textContent = "₦••••••";
} else {
  animateBalance("walletBalance", realBalance);
}

      // =========================
      // HEADER UI
      // =========================

      const welcomeEl = document.getElementById("welcomeText");
      if (welcomeEl) {
        welcomeEl.innerText = `Welcome ${firstName}`;
      }

      const avatarEl = document.getElementById("homeAvatar");
      if (avatarEl) {
        avatarEl.innerText = firstName.charAt(0).toUpperCase();
      }

      const hour = new Date().getHours();

      let greeting = "Good Evening 👋";
      if (hour < 12) greeting = "Good Morning ☀️";
      else if (hour < 18) greeting = "Good Afternoon 🌤️";

      const greetEl = document.getElementById("greetingText");
      if (greetEl) {
        greetEl.innerText = greeting;
      }

      // =========================
      // BALANCE ANIMATION
      // =========================
      animateBalance(
        "walletBalance",
        Number(data.wallet || 0)
      );

    });






    // =========================
    // TRANSACTIONS
    // =========================
    loadLatestTransaction(user.uid);

  } catch (error) {
    console.log(error);
  } finally {
    hideLoader();
  }

});


// =========================
// LATEST TRANSACTION
// =========================
function loadLatestTransaction(uid) {

  const list = document.getElementById("transactionList");
  if (!list) return;

  listenToTransactions(uid, (transactions) => {

    list.innerHTML = "";

    if (!transactions.length) {
      list.innerHTML = `
        <p style="text-align:center;opacity:.6;margin-top:20px;">
          No transactions yet
        </p>
      `;
      return;
    }

    const latest = transactions.slice(0, 1);

    latest.forEach((tx) => {

      const iconMap = {
        data: "🌐",
        airtime: "📱",
        electricity: "⚡",
        voucher: "🎟️",
        cashback: "💸",
        cashback_withdrawal: "💰"
      };

      const txKey = (tx.type || tx.category || "").toLowerCase();

      const icon = iconMap[txKey] || "💳";

      const card = document.createElement("div");
      card.className = "transaction-card";

      card.innerHTML = `
        <div class="tx-left">

          <div class="tx-icon">
            ${icon}
          </div>

          <div class="tx-info">

  <h3>
  ${
tx.type === "wallet_funding" ||
tx.type === "funding" ||
tx.type === "deposit" ||
tx.type === "fund"
      ? "Wallet Funding"
      : tx.plan || tx.title || "Transaction"
  }
</h3>

            <p class="tx-date">
              ${
                tx.createdAt?.toDate
                  ? tx.createdAt.toDate().toLocaleString()
                  : "Now"
              }
            </p>

          </div>

        </div>

        <div class="tx-right">

          <div class="tx-amount ${
[
  "cashback",
  "credit",
  "cashback_withdrawal",
  "wallet_funding",
  "deposit",
  "funding",
  "fund"
]


.includes(tx.type)
              ? "credit"
              : "debit"
          }">

            ${
[
  "cashback",
  "credit",
  "cashback_withdrawal",
  "wallet_funding",
  "deposit",
  "funding",
  "fund"
]

.includes(tx.type)
                ? "+"
                : "-"
            }

            ₦${Number(tx.amount || 0).toLocaleString("en-NG")}

          </div>

          <div class="tx-status status-${tx.status}">
            ${tx.status || "pending"}
          </div>

        </div>
      `;

      card.addEventListener("click", () => {
        showTransactionDetails(tx);
      });

      list.appendChild(card);
    });

  });
}


// =========================
// BALANCE ANIMATION
// =========================
function animateBalance(id, amount) {

  const el = document.getElementById(id);
  if (!el) return;

  let start = 0;
  const duration = 400;
  const increment = amount / (duration / 16);

  const counter = setInterval(() => {

    start += increment;

    if (start >= amount) {
      start = amount;
      clearInterval(counter);
    }

    el.innerText =
      "₦" +
      Math.floor(start).toLocaleString("en-NG");

  }, 16);

}






document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("fundWalletBtn");

  if (btn) {
    btn.addEventListener("click", () => {
      window.location.href = "wallet.html";
    });
  }
});




document.addEventListener("DOMContentLoaded", () => {

  const balanceEl =
    document.getElementById("walletBalance");

  const toggleBtn =
    document.getElementById("balanceToggle");

  const eyeIcon =
    document.getElementById("eyeIcon");

  if (!balanceEl || !toggleBtn) return;

  toggleBtn.addEventListener("click", () => {

    balanceHidden = !balanceHidden;

    if (balanceHidden) {

      balanceEl.textContent = "₦••••••";

      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.77 21.77 0 0 1 5.06-6.94"/>
        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.91 21.91 0 0 1-2.16 3.19"/>
        <path d="M1 1l22 22"/>
      `;

    } else {

      animateBalance(
        "walletBalance",
        realBalance
      );

      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }

  });

});






function setupAdsSlider() {
  const adsTrack = document.getElementById("adsTrack");
  if (!adsTrack) return;

  const slides = adsTrack.querySelectorAll(".ad-card");
  if (!slides.length) return;

  let index = 0;

  clearInterval(window.adsInterval);

  window.adsInterval = setInterval(() => {
    index = (index + 1) % slides.length;

    const slideWidth = adsTrack.clientWidth;

    adsTrack.scrollTo({
      left: slideWidth * index,
      behavior: "smooth"
    });

  }, 4000);
}





document.addEventListener("DOMContentLoaded", () => {
  setupAdsSlider();
});











