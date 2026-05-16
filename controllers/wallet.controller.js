const { db, admin } = require("../config/firebase");

// SAFE NUMBER HELPER
function toSafeNumber(value) {
  if (value === undefined || value === null) return null;

  const num = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : null;
}

// =====================
// CREDIT WALLET
// =====================
exports.creditWallet = async (req, res) => {

  try {

    const { userId, amount } = req.body;

    if (!userId || amount === undefined) {

      return res.status(400).json({
        error: "Invalid request"
      });

    }

    const safeAmount =
      toSafeNumber(amount);

    if (!safeAmount || safeAmount <= 0) {

      return res.status(400).json({
        error: "Invalid amount received"
      });

    }

    // CREDIT USER WALLET
    await db.collection("users")
      .doc(userId)
      .update({

        wallet:
          admin.firestore.FieldValue.increment(
            safeAmount
          ),

      });

    // SAVE TRANSACTION
    await db.collection("transactions")
      .add({

        userId,

        amount: safeAmount,

        type: "credit",

        status: "success",

        createdAt:
          admin.firestore.FieldValue.serverTimestamp()

      });



    // =====================
    // REFERRAL BONUS SYSTEM
    // =====================

    // ONLY FOR FIRST FUNDING >= ₦800
    if (safeAmount >= 800) {

      const userDoc = await db
        .collection("users")
        .doc(userId)
        .get();

      const userData =
        userDoc.data();

      // CHECK IF REFERRED
      if (

        userData?.referredBy &&

        !userData?.referralBonusPaid

      ) {

        // FIND REFERRER USING REFERRAL CODE
        const refQuery = await db
          .collection("users")
          .where(
            "referralCode",
            "==",
            userData.referredBy
          )
          .limit(1)
          .get();

        // IF REFERRER EXISTS
        if (!refQuery.empty) {

          const referrerDoc =
            refQuery.docs[0];

          const referrerId =
            referrerDoc.id;

          // CREDIT REFERRER
          await db.collection("users")
            .doc(referrerId)
            .update({

              wallet:
                admin.firestore.FieldValue.increment(100)

            });

          // SAVE BONUS TRANSACTION
          await db.collection("transactions")
            .add({

              userId: referrerId,

              type: "referral_bonus",

              amount: 100,

              status: "success",

              description:
                `Referral bonus from ${userData.fullName || "New User"}`,

              createdAt:
                admin.firestore.FieldValue.serverTimestamp()

            });

          // MARK BONUS PAID
          await db.collection("users")
            .doc(userId)
            .update({

              referralBonusPaid: true

            });

        }

      }

    }

    return res.json({

      success: true

    });

  } catch (err) {

    return res.status(500).json({

      error: err.message

    });

  }

};



// =====================
// FUND WALLET (TEST / INIT)
// =====================
exports.fundWallet = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    console.log("REQUEST:", req.body);

    if (!userId || amount === undefined) {
      return res.status(400).json({
        error: "Missing userId or amount"
      });
    }

    const safeAmount = toSafeNumber(amount);

    if (!safeAmount || safeAmount <= 0) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    await db.collection("users").doc(userId).update({
      wallet: admin.firestore.FieldValue.increment(safeAmount),
    });



// =====================
// REFERRAL BONUS SYSTEM
// =====================

// ONLY FOR FUNDING >= ₦800
if (safeAmount >= 800) {

  const userDoc = await db
    .collection("users")
    .doc(userId)
    .get();

  const userData = userDoc.data();

  // CHECK IF USER WAS REFERRED
  if (
    userData?.referredBy &&
    !userData?.referralBonusPaid
  ) {

    // FIND REFERRER USING REFERRAL CODE
    const refQuery = await db
      .collection("users")
      .where(
        "referralCode",
        "==",
        userData.referredBy
      )
      .limit(1)
      .get();

    // IF REFERRER EXISTS
    if (!refQuery.empty) {

      const referrerDoc =
        refQuery.docs[0];

      const referrerId =
        referrerDoc.id;

      // CREDIT REFERRER ₦100
      await db.collection("users")
        .doc(referrerId)
        .update({

          wallet:
            admin.firestore.FieldValue.increment(100)

        });

      // SAVE REFERRAL TRANSACTION
      await db.collection("transactions")
        .add({

          userId: referrerId,

          type: "referral_bonus",

          amount: 100,

          status: "success",

          description:
            `Referral bonus from ${userData.fullName || "New User"}`,

          createdAt:
            admin.firestore.FieldValue.serverTimestamp()

        });

      // MARK BONUS AS PAID
      await db.collection("users")
        .doc(userId)
        .update({

          referralBonusPaid: true

        });

    }

  }

}



    return res.json({
      success: true,
      message: "Wallet funded successfully",
      userId,
      amount: safeAmount
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



// =====================
// GET USER WALLET
// =====================
exports.getWallet = async (req, res) => {

  try {

    const { uid } = req.params;

    const doc = await db
      .collection("users")
      .doc(uid)
      .get();

    if (!doc.exists) {

      return res.status(404).json({

        success: false,
        error: "User not found"

      });

    }

    const user = doc.data();

    return res.json({

      success: true,

      wallet:
        Number(user.wallet || 0),

      cashbackBalance:
        Number(
          user.cashbackBalance || 0
        ),

      virtualAccount:
        user.virtualAccount || null,

      referralCode:
        user.referralCode || "",

      referredBy:
        user.referredBy || ""

    });

  } catch (err) {

    return res.status(500).json({

      success: false,
      error: err.message

    });

  }

};
