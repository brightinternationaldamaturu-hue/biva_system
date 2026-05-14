const { db, admin } = require("../config/firebase");

exports.flutterwaveWebhook = async (req, res) => {

  try {

    const payload = req.body;

    console.log(
      "FLW WEBHOOK:",
      JSON.stringify(payload, null, 2)
    );

    // VERIFY EVENT
    if (
      payload.event !== "BANK_TRANSFER_TRANSACTION"
    ) {

      return res
        .status(200)
        .send("Ignored");

    }

    const data = payload.data;

    const amount =
      Number(data.amount || 0);

    const accountNumber =
      data.account_number;

    const txRef =
      data.tx_ref ||
      data.flw_ref ||
      `TX-${Date.now()}`;

    // FIND USER WITH ACCOUNT NUMBER
    const usersSnap =
      await db.collection("users")
      .where(
        "virtualAccount.accountNumber",
        "==",
        accountNumber
      )
      .limit(1)
      .get();

    if (usersSnap.empty) {

      console.log(
        "No user found for account:",
        accountNumber
      );

      return res
        .status(200)
        .send("User not found");

    }

    const userDoc =
      usersSnap.docs[0];

    const userData =
      userDoc.data();

    const userRef =
      userDoc.ref;

    // PREVENT DUPLICATE FUNDING
    const existingTx =
      await db
        .collection("transactions")
        .where("reference", "==", txRef)
        .limit(1)
        .get();

    if (!existingTx.empty) {

      console.log(
        "Duplicate transaction ignored"
      );

      return res
        .status(200)
        .send("Duplicate");

    }

    // UPDATE WALLET
    const currentBalance =
      Number(userData.wallet || 0);

    const newBalance =
      currentBalance + amount;

    await userRef.update({

      wallet: newBalance

    });

    // SAVE TRANSACTION
    await db.collection(
      "transactions"
    ).add({

      userId: userDoc.id,

      email:
        userData.email || "",

      type: "wallet-funding",

      amount,

      reference: txRef,

      method: "bank-transfer",

      status: "success",

      description:
        "Wallet funded via virtual account",

      createdAt:
        admin.firestore.FieldValue
          .serverTimestamp()

    });

    console.log(
      `Wallet funded successfully: ₦${amount}`
    );

    return res
      .status(200)
      .send("Webhook processed");

  } catch (error) {

    console.log(error);

    return res
      .status(500)
      .send("Webhook error");

  }

};