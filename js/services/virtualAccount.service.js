import { auth, db } from "../firebase/config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { showLoader, hideLoader } from "../ui/loader.js";
import { showSuccess, showError } from "../ui/modal.js";

const API_URL =
  "https://biva-backend-ezvu.onrender.com/api/create-virtual-account";


// =========================
// GENERATE VIRTUAL ACCOUNT
// =========================
export async function generateVirtualAccount() {

  const user = auth.currentUser;

  if (!user) {
    showError("Please login first");
    return;
  }

  try {

    showLoader("Generating account...");

    // GET USER DATA
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      throw new Error("User not found");
    }

    const userData = snap.data();

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        fullName: userData.fullName || "BIVA Wallet",
        phone: userData.phone || "08000000000"
      })
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to generate account");
    }

    // OPTIONAL: store returned account
    await updateDoc(userRef, {
      virtualAccount: data.account
    });

    showSuccess("Virtual account created successfully");

    // refresh UI
    await loadVirtualAccount();

  } catch (err) {
    console.log(err);
    showError(err.message || "Something went wrong");
  } finally {
    hideLoader();
  }
}