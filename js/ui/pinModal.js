import {
  showError
}
from "./modal.js";


// ===============================
// VERIFY TRANSACTION PIN
// ===============================

export function verifyTransactionPin(

  savedPin,
  details = {}

){

  return new Promise((resolve,reject)=>{

    // REMOVE OLD MODAL

const oldModal =
document.querySelector(
  ".pin-overlay"
);

if(oldModal){

  oldModal.remove();

}

    // DEFAULTS

    const {

      title = "Transaction",
      amount = 0,
      network = "",
      phone = ""

    } = details;


    // CREATE MODAL

const modal =
document.createElement("div");

modal.className = "pin-overlay";

modal.innerHTML = `

<div class="pin-box">

  <div class="pin-transaction-icon">
    🔒
  </div>

  <h2>
    Enter Transaction PIN
  </h2>

  <p class="pin-subtitle">
    Confirm transaction securely
  </p>

  <div class="pin-transaction-card">

    <div class="pin-row">
      <span>Service</span>
      <strong>${title}</strong>
    </div>

    <div class="pin-row">
      <span>Network</span>
      <strong>${network || "N/A"}</strong>
    </div>

    <div class="pin-row">
      <span>Phone</span>
      <strong>${phone || "N/A"}</strong>
    </div>

    <div class="pin-row">
      <span>Amount</span>
      <strong>
        ₦${Number(amount).toLocaleString("en-NG")}
      </strong>
    </div>

  </div>

  <input
    type="password"
    id="pinInput"
    maxlength="4"
    inputmode="numeric"
    autocomplete="off"
    placeholder="****"
    autofocus
  />

  <div class="pin-actions">

    <button id="cancelPinBtn">
      Cancel
    </button>

    <button id="confirmPinBtn">
      Confirm
    </button>

  </div>

</div>

`;


document.documentElement.appendChild(
  modal
);


    // ===============================
    // AUTO OPEN KEYBOARD
    // ===============================

setTimeout(()=>{

  const input =
  document.getElementById(
    "pinInput"
  );

  if(input){

    input.focus();

    input.setSelectionRange(
      0,
      0
    );

    // MOBILE KEYBOARD BOOST
    input.dispatchEvent(
      new Event("touchstart")
    );

  }

},300);



    // BUTTONS

    const confirmBtn =
    document.getElementById(
      "confirmPinBtn"
    );

    const cancelBtn =
    document.getElementById(
      "cancelPinBtn"
    );


    // CONFIRM

    confirmBtn.onclick = ()=>{

      const enteredPin =

      document.getElementById(
        "pinInput"
      ).value.trim();

      if(

        enteredPin === savedPin

      ){

        modal.remove();

        resolve(true);

      }

      else{

        showError(
          "Incorrect transaction PIN"
        );

      }

    };


    // CANCEL

    cancelBtn.onclick = ()=>{

      modal.remove();

      reject(

        new Error(
          "Transaction cancelled"
        )

      );

    };

  });

}