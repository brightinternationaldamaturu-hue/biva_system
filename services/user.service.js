import { db }
from "../firebase/config.js";

import {

  doc,
  getDoc,
  onSnapshot

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// GET USER DATA
// ===============================

export async function getUserData(uid){

  const ref =
  doc(db,"users",uid);

  const snap =
  await getDoc(ref);

  if(snap.exists()){

    return snap.data();

  }

  return null;

}


// ===============================
// REALTIME USER LISTENER
// ===============================

export function listenToUserData(

  uid,
  callback

){

  return onSnapshot(

    doc(db,"users",uid),

    (docSnap)=>{

      if(docSnap.exists()){

        callback(

          docSnap.data()

        );

      }

    }

  );

}