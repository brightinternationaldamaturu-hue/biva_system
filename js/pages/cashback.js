import {
  auth,
  db
} from "../firebase/config.js";

import {
  collection,
  onSnapshot,
  doc,
  query,
  where,
  getDocs,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { showLoader, hideLoader } from "../ui/loader.js";
import { renderBottomNav } from "../components/bottomNav.js";
import { showSuccess, showError } from "../ui/modal.js";
import { verifyTransactionPin } from "../ui/pinModal.js";

export function loadCashback(app) {
  app.innerHTML = `
    <h1>Cashback Page</h1>
  `;
}



showLoader("Loading...");






// =========================
// NAV
// =========================

document.getElementById("bottomNav").innerHTML =
  renderBottomNav("reward");


// =========================
// AUTH
// =========================

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = user.uid;

  listenToUserCashback(userId);
  loadTransactions(userId);
});


// ===============================
// LIVE CASHBACK
// ===============================

function listenToUserCashback(userId) {

  const userRef = doc(db, "users", userId);

  onSnapshot(userRef, (snap) => {

    if (!snap.exists()) return;

    const data = snap.data();

    const el = document.getElementById("availableCashback");

    if (el) {
      el.innerText =
        "₦" + Number(data.cashbackBalance || 0).toLocaleString();
    }

  });

}


// ===============================
// TRANSACTIONS
// ===============================

async function loadTransactions(userId) {

  showLoader("Loading...");

  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId)
  );

  const snap = await getDocs(q);

  let earned = 0;
  let withdrawn = 0;

  const container = document.getElementById("cashbackHistory");
  container.innerHTML = "";

  snap.forEach((docItem) => {

    const d = docItem.data();

    if (d.type === "cashback") {
      earned += Number(d.amount || 0);

      container.innerHTML += `
        <div class="history-item">
          <span>Cashback Earned</span>
          <span style="color:#00d492">
            +₦${Number(d.amount).toLocaleString()}
          </span>
        </div>
      `;
    }

    if (d.type === "cashback_withdrawal") {
      withdrawn += Number(d.amount || 0);

      container.innerHTML += `
        <div class="history-item">
          <span>Withdrawal</span>
          <span style="color:#ffb020">
            -₦${Number(d.amount).toLocaleString()}
          </span>
        </div>
      `;
    }

  });

  document.getElementById("totalEarned").innerText =
    "₦" + earned.toLocaleString();

  document.getElementById("totalWithdrawn").innerText =
    "₦" + withdrawn.toLocaleString();

  hideLoader();
}


// ===============================
// WITHDRAW CASHBACK (FIXED)
// ===============================

async function withdrawCashback() {

  const user = auth.currentUser;

  if (!user) {
    showError("Please login first");
    return;
  }

  try {

    showLoader("Verifying request...");

    // =========================
    // GET USER DATA (FOR PIN)
    // =========================
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    // =========================
    // CHECK PIN EXISTS
    // =========================
    if (!userData.transactionPin) {
      throw new Error("Please set up your transaction PIN first");
    }

    // =========================
    // VERIFY PIN (BLOCKS FLOW)
    // =========================
    await verifyTransactionPin(userData.transactionPin, {
      title: "Cashback Withdrawal",
      amount: "Cashback Withdrawal"
    });

    // =========================
    // CONTINUE WITH WITHDRAWAL
    // =========================
    showLoader("Processing withdrawal...");

    const res = await fetch("https://biva-backend-ezvu.onrender.com/withdrawCashback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
      userId: user.uid,
      transactionPin: userData.transactionPin
    })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Withdrawal failed");
    }

    const amount = parseFloat(data.amount);

    if (isNaN(amount)) {
      showSuccess("Withdrawal successful");
    } else {
      showSuccess(`₦${amount.toLocaleString()} withdrawn successfully`);
    }

  } catch (err) {
    console.error(err);
    showError(err.message || "Something went wrong");
  } finally {
    hideLoader();
  }
}



// =========================
// BUTTON BIND (SAFE)
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("withdrawBtn");

  if (btn) {
    btn.addEventListener("click", withdrawCashback);
  }
});