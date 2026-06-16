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

      return res.status(400).json({
        error: "Invalid request"
      });

    }

    const safeAmount =
      toSafeNumber(amount);

    if (!safeAmount || safeAmount <= 0) {

      return res.status(400).json({
        error: "Invalid amount received"
      });

    }

    // CREDIT USER WALLET
    await db.collection("users")
      .doc(userId)
      .update({

        wallet:
          admin.firestore.FieldValue.increment(
            safeAmount
          ),

      });

    // SAVE TRANSACTION
    await db.collection("transactions")
      .add({

        userId,

        amount: safeAmount,

        type: "credit",

        status: "success",

        createdAt:
          admin.firestore.FieldValue.serverTimestamp()

      });



    // =====================
    // REFERRAL BONUS SYSTEM
    // =====================

    // ONLY FOR FIRST FUNDING >= ₦800
    if (safeAmount >= 800) {

      const userDoc = await db
        .collection("users")
        .doc(userId)
        .get();

      const userData =
        userDoc.data();

      // CHECK IF REFERRED
      if (

        userData?.referredBy &&

        !userData?.referralBonusPaid

      ) {

        // FIND REFERRER USING REFERRAL CODE
        const refQuery = await db
          .collection("users")
          .where(
            "referralCode",
            "==",
            userData.referredBy
          )
          .limit(1)
          .get();

        // IF REFERRER EXISTS
        if (!refQuery.empty) {

          const referrerDoc =
            refQuery.docs[0];

          const referrerId =
            referrerDoc.id;

          // CREDIT REFERRER
          await db.collection("users")
            .doc(referrerId)
            .update({

              wallet:
                admin.firestore.FieldValue.increment(100)

            });


          

          // SAVE BONUS TRANSACTION
const referrerData =
  referrerDoc.data();

const balanceBefore =
  Number(referrerData.wallet || 0);

const bonusAmount = 100;

const balanceAfter =
  balanceBefore + bonusAmount;

await db.collection("transactions")
  .add({

    userId: referrerId,

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
      `Referral bonus from ${userData.fullName || "New User"}`,

    createdAt:
      admin.firestore.FieldValue.serverTimestamp()

  });

          // MARK BONUS PAID
          await db.collection("users")
            .doc(userId)
            .update({

              referralBonusPaid: true

            });

        }

      }

    }

    return res.json({

      success: true

    });

  } catch (err) {

    return res.status(500).json({

      error: err.message

    });

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



// =====================
// GET USER WALLET
// =====================
exports.getWallet = async (req, res) => {

  try {

    const { uid } = req.params;

    const doc = await db
      .collection("users")
      .doc(uid)
      .get();

    if (!doc.exists) {

      return res.status(404).json({

        success: false,
        error: "User not found"

      });

    }

    const user = doc.data();

    return res.json({

      success: true,

      wallet:
        Number(user.wallet || 0),

      cashbackBalance:
        Number(
          user.cashbackBalance || 0
        ),

      virtualAccount:
        user.virtualAccount || null,

      referralCode:
        user.referralCode || "",

      referredBy:
        user.referredBy || ""

    });

  } catch (err) {

    return res.status(500).json({

      success: false,
      error: err.message

    });

  }

};









exports.transferWallet = async (req, res) => {

try{

  const {

    senderId,
    recipientPhone,
    amount,
    pin

  } = req.body;

  if(

    !senderId ||
    !recipientPhone ||
    !amount ||
    !pin

  ){

    return res.status(400).json({

      success:false,
      error:"Missing fields"

    });

  }

  const transferAmount =
    Number(amount);

  if(transferAmount <= 0){

    return res.status(400).json({

      success:false,
      error:"Invalid amount"

    });

  }

  // SENDER

  const senderRef =
    db.collection("users")
    .doc(senderId);

  const senderSnap =
    await senderRef.get();

  if(!senderSnap.exists){

    return res.status(404).json({

      success:false,
      error:"Sender not found"

    });

  }

  const sender =
    senderSnap.data();

  if(

    String(sender.transactionPin)
    !== String(pin)

  ){

    return res.status(400).json({

      success:false,
      error:"Invalid PIN"

    });

  }

  if(

    Number(sender.wallet || 0)
    < transferAmount

  ){

    return res.status(400).json({

      success:false,
      error:"Insufficient balance"

    });

  }

  // RECIPIENT

  const recipientQuery =
    await db
    .collection("users")
    .where(
      "phone",
      "==",
      recipientPhone
    )
    .limit(1)
    .get();

  if(recipientQuery.empty){

    return res.status(404).json({

      success:false,
      error:"Recipient not found"

    });

  }

  const recipientDoc =
    recipientQuery.docs[0];

  const recipientId =
    recipientDoc.id;

  const recipient =
    recipientDoc.data();

  if(recipientId === senderId){

    return res.status(400).json({

      success:false,
      error:"Cannot transfer to yourself"

    });

  }

  // WALLET MOVEMENT

  await senderRef.update({

    wallet:
      admin.firestore
      .FieldValue
      .increment(
        -transferAmount
      )

  });

  await db
    .collection("users")
    .doc(recipientId)
    .update({

      wallet:
        admin.firestore
        .FieldValue
        .increment(
          transferAmount
        )

    });

  // SENDER TX

  await db.collection(
    "transactions"
  ).add({

    userId:senderId,

    type:"transfer",

    category:"transfer",

    title:
      `Transfer to ${recipient.fullName}`,

    amount:
      transferAmount,

    status:"success",

    createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

  });

  // RECEIVER TX

  await db.collection(
    "transactions"
  ).add({

    userId:recipientId,

    type:"transfer_received",

    category:"transfer",

    title:
      `Transfer from ${sender.fullName}`,

    amount:
      transferAmount,

    status:"success",

    createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

  });

  return res.json({

    success:true,

    message:
      "Transfer successful",

    recipient:
      recipient.fullName

  });

}
catch(err){

  return res.status(500).json({

    success:false,

    error:err.message

  });

}

};
