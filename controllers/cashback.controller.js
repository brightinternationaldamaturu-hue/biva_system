const { db, admin } = require("../config/firebase");

exports.withdrawCashback = async (req, res) => {
  try {
    const { userId } = req.body;

    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);

      if (!snap.exists) {
        throw new Error("User not found");
      }

      const user = snap.data();

      const cashback = Number(user.cashbackBalance || 0);

      if (cashback <= 0) {
        throw new Error("No cashback available");
      }

      // =========================
      // SNAPSHOT (LIKE AIRTIME STYLE)
      // =========================
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
      // TRANSACTION
      // =========================
      const txRef = db.collection("transactions").doc();

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
    });

    return res.json({
      success: true,
      message: "Cashback withdrawn successfully"
    });

  } catch (err) {
    console.log("CASHBACK ERROR:", err.message);

    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
