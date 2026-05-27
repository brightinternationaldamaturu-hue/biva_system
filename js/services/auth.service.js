import { auth }
from "../firebase/config.js";

import {
  signInWithEmailAndPassword,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// LOGIN
export async function loginUser(email, password){

  return await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

}


// LOGOUT
export async function logoutUser(){

  return await signOut(auth);

}