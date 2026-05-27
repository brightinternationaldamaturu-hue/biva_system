import { auth, db } from "../firebase/config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generateVirtualAccount, copyAccountNumber } from "../services/wallet.service.js";


import {
  showLoader,
  hideLoader
}
from "../ui/loader.js";

import {
  showSuccess,
  showError
}
from "../ui/modal.js";



import { renderBottomNav }
from "../components/bottomNav.js";













console.log("WALLET PAGE LOADED");

export function loadWallet(app) {

  app.innerHTML = `
    <div class="wallet-page">

      <!-- HEADER -->
      <div class="wallet-header">
        <h2>Fund Wallet</h2>
        <p>Top up your BIVA wallet instantly</p>
      </div>

      <!-- ACCOUNT BOX -->
      <div id="accountBox" class="wallet-card">
        Loading account...
      </div>

    </div>
  `;

  // LOAD BOTTOM NAV
  document.body.insertAdjacentHTML(

    "beforeend",

    renderBottomNav("wallet")

  );

  auth.onAuthStateChanged((user) => {

    if (!user) return;

    loadAccount(user.uid);

  });

}






// ==========================
// LOAD ACCOUNT
// ==========================
async function loadAccount(uid) {

  try {

    const ref = doc(db, "users", uid);

    const snap = await getDoc(ref);

    hideLoader();

    const container =
      document.getElementById("accountBox");

    // USER NOT FOUND
    if (!snap.exists()) {

      container.innerHTML = `

        <div class="wallet-card">

          <div class="wallet-empty">

            <div class="empty-icon">
              ⚠️
            </div>

            <h3>User not found</h3>

          </div>

        </div>

      `;

      return;

    }

    const data = snap.data();

    // NO ACCOUNT YET
    if (!data.virtualAccount) {

      container.innerHTML = `

        <div class="wallet-card generate-state">

          <div class="wallet-logo">
            BIVA
          </div>

          <h3 class="generate-title">
            Generate Virtual Account
          </h3>

          <p class="generate-text">

            Create your personal bank account
            to fund your wallet instantly.

          </p>

          <button
            id="genBtn"
            class="generate-btn">

            ✨ Generate Account

          </button>

        </div>

      `;

document.getElementById("genBtn")
.onclick = async () => {

  try {

    showLoader(
      "Generating account..."
    );

    await generateVirtualAccount(uid);

    hideLoader();

    showSuccess(
      "Virtual account created successfully"
    );

    await loadAccount(uid);

  }

  catch(error) {

    hideLoader();

    console.error(error);

    showError(

      error.message ||

      "Failed to generate account"

    );

  }

};


              return;

    }

    // ACCOUNT EXISTS
    const acc = data.virtualAccount;

    container.innerHTML = `

      <div class="wallet-card atm-card">

        <!-- TOP -->

        <div class="wallet-top">

          <div>

            <p class="wallet-label">
              Bank Name
            </p>

            <h3 class="bank-title">
              ${acc.bankName}
            </h3>

          </div>

<div class="wallet-brand">

  <img
    src="../assets/logo.png"
    alt="BIVA Logo"
    class="wallet-logo-img"
  >

</div>

        </div>

        <!-- CHIP -->

        <div class="chip"></div>

        <!-- ACCOUNT NUMBER -->

        <div class="wallet-number">

          ${acc.accountNumber}

        </div>

        <!-- ACCOUNT HOLDER -->

        <div class="wallet-bottom">

          <div>

            <p class="wallet-label">
              Account Name
            </p>

            <h4 class="account-holder">

              ${acc.accountName}

            </h4>

          </div>

          <button
            id="copyBtn"
            class="copy-btn">

            Copy

          </button>

        </div>

      </div>

    `;

    document.getElementById("copyBtn")
    .onclick = () => {

      copyAccountNumber(
        acc.accountNumber
      );

    };

  }

catch (err) {

  hideLoader();

  console.error(err);

  showError(

    err.message ||

    "Something went wrong"

  );

}

}