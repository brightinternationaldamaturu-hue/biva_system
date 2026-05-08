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
      return res.status(400).json({ error: "Invalid request" });
    }

    const safeAmount = toSafeNumber(amount);

    if (!safeAmount || safeAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount received" });
    }

    await db.collection("users").doc(userId).update({
      wallet: admin.firestore.FieldValue.increment(safeAmount),
    });

    await db.collection("transactions").add({
      userId,
      amount: safeAmount,
      type: "credit",
      createdAt: new Date(),
    });

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
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