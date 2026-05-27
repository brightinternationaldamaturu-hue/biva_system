import {
  getWallet
}
from "../services/wallet.service.js";

import {
  showSuccess,
  showError
}
from "../ui/modal.js";

import {
  auth,
  db
}
from "../firebase/config.js";

import {
  getDoc,
  doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  buyAirtimeService
}
from "../services/airtime.service.js";



import {

  saveTransaction

}

from "../services/transaction.service.js";



import {
  showLoader,
  hideLoader
}
from "../ui/loader.js";

import {
  renderBottomNav
}
from "../components/bottomNav.js";

import {
  verifyTransactionPin
}
from "../ui/pinModal.js";


// ===============================
// PROCESS LOCK
// ===============================

let airtimeProcessing = false;


// ===============================
// RENDER NAVIGATION
// ===============================

document.getElementById(
  "bottomNav"
).innerHTML =
renderBottomNav("home");


// ===============================
// NETWORK SELECTOR
// ===============================

const networkCards =
document.querySelectorAll(
  ".network-card"
);



// ===============================
// QUICK AMOUNT BUTTONS
// ===============================

const quickAmounts =
document.querySelectorAll(
  ".quick-amount"
);

const amountInput =
document.getElementById(
  "airtimeAmount"
);

const networkInput =
document.getElementById(
  "airtimeNetwork"
);


// ===============================
// INDICATOR ELEMENTS
// ===============================

const selectedNetworkText =
document.getElementById(
  "selectedNetworkText"
);

const selectedAmountText =
document.getElementById(
  "selectedAmountText"
);


// ===============================
// UPDATE NETWORK INDICATOR
// ===============================

function updateNetworkIndicator(){

  const value =
  networkInput.value;

  if(!value){

    selectedNetworkText.innerText =
    "No Network";

    return;
  }

  selectedNetworkText.innerText =
  value;

}


// ===============================
// UPDATE AMOUNT INDICATOR
// ===============================

function updateAmountIndicator(){

  const amount =
  amountInput.value || 0;

  selectedAmountText.innerText =
  "₦" + amount;

}


// ===============================
// QUICK AMOUNT CLICK
// ===============================

quickAmounts.forEach((btn)=>{

  btn.addEventListener(

    "click",

    ()=>{

      quickAmounts.forEach((b)=>{

        b.classList.remove(
          "active"
        );

      });

      btn.classList.add(
        "active"
      );

      const amount =
      btn.dataset.amount;

      amountInput.value =
      amount;

      updateAmountIndicator();

    }

  );

});


// ===============================
// MANUAL INPUT
// ===============================

amountInput.addEventListener(

  "input",

  ()=>{

    quickAmounts.forEach((b)=>{

      b.classList.remove(
        "active"
      );

    });

    updateAmountIndicator();

  }

);



networkCards.forEach((card)=>{

  card.addEventListener(

    "click",

    ()=>{

      // REMOVE ACTIVE
      networkCards.forEach((c)=>{

        c.classList.remove(
          "active"
        );

      });

      // ADD ACTIVE
      card.classList.add(
        "active"
      );

      // SAVE VALUE
      const selectedNetwork =
      card.dataset.network;

      document.getElementById(
        "airtimeNetwork"
      ).value = selectedNetwork;

      // UPDATE UI
      selectedNetworkText.innerText =
      selectedNetwork;

    }

  );

});


// ===============================
// BUTTON
// ===============================

const buyBtn =
document.getElementById(
  "buyAirtimeBtn"
);


// ===============================
// BUY AIRTIME
// ===============================

buyBtn.addEventListener(

  "click",

  async()=>{

    if(airtimeProcessing){

      return;

    }

    try{

      const phone =
      document.getElementById(
        "airtimePhone"
      ).value.trim();

      const network =
      document.getElementById(
        "airtimeNetwork"
      ).value;

      const amount =
      Number(

        document.getElementById(
          "airtimeAmount"
        ).value

      );

      // VALIDATION

      if(

        !phone ||
        !network ||
        !amount

      ){

        throw new Error(
          "Fill all fields"
        );

      }

      // LOCK BUTTON

      airtimeProcessing = true;

      buyBtn.disabled = true;

      buyBtn.innerText =
      "Processing...";

      // CHECK BALANCE

      const balance =
      await getWallet(

        auth.currentUser.uid

      );

// ===============================
// MINIMUM AMOUNT VALIDATION
// ===============================

if(amount < 50){

  throw new Error(
    "Enter a valid amount from ₦50"
  );

}


// ===============================
// CHECK BALANCE
// ===============================

if(balance < amount){

  throw new Error(
    "Insufficient wallet balance"
  );

}

      // GET USER DATA

      const userDoc =

      await getDoc(

        doc(
          db,
          "users",
          auth.currentUser.uid
        )

      );

      const userData =
      userDoc.data();

      // CHECK PIN

      if(

        !userData.transactionPin

      ){

        throw new Error(
          "Please setup transaction PIN first"
        );

      }

// ===============================
// CHECK PIN EXISTS
// ===============================

if(

  !userData.transactionPin

){

  throw new Error(
    "Please setup transaction PIN first"
  );

}


// ===============================
// VERIFY TRANSACTION PIN
// ===============================

await verifyTransactionPin(

  userData.transactionPin,

  {

    title: "Airtime Purchase",

    amount,

    network,

    phone

  }

);

      // SHOW LOADER

      showLoader(
        "Processing Airtime..."
      );

      // BUY AIRTIME

      await buyAirtimeService({

        phone,
        network,
        amount

      });


      // SUCCESS

      showSuccess(
        "Airtime Purchase Successful"
      );

      // CLEAR FORM

      document.getElementById(
        "airtimePhone"
      ).value = "";

      document.getElementById(
        "airtimeAmount"
      ).value = "";

      document.getElementById(
        "airtimeNetwork"
      ).value = "";

      networkCards.forEach((c)=>{

        c.classList.remove(
          "active"
        );

      });

    }

    catch(error){

      console.error(
        "AIRTIME ERROR:",
        error
      );

      showError(

        error.message ||

        "Transaction Failed"

      );

    }

    finally{

      airtimeProcessing = false;

      buyBtn.disabled = false;

      buyBtn.innerText =
      "Buy Airtime";

      hideLoader();

    }

});




