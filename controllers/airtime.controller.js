const axios = require("axios");
const { db, admin } = require("../config/firebase");

// ===============================
// BUY AIRTIME
// ===============================

exports.buyAirtime = async (req, res) => {

  let walletDeducted = false;

  try {

    const {
      phone,
      network,
      amount,
      email
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (
      !phone ||
      !network ||
      !amount ||
      !email
    ) {

      return res.status(400).json({

        success: false,

        error: "Missing required fields"

      });
    }

    // ===============================
    // BLOCK INVALID LOW VALUES
    // ===============================

    if (Number(amount) < 50) {

      return res.status(400).json({

        success: false,

        error: "Minimum airtime is ₦50"

      });
    }

    // ===============================
    // NETWORK MAP
    // ===============================

    const networkMap = {

      MTN: "mtn",

      GLO: "glo",

      AIRTEL: "airtel",

      "9MOBILE": "9mobile"

    };

    const networkCode =
      networkMap[
        network.toUpperCase()
      ];

    if (!networkCode) {

      return res.status(400).json({

        success: false,

        error: "Invalid network"

      });
    }

    // ===============================
    // FIND USER
    // ===============================

    const snapshot =
      await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {

      return res.status(404).json({

        success: false,

        error: "User not found"

      });
    }

    const userDoc =
      snapshot.docs[0];

    const userRef =
      userDoc.ref;

    // ===============================
    // UNIQUE TRANSACTION ID
    // ===============================

    const txId =
      "AIRTIME_" + Date.now();

    // ===============================
    // SAFE WALLET DEDUCTION
    // ===============================

    await db.runTransaction(

      async (transaction) => {

        const freshUser =
          await transaction.get(userRef);

        const wallet =
          Number(
            freshUser.data().wallet || 0
          );

        if (wallet < amount) {

          throw new Error(
            "Insufficient balance"
          );
        }

        transaction.update(userRef, {

          wallet:
          admin.firestore
          .FieldValue
          .increment(-amount)

        });

        walletDeducted = true;
      }
    );

    // ===============================
    // CALL IACAFE API
    // ===============================

    const response = await axios.post(

      "https://iacafe.com.ng/devapi/v1/airtime",

      {

        username:
        process.env.IACAFE_USERNAME,

        api_key:
        process.env.IACAFE_API_KEY,

        network:
        networkCode,

        phone,

        amount,

        ref: txId

      }

    );

    console.log(
      "IACAFE RESPONSE:",
      response.data
    );

    // ===============================
    // STRICT SUCCESS CHECK
    // ===============================

    const providerSuccess =

      response.data?.code ===
      "success" &&

      response.data?.data?.status ===
      "completed-api";

    if (!providerSuccess) {

      throw new Error(
        "Provider rejected transaction"
      );
    }

    // ===============================
    // SAVE SUCCESS TRANSACTION
    // ===============================

    await db.collection("transactions")
    .doc(txId)
    .set({

      txId,

      email,

      phone,

      network,

      amount,

      type: "airtime",

      status: "success",

      providerResponse:
      response.data,

      createdAt:

      admin.firestore
      .FieldValue
      .serverTimestamp()

    });

    // ===============================
    // SUCCESS RESPONSE
    // ===============================

    return res.json({

      success: true,

      message:
      "Airtime purchase successful"

    });

  } catch (err) {

    console.error(

      "🔥 AIRTIME ERROR:",

      err.response?.data ||
      err.message

    );

    // ===============================
    // AUTO REFUND
    // ===============================

    try {

      if (walletDeducted) {

        const {
          email,
          amount
        } = req.body;

        const snapshot =
          await db.collection("users")
          .where("email", "==", email)
          .limit(1)
          .get();

        if (!snapshot.empty) {

          await snapshot.docs[0]
          .ref
          .update({

            wallet:
            admin.firestore
            .FieldValue
            .increment(amount)

          });

          console.log(
            "✅ Wallet refunded"
          );
        }
      }

    } catch (refundErr) {

      console.error(

        "❌ REFUND FAILED:",

        refundErr.message

      );
    }

    // ===============================
    // SAVE FAILED TRANSACTION
    // ===============================

    try {

      await db.collection("transactions")
      .add({

        email:
        req.body.email,

        phone:
        req.body.phone,

        network:
        req.body.network,

        amount:
        req.body.amount,

        type: "airtime",

        status: "failed",

        error:
        "Provider rejected transaction",

        createdAt:

        admin.firestore
        .FieldValue
        .serverTimestamp()

      });

    } catch(saveErr){

      console.error(
        "Failed to save failed transaction:",
        saveErr.message
      );
    }

    // ===============================
    // RETURN CLEAN ERROR
    // ===============================

    return res.status(500).json({

      success: false,

      error:
      "Transaction failed. Wallet refunded."

    });
  }
};
