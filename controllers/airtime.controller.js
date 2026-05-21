const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.buyAirtime = async (req, res) => {
  try {
    const {
  userId,
  phone,
  network,
  amount
} = req.body;

    if (
  !userId ||
  !phone ||
  !network ||
  !amount
) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const networkMap = {
      MTN: "mtn",
      GLO: "glo",
      AIRTEL: "airtel",
      "9MOBILE": "9mobile"
    };

    const networkCode = networkMap[network.toUpperCase()];
    if (!networkCode) {
      return res.status(400).json({ error: "Invalid network" });
    }





// ===============================
// GET USER
// ===============================

const userRef =
  db.collection("users")
  .doc(userId);

const userSnap =
  await userRef.get();

if (!userSnap.exists) {

  return res.status(404).json({

    success: false,

    error: "User not found"

  });

}

const userData =
  userSnap.data();





    // CHECK BALANCE FIRST
    if (userData.wallet < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const txId = "AIRTIME_" + Date.now();

    // STEP 1: DEDUCT WALLET FIRST (SAFE STRATEGY)
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(-amount)
    });

    try {



      // STEP 2: CALL IACAFE (IMPORTANT: USE POST, NOT GET)
      const response = await axios.post(
        "https://iacafe.com.ng/devapi/v1/airtime",
        {
          username: process.env.IACAFE_USERNAME,
          api_key: process.env.IACAFE_API_KEY,
          network: networkCode,
          phone,
          amount,
          ref: txId
        }
      );

      console.log("IACAFE RESPONSE:", response.data);





// STEP 3: SUCCESS CHECK

const providerStatus =
  response.data?.data?.status;

const providerCode =
  response.data?.code;

const success =

  providerCode === "success" &&

  (
    providerStatus === "completed-api" ||
    providerStatus === "completed"
  );

if (!success) {

  console.error(
    "FAILED PROVIDER RESPONSE:",
    response.data
  );

  throw new Error(

    response.data?.message ||

    "Airtime failed at provider"

  );
}


// ==========================
// SAVE AIRTIME TRANSACTION
// ==========================

await db.collection(
  "transactions"
).add({

  userId,

  email,

  type: "airtime",

  network,

  phone,

  amount,

  status: "successful",

  reference: txId,

  description:
    `${network} Airtime Purchase`,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


// ==========================
// AIRTIME CASHBACK
// ==========================

// 2% cashback
const cashback =
  Number(amount) * 0.02;

// SAVE TO CASHBACK BALANCE
await userRef.update({

  cashbackBalance:
    admin.firestore
    .FieldValue
    .increment(cashback)

});

// SAVE CASHBACK TRANSACTION
await db.collection(
  "transactions"
).add({

  userId,

  email,

  type: "cashback",

  amount: cashback,

  status: "successful",

  network,

  phone,

  description:
    `2% cashback from ${network} airtime purchase`,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


// ==========================
// SUCCESS RESPONSE
// ==========================

return res.json({

  success: true,

  message:
    `Airtime sent successfully. You earned ₦${cashback.toFixed(2)} cashback 🎉`

});

    } catch (err) {
      console.error("❌ PROVIDER ERROR:", err.response?.data || err.message);

      // STEP 5: REFUND AUTOMATICALLY ON FAILURE
      await userRef.update({
        wallet: admin.firestore.FieldValue.increment(amount)
      });

      return res.status(500).json({
        success: false,
        error: "Airtime failed",
        details: err.response?.data || err.message
      });
    }

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err.message);

    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
};
