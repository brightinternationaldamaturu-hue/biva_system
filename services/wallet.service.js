import { db }
from "../firebase/config.js";

import {

  doc,
  getDoc,
  updateDoc,
  increment

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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