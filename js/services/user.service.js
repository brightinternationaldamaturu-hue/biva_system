import { db } from "../firebase/config.js";

import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// GET USER DATA (ONE TIME)
// ===============================
export async function getUserData(uid) {

  try {

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return snap.data();

  } catch (error) {

    console.error("getUserData error:", error);
    return null;

  }

}


// ===============================
// REALTIME USER LISTENER (SAFE)
// ===============================
export function listenToUserData(uid, callback) {

  if (!uid) {
    console.warn("listenToUserData: missing uid");
    return () => {};
  }

  const ref = doc(db, "users", uid);

  return onSnapshot(
    ref,
    (docSnap) => {

      if (!docSnap.exists()) {
        console.warn("User document not found");
        return;
      }

      const data = docSnap.data();

      if (callback) callback(data);

    },
    (error) => {
      console.error("listenToUserData error:", error);
    }
  );

}