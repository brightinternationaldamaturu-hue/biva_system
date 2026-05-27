const axios = require("axios");
const { db, admin } = require("../config/firebase");

const { sendAdminNotification } = require( "../js/utils/adminNotification" );




exports.buyAirtime = async (req, res) => {

  let amountToCharge = 0;

  let userRef = null;

  let transactionRef = null;

  try {

    const {

      phone,
      network,
      amount,
      email

    } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (

      !phone ||
      !network ||
      !amount ||
      !email

    ) {

      return res.status(400).json({

        success: false,

        error: "Missing fields"

      });

    }

    // =========================
    // NETWORK MAP
    // =========================

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

    // =========================
    // USER
    // =========================

    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {

      return res.status(404).json({

        success: false,

        error: "User not found"

      });

    }

    const userDoc =
      snapshot.docs[0];

    userRef =
      userDoc.ref;

    const userData =
      userDoc.data();

    amountToCharge =
      Number(amount);


      const balanceBefore =
  Number(userData.wallet || 0);

const balanceAfter =
  balanceBefore - amountToCharge;

    // =========================
    // BALANCE CHECK
    // =========================

    if (

      Number(userData.wallet || 0) <
      amountToCharge

    ) {

      return res.status(400).json({

        success: false,

        error: "Insufficient balance"

      });

    }

    // =========================
    // REQUEST ID
    // =========================

    const request_id =
      "AIRTIME_" + Date.now();

    // =========================
    // CREATE PENDING TX
    // =========================

    transactionRef =
      db.collection("transactions")
      .doc(request_id);

await transactionRef.set({

  request_id,

  userId:
    userDoc.id,

  email,

  fullName:
    userData.fullName || "",

  type: "airtime",

  category: "airtime",

  title:
    `${network} Airtime`,

  network,

  phone,

  amount:
    amountToCharge,

  balanceBefore,

  balanceAfter,

  status: "pending",

  refunded: false,

  provider: "IACAFE",

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});

    // =========================
    // DEDUCT WALLET
    // =========================

    await userRef.update({

      wallet:
        admin.firestore
        .FieldValue
        .increment(-amountToCharge)

    });

    // =========================
    // SEND API REQUEST
    // =========================

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

        amount:
          amountToCharge,

        ref:
          request_id

      }

    );

    const result =
      response.data;

    console.log(
      "AIRTIME RESPONSE:",
      result
    );

    // =========================
    // STATUS CHECK
    // =========================

    const providerStatus = (

      result?.data?.status ||

      ""

    ).toLowerCase();

    const providerCode = (

      result?.code ||

      ""

    ).toLowerCase();

    // =========================
    // PENDING
    // =========================

    if (

      providerStatus === "pending" ||

      providerStatus === "processing"

    ) {

      await transactionRef.update({

        status: "pending",

        response: result,

        updatedAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });

      return res.json({

        success: true,

        pending: true,

        message:
          "Airtime transaction processing",

        data: result

      });

    }

    // =========================
    // SUCCESS
    // =========================

    const success =

      providerCode === "success" &&

      (

        providerStatus === "completed-api" ||

        providerStatus === "completed"

      );

    if (success) {

      await transactionRef.update({

        status: "success",

        response: result,

        completedAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });

      // =========================
      // CASHBACK
      // =========================

      const cashback =

        Math.floor(
          amountToCharge * 0.02
        );

      await userRef.update({

        cashbackBalance:
          admin.firestore
          .FieldValue
          .increment(cashback)

      });

      // SAVE CASHBACK TX

      await db.collection(
        "transactions"
      ).add({

        userId:
          userDoc.id,

        email,

        type: "cashback",

        category: "cashback",

        title:
          "Cashback Reward",

        amount:
          cashback,

        status:
          "success",

        description:
          `2% cashback from ${network} airtime purchase`,

        createdAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });



// =========================
// RESPONSE
// =========================

return res.json({

  success: true,

  message:
    `Airtime successful. Cashback ₦${cashback} earned 🎉`,

  cashback,

  data: result

});

}


    // =========================
    // FAILED
    // =========================

    throw new Error(

      result?.message ||

      "Airtime purchase failed"

    );

  }

  catch (err) {

    console.log(
      "AIRTIME ERROR:",
      err.message
    );

    // =========================
    // REFUND
    // =========================

    try {

      if (

        userRef &&
        transactionRef &&
        amountToCharge > 0

      ) {

        const txSnap =
          await transactionRef.get();

        const txData =
          txSnap.data();

if (

  txData &&

  txData.refunded !== true &&

  txData.status !== "success"

) {

          // MARK FAILED

          await transactionRef.update({

            status: "failed",

            refunded: true,

            failureReason:
              err.message || "Unknown error",

            failedAt:
              admin.firestore
              .FieldValue
              .serverTimestamp()

          });

          // REFUND WALLET

          await userRef.update({

            wallet:
              admin.firestore
              .FieldValue
              .increment(amountToCharge)

          });

        }

      }

    }

    catch (refundErr) {

      console.log(
        "REFUND ERROR:",
        refundErr.message
      );

    }

    return res.status(500).json({

      success: false,

      error:
        err.message || "Airtime failed"

    });

  }

};
