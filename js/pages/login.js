import {

  loginUser

}

from "../services/auth.service.js";

import {

  showSuccess,
  showError

}

from "../ui/modal.js";


import {  
  showLoader,
  hideLoader
} 
from "../ui/loader.js";




// PASSWORD TOGGLE
  const toggle =
  document.getElementById(
    "togglePassword"
  );

  const password =
  document.getElementById(
    "password"
  );

  toggle.onclick = ()=>{

    if(password.type === "password"){

      password.type = "text";

      toggle.innerText = "🙈";

    }

    else{

      password.type = "password";

      toggle.innerText = "👁️";

    }

  };


// =========================
// LOGIN
// =========================

document.getElementById(
  "loginBtn"
)

.addEventListener(

  "click",

  async()=>{

    try{

      const email =
      document.getElementById(
        "email"
      ).value.trim();

      const password =
      document.getElementById(
        "password"
      ).value.trim();


      if(!email || !password){

        showError(
          "Enter email and password"
        );

        return;
      }

showLoader();


      await loginUser(
        email,
        password
      );



      window.location.href =
      "home.html";

    }

    catch(error){

      console.error(error);

      showError(

        error.message ||

        "Login failed"

      );

    }

  }

);



