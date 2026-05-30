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


// ==========================
// REFERRAL BONUS SYSTEM
// ==========================

if (amount >= 800) {

  const userRef = userDoc.ref;

  if (userData?.referredBy && !userData?.referralBonusPaid) {

    const refQuery = await db.collection("users")
      .where("referralCode", "==", userData.referredBy)
      .limit(1)
      .get();

    if (!refQuery.empty) {

      const referrerRef = refQuery.docs[0].ref;

      // CREDIT REFERRER
      await referrerRef.update({
        wallet: admin.firestore.FieldValue.increment(100)
      });


      

// SAVE TRANSACTION
const referrerSnap =
  await referrerRef.get();

const referrerData =
  referrerSnap.data();

const bonusAmount = 100;

const bonusBefore =
  Number(referrerData.wallet || 0);

const bonusAfter =
  bonusBefore + bonusAmount;

await referrerRef.update({
  wallet:
    admin.firestore.FieldValue.increment(100)
});

await db.collection("transactions").add({

  userId:
    referrerRef.id,

  email:
    referrerData.email || "",

  fullName:
    referrerData.fullName || "",

  type:
    "referral_bonus",

  category:
    "referral",

  title:
    "Referral Bonus",

  amount:
    bonusAmount,

  balanceBefore:
    bonusBefore,

  balanceAfter:
    bonusAfter,

  status:
    "success",

  description:
    `Referral bonus from ${email}`,

  createdAt:
    admin.firestore.FieldValue.serverTimestamp()

});

      // MARK PAID
      await userRef.update({
        referralBonusPaid: true
      });
    }
  }
}



    

// SAVE TRANSACTION
await db.collection("transactions").add({

  userId:
    userDoc.id,

  email,

  fullName:
    userData.fullName || "",

  type:
    "funding",

  category:
    "wallet",

  title:
    "Wallet Funding",

  amount,

  balanceBefore:
    currentBalance,

  balanceAfter:
    newBalance,

  status:
    "success",

  flwRef,

  paymentType:
    data.payment_type || "bank_transfer",

  reference:
    data.tx_ref || flwRef,

  description:
    "Wallet funded via bank transfer",

  createdAt:
    admin.firestore.FieldValue.serverTimestamp()

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
