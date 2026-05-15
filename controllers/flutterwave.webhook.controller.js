const { db, admin } = require("../config/firebase");

exports.flutterwaveWebhook = async (req, res) => {

  try {

    console.log(
      "FLW WEBHOOK:",
      JSON.stringify(req.body, null, 2)
    );

    const payload = req.body;


    // VERIFY EVENT
if (
  payload.event !==
  "charge.completed"
) {

  return res
    .status(200)
    .send("Ignored");

}

    const data = payload.data;

    // ONLY SUCCESSFUL
    if (data.status !== "successful") {
      return res
        .status(200)
        .send("Payment not successful");
    }

    const email =
      data.customer?.email;

    const amount =
      Number(data.amount || 0);

    const flwRef =
      data.flw_ref;

    if (!email || !amount) {

      return res.status(400).json({
        error: "Missing data"
      });

    }

    // PREVENT DUPLICATE CREDIT
    const existing =
      await db
      .collection("transactions")
      .where("flwRef", "==", flwRef)
      .get();

    if (!existing.empty) {

      return res
        .status(200)
        .send("Already processed");

    }

    // FIND USER
    const userQuery =
      await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userQuery.empty) {

      console.log("User not found");

      return res
        .status(404)
        .send("User not found");

    }

    const userDoc =
      userQuery.docs[0];

    const userData =
      userDoc.data();

    const currentBalance =
      Number(
        userData.wallet || 0
      );

    const newBalance =
      currentBalance + amount;

    // UPDATE WALLET
    await userDoc.ref.update({

      wallet: newBalance

    });

// SAVE TRANSACTION
await db.collection(
  "transactions"
).add({

  userId: userDoc.id,

  email,

  amount,

  type: "fund",

  status: "successful",

  flwRef,

  paymentType:
    data.payment_type ||

    "bank_transfer",

  reference:
    data.tx_ref ||

    flwRef,

  description:
    "Wallet funded via bank transfer",

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


// ==========================
// ADMIN NOTIFICATION
// ==========================

await db.collection(
  "adminNotifications"
).add({

  title:
    "Wallet Funding",

  message:

`${email} funded wallet with ₦${Number(amount).toLocaleString('en-NG')}`,

  type: "fund",

  read: false,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


    console.log(
      `Wallet funded for ${email}`
    );

    return res
      .status(200)
      .send("Wallet funded");

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      error: "Webhook failed"
    });

  }

};
