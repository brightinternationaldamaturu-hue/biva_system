const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.verifyPayment = async (req, res) => {
  try {

    const { transaction_id } = req.body;

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    const amount = Number(data.amount);
    const email = data.customer.email;
    const tx_ref = data.tx_ref;

    const snapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(404).json({ error: "User not found" });

    const userRef = snapshot.docs[0].ref;
    const processedRef = db.collection("processedPayments").doc(tx_ref);

    const userSnap = await userRef.get();
    const userData = userSnap.data();

    let referrerRef = null;

    if (amount >= 800 && userData?.referredBy) {

      const refQuery = await db.collection("users")
        .where("referralCode", "==", userData.referredBy)
        .limit(1)
        .get();

      if (!refQuery.empty) {
        referrerRef = refQuery.docs[0].ref;
      }
    }

    await db.runTransaction(async (t) => {

      const processed = await t.get(processedRef);
      if (processed.exists) throw new Error("DUPLICATE");

      t.update(userRef, {
        wallet: admin.firestore.FieldValue.increment(amount)
      });

      t.set(processedRef, {
        tx_ref,
        email,
        amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const txRef = db.collection("transactions").doc();

const balanceBefore =
  Number(userData.wallet || 0);

const balanceAfter =
  balanceBefore + amount;

t.set(txRef, {

  userId:
    userRef.id,

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

  balanceBefore,

  balanceAfter,

  status:
    "success",

  tx_ref,

  createdAt:
    admin.firestore.FieldValue.serverTimestamp()

});





try {

  await axios.post(

    "https://hook.us2.make.com/pm61x9gphx81e59lrvy1q7tmnfsd7ggo",

    {

      fullName:
        userData.fullName || "",

      email,

      phone:
        userData.phone || "",

      type:
        "Wallet Funding",

      amount,

      txId:
        tx_ref,

      balanceBefore,

      balanceAfter,

      description:
        "Wallet funded successfully"

    }

  );

}

catch(err){

  console.log(
    "MAKE FUNDING ERROR:",
    err.message
  );

}






      

      // 👉 REFERRAL BONUS
if (referrerRef && !userData.referralBonusPaid) {

  const referrerSnap =
    await t.get(referrerRef);

  const referrerData =
    referrerSnap.data();

  const balanceBefore =
    Number(referrerData.wallet || 0);

  const bonusAmount = 100;

  const balanceAfter =
    balanceBefore + bonusAmount;

  // CREDIT REFERRER
  t.update(referrerRef, {
    wallet:
      admin.firestore.FieldValue.increment(
        bonusAmount
      )
  });

  const bonusRef =
    db.collection("transactions").doc();

  t.set(bonusRef, {

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

    balanceBefore,

    balanceAfter,

    status:
      "success",

    description:
      `Referral bonus from ${userData.fullName || email}`,

    createdAt:
      admin.firestore.FieldValue.serverTimestamp()

  });

  // MARK BONUS PAID
  t.update(userRef, {
    referralBonusPaid: true
  });

}

    });

    return res.json({ success: true, message: "Success" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
