const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.verifyPayment = async (req, res) => {
  try {
    const { transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        message: "Missing transaction_id"
      });
    }

    // STEP 1: VERIFY PAYMENT
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const data = response.data?.data;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Invalid Flutterwave response"
      });
    }

    // STEP 2: VALIDATIONS
    if (data.status !== "successful") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });
    }

    if (data.currency !== "NGN") {
      return res.status(400).json({
        success: false,
        message: "Invalid currency"
      });
    }

    const amount = Number(data.amount);
    const email = data.customer.email;
    const tx_ref = data.tx_ref;

    if (!Number.isFinite(amount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    // STEP 3: FIND USER
    const snapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userDoc = snapshot.docs[0];
    const userRef = userDoc.ref;

    const processedRef = db.collection("processedPayments").doc(tx_ref);

    // STEP 4: SAFE TRANSACTION
    await db.runTransaction(async (t) => {

      const processedSnap = await t.get(processedRef);

      if (processedSnap.exists) {
        throw new Error("DUPLICATE");
      }

      const userSnap = await t.get(userRef);

      if (!userSnap.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      // CREDIT WALLET
      t.update(userRef, {
        wallet: admin.firestore.FieldValue.increment(amount)
      });

      // MARK PROCESSED
      t.set(processedRef, {
        tx_ref,
        email,
        amount,
        createdAt: new Date()
      });

      // TRANSACTION LOG
      const transRef = db.collection("transactions").doc();

      t.set(transRef, {
        email,
        amount,
        type: "funding",
        status: "success",
        tx_ref,
        createdAt: new Date()
      });
    });

    return res.json({
      success: true,
      message: "Wallet funded successfully"
    });

  } catch (err) {

    if (err.message === "DUPLICATE") {
      return res.json({
        success: true,
        message: "Already processed"
      });
    }

    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.error("PAYMENT ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
