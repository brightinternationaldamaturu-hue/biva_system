const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.buyAirtime = async (req, res) => {

  try {

    const {
      phone,
      network,
      amount,
      email,
      requestId
    } = req.body;

    if (
      !phone ||
      !network ||
      !amount ||
      !email ||
      !requestId
    ) {
      return res.status(400).json({
        error: "Missing fields"
      });
    }

    // =====================================
    // NETWORK MAP
    // =====================================

    const networkMap = {
      MTN: "mtn",
      GLO: "glo",
      AIRTEL: "airtel",
      "9MOBILE": "9mobile"
    };

    const networkCode =
      networkMap[network.toUpperCase()];

    if (!networkCode) {
      return res.status(400).json({
        error: "Invalid network"
      });
    }

    // =====================================
    // DUPLICATE BLOCKER
    // =====================================

    const txRef =
      db.collection("transactions")
        .doc(requestId);

    const existing =
      await txRef.get();

    if (existing.exists) {

      return res.json({
        success: true,
        message: "Already processed"
      });
    }

    // =====================================
    // GET USER
    // =====================================

    const snapshot =
      await db.collection("users")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const userDoc =
      snapshot.docs[0];

    const userRef =
      userDoc.ref;

    // =====================================
    // FIRESTORE TRANSACTION
    // =====================================

    await db.runTransaction(
      async (transaction) => {

      const freshUser =
        await transaction.get(userRef);

      const wallet =
        freshUser.data().wallet || 0;

      if (wallet < amount) {
        throw new Error(
          "Insufficient balance"
        );
      }

      // deduct safely
      transaction.update(userRef, {
        wallet: wallet - amount
      });

      // create transaction FIRST
      transaction.create(txRef, {

        txId: requestId,

        email,
        phone,
        network,
        amount,

        type: "airtime",

        status: "processing",

        createdAt: new Date()
      });

    });

    // =====================================
    // CALL PROVIDER
    // =====================================

    const response =
      await axios.post(
      "https://iacafe.com.ng/devapi/v1/airtime",
      {
        username:
          process.env.IACAFE_USERNAME,

        api_key:
          process.env.IACAFE_API_KEY,

        network: networkCode,

        phone,

        amount,

        ref: requestId
      }
    );

    console.log(
      "IACAFE RESPONSE:",
      response.data
    );

    const success =
      response.data?.code === "success" ||
      response.data?.data?.status ===
      "completed-api";

    if (!success) {
      throw new Error(
        "Provider failed"
      );
    }

    // =====================================
    // UPDATE SUCCESS
    // =====================================

    await txRef.update({
      status: "success"
    });

    return res.json({
      success: true,
      message:
        "Airtime sent successfully"
    });

  } catch (err) {

    console.error(
      "🔥 SERVER ERROR:",
      err.message
    );

    // refund logic
    try {

      const {
        email,
        amount,
        requestId
      } = req.body;

      const txRef =
        db.collection("transactions")
        .doc(requestId);

      const txDoc =
        await txRef.get();

      // only refund if tx exists
      if (txDoc.exists) {

        const snapshot =
          await db.collection("users")
          .where("email", "==", email)
          .get();

        if (!snapshot.empty) {

          const userRef =
            snapshot.docs[0].ref;

          await userRef.update({
            wallet:
              admin.firestore
              .FieldValue
              .increment(amount)
          });
        }

        await txRef.update({
          status: "failed",
          error: err.message
        });
      }

    } catch(refundErr) {

      console.error(
        "REFUND ERROR:",
        refundErr.message
      );
    }

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
