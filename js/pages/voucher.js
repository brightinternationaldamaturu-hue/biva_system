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



import {
  buyVoucherService
}
from "../services/voucher.service.js";





















document.getElementById(
  "bottomNav"
).innerHTML =
renderBottomNav("home");



function getCurrentUser(){

  return auth.currentUser;

}




// ===============================
// VOUCHER PLANS
// ===============================

const voucherPlans = [

  {price:150, desc:'1GB'},
  {price:300, desc:'2GB'},
  {price:450, desc:'3GB'},
  {price:600, desc:'4GB'},
  {price:900, desc:'6GB'},
  {price:1050, desc:'7GB'},
  {price:1200, desc:'8GB'},
  {price:1500, desc:'10GB'},
  {price:2250, desc:'15GB'},
  {price:3000, desc:'20GB'},
  {price:3750, desc:'25GB'},
  {price:5400, desc:'36GB'},
  {price:9750, desc:'65GB'},
  {price:15000, desc:'100GB'},
  {price:16500, desc:'120GB'},
  {price:17500, desc:'150GB'},
  {price:25000, desc:'200GB'},
  {price:30000, desc:'Unlimited'}

];


// ===============================
// LOAD PLANS
// ===============================

function loadVoucherPlans(){

  const plansDiv =

    document.getElementById(
      "voucherPlans"
    );

  plansDiv.innerHTML = "";

  plansDiv.classList.add("grid");

  voucherPlans.forEach(p => {

    plansDiv.innerHTML += `

  <div class="card">

    <div class="cashback-badge">

      Earn ₦${Math.floor(p.price * 0.10)}

    </div>

    <h3>

      ₦${p.price}

    </h3>

    <p>

      ${p.desc}

    </p>

    <div class="cashback-text">

      10% Cashback Reward

    </div>

    <button
      class="btn"
      onclick="buy('${p.desc}')">

      Buy Voucher

    </button>

  </div>

`;

  });

}


// ===============================
// PAGE LOAD
// ===============================

window.addEventListener(

  "DOMContentLoaded",

  loadVoucherPlans

);


// ===============================
// SUCCESS CARD
// ===============================

function showSuccessCard(

  message = "Purchase Successful"

){

  document.querySelector(
    "#successCard h2"
  ).innerText = message;

  document.getElementById(
    "successCard"
  ).style.display = "flex";

}


// ===============================
// CLOSE SUCCESS
// ===============================

window.closeSuccessCard = function(){

  document.getElementById(
    "successCard"
  ).style.display = "none";

};


// ===============================
// BUY VOUCHER
// ===============================

async function buy(desc){

  try{

    const currentUser = getCurrentUser();

if(!currentUser){

      showError(
        "Please login first"
      );

      return;

    }

    // =========================
// GET USER DATA
// =========================

const userDoc = await getDoc(

  doc(
    db,
    "users",
    currentUser.uid
  )

);

const userData = userDoc.data();


// =========================
// CHECK PIN EXISTS
// =========================

if(

  !userData.transactionPin

){

  throw new Error(
    "Please setup transaction PIN first"
  );

}


// =========================
// VERIFY TRANSACTION PIN
// =========================

await verifyTransactionPin(

  userData.transactionPin,

  {

    title: "Voucher Purchase",

    amount:
      voucherPlans.find(
        p => p.desc === desc
      )?.price || 0,

    plan: desc

  }

);

    showLoader(

      "Processing Purchase",

      "Generating voucher..."

    );

    // =========================
    // BACKEND PURCHASE
    // =========================

    const result =

      await buyVoucherService({

        userId:
          currentUser.uid,

        desc

      });

    // =========================
    // SUCCESS
    // =========================

    hideLoader();

showSuccess(
  result.message
);

    // =========================
    // PRINT RECEIPT
    // =========================

    printVoucher({

      email:
        currentUser.email,

      plan:
        desc,

      price:
        result.amount,

      voucher:
        result.voucher

    });

  }

  catch(err){

    console.log(err);

    hideLoader();

    showError(

      err.message ||

      "Purchase failed"

    );

  }

}



window.buy = buy;



