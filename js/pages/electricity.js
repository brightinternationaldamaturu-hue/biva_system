import { auth }
from "../firebase/config.js";

import {
  renderBottomNav
}
from "../components/bottomNav.js";

import {

  verifyMeterService,
  buyElectricityService

}

from "../services/electricity.service.js";

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

  showSuccess,
  showError

}

from "../ui/modal.js";


// ===============================
// CURRENT USER
// ===============================

let currentUser = null;


// WAIT FOR AUTH
auth.onAuthStateChanged((user)=>{

  if(user){

    currentUser = user;

    console.log(
      "USER LOGGED IN:",
      user.email
    );

  }

  else{

    console.log(
      "NO USER LOGIN"
    );

  }

});


// ===============================
// NAV
// ===============================

document.getElementById(
  "bottomNav"
).innerHTML =

renderBottomNav("home");


// ===============================
// ELEMENTS
// ===============================

const disco =
document.getElementById(
  "disco"
);

const meterNumber =
document.getElementById(
  "meterNumber"
);

const meterType =
document.getElementById(
  "meterType"
);

const amount =
document.getElementById(
  "amount"
);

const verifyBox =
document.getElementById(
  "verifyBox"
);

const meterName =
document.getElementById(
  "meterName"
);

const meterAddress =
document.getElementById(
  "meterAddress"
);

const buyBtn =
document.getElementById(
  "buyElectricityBtn"
);


// ===============================
// VERIFY METER
// ===============================

let verifiedData = null;


async function verifyMeter(){

  try{

    if(

      !disco.value ||

      !meterNumber.value ||

      !meterType.value

    ){

      return;

    }


    showLoader(
      "Verifying meter..."
    );


    const result =
    await verifyMeterService({

      disco:
      disco.value,

      meterNumber:
      meterNumber.value,

      meterType:
      meterType.value

    });


    verifiedData =
    result.data;


    verifyBox.style.display =
    "block";


    meterName.innerText =

      verifiedData.name ||

      "Unknown User";


    meterAddress.innerText =

      verifiedData.address ||

      "Nigeria";

  }

  catch(error){

    console.error(error);

    verifiedData = null;

    verifyBox.style.display =
    "none";

    showError(

      error.message ||

      "Meter verification failed"

    );

  }

  finally{

    hideLoader();

  }

}


// AUTO VERIFY
meterNumber.addEventListener(

  "blur",

  verifyMeter

);


// ===============================
// BUY ELECTRICITY
// ===============================

let processing = false;


buyBtn.addEventListener(

"click",

async()=>{

  // BLOCK DOUBLE CLICK
  if(processing){

    return;

  }


  try{

    // LOGIN CHECK
    if(!currentUser){

      showError(
        "Please login first"
      );

      return;

    }


    // VALIDATION
    if(!disco.value){

      showError(
        "Select Disco"
      );

      return;

    }


    if(!meterNumber.value){

      showError(
        "Enter meter number"
      );

      return;

    }


    if(!verifiedData){

      showError(
        "Verify meter first"
      );

      return;

    }


    if(!amount.value){

      showError(
        "Enter amount"
      );

      return;

    }


    // START PROCESSING
    processing = true;

    buyBtn.disabled = true;

    buyBtn.innerText =
    "Processing...";


    showLoader(
      "Processing electricity..."
    );


    // API CALL
    const result =
    await buyElectricityService({

      userId:
      currentUser.uid,

      disco:
      disco.value,

      meterNumber:
      meterNumber.value,

      meterType:
      meterType.value,

      amount:
      Number(amount.value)

    });


    // SAVE TRANSACTION
    await saveTransaction(

      currentUser.uid,

      {

        title:
        "Electricity Payment",

        amount:
        Number(amount.value),

        type:"debit",

        category:
        "electricity",

        status:"success",

        meterNumber:
        meterNumber.value,

        disco:
        disco.value,

        token:
        result.token || "",

        units:
        result.units || "",

        band:
        result.band || ""

      }

    );


    // FORMAT TOKEN
    const token =

      result.token

      ?

      result.token
      .match(/.{1,4}/g)
      ?.join(" ")

      :

      "N/A";


    // SUCCESS
showElectricityReceipt({

  token,

  units:
  result.units,

  band:
  result.band,

  amount:
  Number(amount.value),

  disco:
  disco.value,

  meter:
  meterNumber.value

});


    // RESET FORM
    amount.value = "";

    meterNumber.value = "";

    verifyBox.style.display =
    "none";

    verifiedData = null;

  }

  catch(error){

    console.error(error);

    showError(

      error.message ||

      "Electricity purchase failed"

    );

  }

  finally{

    processing = false;

    buyBtn.disabled = false;

    buyBtn.innerText =
    "Buy Electricity";

    hideLoader();

  }

});





function showElectricityReceipt(data){

  // REMOVE OLD
  const old =
  document.getElementById(
    "electricityReceipt"
  );

  if(old){

    old.remove();

  }


  // CREATE MODAL
  const modal =
  document.createElement("div");

  modal.className =
  "modal-overlay";

  modal.id =
  "electricityReceipt";


  modal.innerHTML = `

    <div class="tx-modal-box">

      <div class="tx-status-icon">

        ⚡

      </div>


      <h2>
        Electricity Successful
      </h2>


      <h1 class="tx-modal-amount">

        ₦${Number(data.amount)
          .toLocaleString("en-NG")}

      </h1>


      <!-- TOKEN -->
      <div style="margin-top:20px;">

        <p style="
          font-size:13px;
          opacity:.7;
          margin-bottom:8px;
        ">

          Electricity Token

        </p>

        <div style="
          background:#111827;
          padding:18px;
          border-radius:18px;
          font-size:24px;
          font-weight:bold;
          letter-spacing:3px;
          text-align:center;
          color:#00D492;
          word-break:break-word;
        ">

          ${data.token}

        </div>

      </div>


      <!-- DETAILS -->
      <div class="tx-modal-details">

        <div>
          <span>Units</span>
          <strong>
            ${data.units || "N/A"}
          </strong>
        </div>

        <div>
          <span>Band</span>
          <strong>
            ${data.band || "N/A"}
          </strong>
        </div>

        <div>
          <span>Meter</span>
          <strong>
            ${data.meter}
          </strong>
        </div>

        <div>
          <span>Disco</span>
          <strong>
            ${data.disco}
          </strong>
        </div>

      </div>


      <!-- BUTTONS -->
      <div style="
        display:flex;
        gap:10px;
        margin-top:20px;
      ">

        <button
          id="copyTokenBtn"

          style="
            flex:1;
            height:50px;
            border:none;
            border-radius:14px;
            background:#00A884;
            color:white;
            font-weight:bold;
          ">

          Copy Token

        </button>


        <button
          id="closeReceiptBtn"

          style="
            flex:1;
            height:50px;
            border:none;
            border-radius:14px;
            background:#1F2937;
            color:white;
            font-weight:bold;
          ">

          Close

        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // COPY
  document.getElementById(
    "copyTokenBtn"
  )

  .addEventListener(

    "click",

    ()=>{

      navigator.clipboard.writeText(
        data.token
      );

      alert(
        "Token copied"
      );

    }

  );


  // CLOSE
  document.getElementById(
    "closeReceiptBtn"
  )

  .addEventListener(

    "click",

    ()=>{

      modal.remove();

    }

  );

}