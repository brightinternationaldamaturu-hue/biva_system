const { db, admin } = require("../config/firebase");

exports.withdrawCashback = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "Missing userId"
    });
  }

  const userRef = db.collection("users").doc(userId);

  let beforeBalance = 0;
  let afterBalance = 0;
  let cashbackAmount = 0;

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);

      if (!snap.exists) {
        throw new Error("User not found");
      }

      const user = snap.data();

      cashbackAmount = Number(user.cashbackBalance || 0);

      if (cashbackAmount <= 0) {
        throw new Error("No cashback available");
      }

      // =========================
      // WALLET SNAPSHOT (SAFE)
      // =========================
      beforeBalance = Number(user.wallet || 0);
      afterBalance = beforeBalance + cashbackAmount;

      // =========================
      // UPDATE USER
      // =========================
      t.update(userRef, {
        wallet: admin.firestore.FieldValue.increment(cashbackAmount),
        cashbackBalance: 0
      });

      // =========================
      // TRANSACTION RECORD
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

        amount: cashbackAmount,

        beforeBalance,
        afterBalance,

        status: "success",
        description: "Cashback moved to wallet",

        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return res.json({
      success: true,
      message: "Cashback withdrawn successfully",
      data: {
        amount: cashbackAmount,
        beforeBalance,
        afterBalance
      }
    });

  } catch (err) {
    console.log("CASHBACK WITHDRAW ERROR:", err.message);

    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