function printVoucher(data){

  const portalURL =
  `https://neverssl.com`;

  const receiptWindow =
  window.open(
    "",
    "_blank"
  );

  if(!receiptWindow){

    alert(
      "Please allow popups"
    );

    return;

  }

  receiptWindow.document.write(`

<html>

<head>

<title>BIVA Voucher Receipt</title>

<style>

body{

  margin:0;
  padding:25px;

  background:#0F172A;

  font-family:Arial,sans-serif;

  color:white;

}

.receipt{

  max-width:420px;

  margin:auto;

  background:#111827;

  border-radius:24px;

  padding:24px;

  box-shadow:
  0 10px 30px rgba(0,0,0,.35);

}

.logo{

  text-align:center;

  font-size:30px;

  font-weight:900;

  color:#00D492;

  margin-bottom:20px;

}

.title{

  text-align:center;

  font-size:20px;

  font-weight:700;

  margin-bottom:30px;

}

.row{

  margin-bottom:18px;

}

.label{

  opacity:.6;

  font-size:13px;

  margin-bottom:6px;

}

.value{

  font-size:18px;

  font-weight:700;

}

.voucher-box{

  background:#0B1220;

  border:2px dashed #00D492;

  border-radius:18px;

  padding:20px;

  text-align:center;

  margin-top:20px;

  margin-bottom:20px;

}

.voucher-code{

  font-size:30px;

  font-weight:900;

  letter-spacing:3px;

  color:#00D492;

}

.buttons{

  display:flex;

  gap:12px;

  margin-top:25px;

}

.btn{

  flex:1;

  height:52px;

  border:none;

  border-radius:16px;

  font-size:16px;

  font-weight:700;

  cursor:pointer;

}

.copy-btn{

  background:#1F2937;

  color:white;

}

.activate-btn{

  background:
  linear-gradient(
    135deg,
    #00D492,
    #00A884
  );

  color:white;

}

.footer{

  text-align:center;

  margin-top:30px;

  opacity:.6;

  font-size:12px;

}

</style>

</head>

<body>

<div class="receipt">

  <div class="logo">
    BIVA
  </div>

  <div class="title">
    Voucher Purchase Successful
  </div>

  <div class="row">

    <div class="label">
      Email
    </div>

    <div class="value">
      ${data.email}
    </div>

  </div>

  <div class="row">

    <div class="label">
      Plan
    </div>

    <div class="value">
      ${data.plan}
    </div>

  </div>

  <div class="row">

    <div class="label">
      Amount
    </div>

    <div class="value">
      ₦${Number(data.price)
        .toLocaleString("en-NG")}
    </div>

  </div>

  <div class="voucher-box">

    <div class="label">
      Voucher Code
    </div>

    <div
      class="voucher-code"
      id="voucherCode"
    >
      ${data.voucher}
    </div>

  </div>

  <div class="buttons">

    <button
      class="btn copy-btn"
      onclick="copyVoucher()"
    >

      Copy

    </button>

    <button
      class="btn activate-btn"
      onclick="activateVoucher()"
    >

      Activate

    </button>

  </div>

  <div class="footer">

    Powered by BIVA Network

  </div>

</div>

<script>

function copyVoucher(){

  const code =
  document.getElementById(
    "voucherCode"
  ).innerText;

  navigator.clipboard.writeText(
    code
  );

const toast = document.createElement("div");

toast.innerText =
"Voucher copied successfully ✅";

toast.style.position = "fixed";
toast.style.bottom = "30px";
toast.style.left = "50%";
toast.style.transform = "translateX(-50%)";

toast.style.background =
"linear-gradient(135deg,#00D492,#00A884)";

toast.style.color = "#fff";

toast.style.padding =
"14px 22px";

toast.style.borderRadius =
"14px";

toast.style.fontSize =
"14px";

toast.style.fontWeight =
"700";

toast.style.boxShadow =
"0 8px 20px rgba(0,0,0,.25)";

toast.style.zIndex =
"999999";

toast.style.opacity = "0";

toast.style.transition =
"0.3s ease";

document.body.appendChild(toast);

setTimeout(()=>{

  toast.style.opacity = "1";

},50);

setTimeout(()=>{

  toast.style.opacity = "0";

  setTimeout(()=>{

    toast.remove();

  },300);

},2500);
}





function activateVoucher(){

  const code =
  document.getElementById(
    "voucherCode"
  ).innerText;

  window.location.href =
  "${portalURL}?voucher=" + code;

}

</script>

</body>

</html>

  `);

  receiptWindow.document.close();

}