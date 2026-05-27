const { db, admin } = require("../config/firebase");
const { sendAdminNotification } = require( "../js/utils/adminNotification" );

exports.withdrawCashback = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId"
      });
    }

    const userRef = db.collection("users").doc(userId);
    const txRef = db.collection("transactions").doc();

    const result = await db.runTransaction(async (t) => {

      const snap = await t.get(userRef);

      if (!snap.exists) {
        throw new Error("User not found");
      }

      const user = snap.data();

      const cashback = Number(user.cashbackBalance || 0);

      if (cashback <= 0) {
        throw new Error("No cashback available");
      }

      // ✅ SNAPSHOT INSIDE TRANSACTION (IMPORTANT FIX)
      const beforeBalance = Number(user.wallet || 0);
      const afterBalance = beforeBalance + cashback;

      // =========================
      // UPDATE USER
      // =========================
      t.update(userRef, {
        wallet: admin.firestore.FieldValue.increment(cashback),
        cashbackBalance: 0
      });

      // =========================
      // SAVE TRANSACTION
      // =========================
      t.set(txRef, {
        userId,
        email: user.email || "",
        fullName: user.fullName || "",
        phone: user.phone || "",

        type: "cashback_withdrawal",
        category: "cashback",
        title: "Cashback Withdrawal",

        amount: cashback,

        beforeBalance,
        afterBalance,

        status: "success",
        description: "Cashback moved to wallet",

        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        amount: cashback,
        beforeBalance,
        afterBalance
      };
    });

    return res.json({
      success: true,
      message: "Cashback withdrawn successfully",
      data: result
    });

  } catch (err) {
    console.log("CASHBACK ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
