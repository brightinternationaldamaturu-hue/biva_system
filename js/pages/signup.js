import { auth, db }
from "../firebase/config.js";

import {

  createUserWithEmailAndPassword

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

  doc,
  setDoc,
  serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {

  showLoader,
  hideLoader

}

from "../ui/loader.js";


import {

  showError,
  showSuccess

}

from "../ui/modal.js";


// =========================
// PASSWORD TOGGLE
// =========================

const toggle =
document.getElementById(
  "togglePassword"
);

const passwordInput =
document.getElementById(
  "password"
);

toggle.onclick = ()=>{

  if(passwordInput.type === "password"){

    passwordInput.type = "text";

    toggle.innerText = "🙈";

  }

  else{

    passwordInput.type = "password";

    toggle.innerText = "👁️";

  }

};


// =========================
// SIGNUP
// =========================

const signupBtn =
document.getElementById(
  "signupBtn"
);


signupBtn.addEventListener(

  "click",

  async()=>{

    try{

      const fullName =
      document.getElementById(
        "fullName"
      ).value.trim();

      const email =
      document.getElementById(
        "email"
      ).value.trim();

      const password =
      document.getElementById(
        "password"
      ).value.trim();


// REFERRAL
const urlParams =
new URLSearchParams(
  window.location.search
);

// CHECK URL FIRST
let referredBy =
urlParams.get("ref");

// CHECK INPUT IF URL EMPTY
if(!referredBy){

  referredBy =
  document.getElementById(
    "referralCode"
  ).value.trim() || null;

}


      // VALIDATION
      if(

        !fullName ||

        !email ||

        !password

      ){

        showError(
          "Please fill all fields"
        );

        return;

      }


      // SHOW LOADER
      showLoader(
        "Creating Account...",
        "Setting up your BIVA account"
      );


      // CREATE ACCOUNT
      const userCredential =

      await createUserWithEmailAndPassword(

        auth,
        email,
        password

      );


      const user =
      userCredential.user;


      // GENERATE REFERRAL CODE
      const referralCode =

        "BIVA" +

        Math.random()

        .toString(36)

        .substring(2,6)

        .toUpperCase();


await setDoc(

  doc(
    db,
    "users",
    user.uid
  ),

  {

    uid:user.uid,

    fullName,

    email,

    wallet:0,

    cashbackBalance:0,

    blocked:false,

    referralCode,

    referredBy,

    referralBonusPaid:false,

    // =========================
    // TRANSACTION PIN
    // =========================
    hasPin:false,

    transactionPin:null,

    // =========================
    // SECURITY
    // =========================
    biometricEnabled:false,

    notificationsEnabled:true,

    // =========================
    // ACCOUNT STATUS
    // =========================
    verified:false,

    kycLevel:1,

    createdAt:
    serverTimestamp()

  }

);

      // SUCCESS
      showSuccess(
        "Account created successfully"
      );


      // REDIRECT
      setTimeout(()=>{

        window.location.href =
        "login.html";

      },1500);

    }

    catch(error){

      console.error(error);

      showError(

        error.message ||

        "Signup failed"

      );

    }

    finally{

      hideLoader();

    }

  }

);