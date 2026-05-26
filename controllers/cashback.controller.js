const { db, admin } = require("../config/firebase");

exports.withdrawCashback = async (req, res) => {
  try {
    const { userId } = req.body;

    const userRef = db.collection("users").doc(userId);

    const snap = await userRef.get();

    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const user = snap.data();

    const cashback = Number(user.cashbackBalance || 0);

    if (cashback <= 0) {
      return res.status(400).json({
        success: false,
        error: "No cashback available"
      });
    }

    // =========================
    // SNAPSHOT (IMPORTANT)
    // =========================
    const beforeBalance = Number(user.wallet || 0);
    const afterBalance = beforeBalance + cashback;

    const transactionRef = db.collection("transactions").doc();

    // =========================
    // WRITE TRANSACTION FIRST (SAFE)
    // =========================
    await transactionRef.set({
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

    // =========================
    // UPDATE USER AFTER
    // =========================
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(cashback),
      cashbackBalance: 0
    });

    return res.json({
      success: true,
      message: "Cashback withdrawn successfully",
      data: {
        amount: cashback,
        beforeBalance,
        afterBalance
      }
    });

  } catch (err) {
    console.log("CASHBACK ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
