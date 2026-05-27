import { auth, db } from "../firebase/config.js";

import {

  doc,
  getDoc,
  updateDoc,
  increment

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import { showLoader, hideLoader } from "../ui/loader.js";
import { showError, showSuccess } from "../ui/modal.js";





// ===============================
// GET WALLET
// ===============================

export async function getWallet(uid){

  const ref =
  doc(db,"users",uid);

  const snap =
  await getDoc(ref);

  if(!snap.exists()){

    throw new Error(
      "User not found"
    );

  }

  return snap.data().wallet || 0;

}


// ===============================
// DEDUCT WALLET
// ===============================

export async function deductWallet(

  uid,
  amount

){

  const ref =
  doc(db,"users",uid);

  await updateDoc(

    ref,

    {

      wallet:
      increment(-amount)

    }

  );

}




/**
 * GENERATE VIRTUAL ACCOUNT
 */
export async function generateVirtualAccount(uid) {
  try {

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    const response = await fetch(
      "https://biva-backend-ezvu.onrender.com/api/create-virtual-account",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          email: auth.currentUser.email,
          fullName: userData.fullName || "BIVA User",
          phone: userData.phone || "0000000000"
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to generate account");
    }

    return data;

  } catch (err) {
    console.error(err);
    throw err;
  }
}






/**
 * COPY ACCOUNT NUMBER
 */
export async function copyAccountNumber(number) {
  try {
    await navigator.clipboard.writeText(number);
    showSuccess("Account number copied");
  } catch (err) {
    showError("Copy failed");
  }
}