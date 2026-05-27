// ===============================
// FIREBASE IMPORTS
// ===============================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  where
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// FIREBASE CONFIG
// ===============================
const firebaseConfig = {

  apiKey: "AIzaSyDaZH5kn_mmxap3jOyw3Yhq55d936Jhl0g",

  authDomain: "biva-system.firebaseapp.com",

  projectId: "biva-system",

  storageBucket: "biva-system.firebasestorage.app",

  messagingSenderId: "334844312203",

  appId: "1:334844312203:web:9898fad9ca50c89ebdb28e"

};


// ===============================
// INITIALIZE FIREBASE
// ===============================
const app = initializeApp(firebaseConfig);


// ===============================
// EXPORT SERVICES
// ===============================
export const auth = getAuth(app);

export const db = getFirestore(app);


// ===============================
// EXPORT FIRESTORE HELPERS
// ===============================
export {

  collection,

  doc,

  onSnapshot,

  getDoc,

  getDocs,

  query,

  where

};