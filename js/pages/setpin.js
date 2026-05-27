import {

  auth,
  db

}

from "../firebase/config.js";


import { renderBottomNav } from "../components/bottomNav.js";


import {

  doc,
  updateDoc

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

  showSuccess,
  showError

}

from "../ui/modal.js";


// ===============================
// SAVE PIN
// ===============================

document.getElementById(

  "savePinBtn"

)
.addEventListener(

  "click",

  async()=>{

    try{

      const pin =

      document.getElementById(
        "pin"
      )

      .value.trim();

      const confirmPin =

      document.getElementById(
        "confirmPin"
      )

      .value.trim();

      // ===============================
      // VALIDATION
      // ===============================

      if(

        pin.length !== 4

      ){

        throw new Error(
          "PIN must be 4 digits"
        );

      }

      if(

        pin !== confirmPin

      ){

        throw new Error(
          "PIN does not match"
        );

      }

      // ===============================
      // SAVE TO FIRESTORE
      // ===============================

      await updateDoc(

        doc(
          db,
          "users",
          auth.currentUser.uid
        ),

        {

          transactionPin:pin,

          hasPin:true

        }

      );

      showSuccess(
        "Transaction PIN saved"
      );

      // REDIRECT
      setTimeout(()=>{

        window.location.href =
        "profile.html";

      },1500);

    }

    catch(error){

      showError(
        error.message
      );

    }

  }

);