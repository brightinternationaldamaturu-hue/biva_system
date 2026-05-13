const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.verifyPayment = async (req, res) => {

  try {

    const {
      transaction_id,
      userId
    } = req.body;

    if (!transaction_id) {

      return res.status(400).json({
        success: false,
        message: "Missing transaction_id"
      });
    }

    // =====================================
    // VERIFY PAYMENT FROM FLUTTERWAVE
    // =====================================

    const response = await axios.get(

      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,

      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`,
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

    // =====================================
    // VALIDATIONS
    // =====================================

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

    const amount =
      Number(data.amount);

    const email =
      data.customer.email;

    const tx_ref =
      data.tx_ref;

    if (!Number.isFinite(amount)) {

      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    // =====================================
    // FIND USER
    // =====================================

    let userRef;

    // USE userId IF SENT
    if (userId) {

      userRef =
        db.collection("users").doc(userId);

      const userSnap =
        await userRef.get();

      if (!userSnap.exists) {

        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

    } else {

      // FALLBACK TO EMAIL SEARCH
      const snapshot =
        await db.collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snapshot.empty) {

        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      userRef =
        snapshot.docs[0].ref;
    }

    // =====================================
    // DUPLICATE CHECK
    // =====================================

    const processedRef =
      db.collection("processedPayments")
      .doc(tx_ref);

    // =====================================
    // FIRESTORE TRANSACTION
    // =====================================

    await db.runTransaction(async (t) => {

      const processedSnap =
        await t.get(processedRef);

      // BLOCK DUPLICATES
      if (processedSnap.exists) {

        throw new Error("DUPLICATE");
      }

      // CREDIT WALLET
      t.update(userRef, {

        wallet:
          admin.firestore.FieldValue.increment(
            amount
          )
      });

      // SAVE PROCESSED RECORD
      t.set(processedRef, {

        tx_ref,
        email,
        amount,

        createdAt:
          admin.firestore.FieldValue.serverTimestamp()
      });

      // SAVE TRANSACTION
      const transRef =
        db.collection("transactions")
        .doc(tx_ref);

      t.set(transRef, {

        userId:
          userRef.id,

        email,

        amount,

        type: "fund",

        status: "success",

        tx_ref,

        createdAt:
          admin.firestore.FieldValue.serverTimestamp()
      });

    });

    // =====================================
    // SUCCESS
    // =====================================

    return res.json({

      success: true,

      message:
        "Wallet funded successfully"
    });

  } catch (err) {

    // DUPLICATE SAFE
    if (err.message === "DUPLICATE") {

      return res.json({

        success: true,

        message:
          "Already processed"
      });
    }

    console.error(

      "PAYMENT ERROR:",

      err.response?.data ||
      err.message
    );

    return res.status(500).json({

      success: false,

      message:
        err.response?.data?.message ||
        err.message
    });
  }
};
