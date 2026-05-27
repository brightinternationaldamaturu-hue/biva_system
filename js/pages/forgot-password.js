import { auth }
from "../firebase/config.js";

import {
  sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const resetBtn =
document.getElementById(
  "resetBtn"
);

resetBtn.addEventListener(

  "click",

  async()=>{

    try{

      const email =
      document.getElementById(
        "resetEmail"
      ).value.trim();


      if(!email){

        alert(
          "Enter your email"
        );

        return;
      }


      await sendPasswordResetEmail(
        auth,
        email
      );


      alert(
        "Password reset email sent"
      );

    }

    catch(error){

      console.error(error);

      alert(
        error.message
      );

    }

  }

);