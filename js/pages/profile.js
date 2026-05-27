import {
  renderBottomNav
}
from "../components/bottomNav.js";


import {
  showLoader,
  hideLoader
}
from "../ui/loader.js";

import {
  logoutUser
}
from "../services/auth.service.js";

import { auth }
from "../firebase/config.js";

import {
  listenToUserData
}
from "../services/user.service.js";


export function loadProfile(app) {
  app.innerHTML = `
    <h1>Profile Page</h1>
  `;
}









// ===============================
// RENDER NAVIGATION
// ===============================

document.getElementById(
  "bottomNav"
).innerHTML =

renderBottomNav(
  "profile"
);




// ===============================
// AUTH CHECK
// ===============================

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    hideLoader();
    window.location.href = "login.html";
    return;
  }

  let unsub;

  try {

    unsub = listenToUserData(user.uid, (data) => {

      const firstName = (data.fullName || "User").split(" ")[0];

      document.getElementById("userName").innerText =
        `Welcome ${firstName}`;

      document.getElementById("userEmail").innerText =
        user.email;

      document.getElementById("avatarLetter").innerText =
        (data.fullName || "B").charAt(0).toUpperCase();

    });

  } catch (error) {

    console.log(error);


  }

});


// ===============================
// LOGOUT
// ===============================

document.getElementById(
  "logoutBtn"
)

.addEventListener(

  "click",

  async()=>{

    await logoutUser();

    window.location.href =
    "login.html";

  }

);






// =========================
// PWA INSTALL PROMPT
// =========================

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.getElementById("installBtn");

  if (btn) {
    btn.style.display = "flex";

    btn.onclick = async () => {
      deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;
      console.log(choice);

      deferredPrompt = null;
    };
  }
});

