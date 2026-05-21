const axios = require("axios");
const { db, admin } = require("../config/firebase");

async function checkPendingTransactions() {

  try {

    console.log("🔄 Checking pending transactions...");

    const snapshot = await db
      .collection("transactions")
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {

      console.log("✅ No pending transactions");

      return;

    }

    for (const doc of snapshot.docs) {

      const tx = doc.data();

      try {

        // =========================
        // CHECK PROVIDER STATUS
        // =========================

        const response = await axios.get(

          "https://iacafe.com.ng/devapi/v1/history",

          {
            headers: {
              Authorization:
                `Bearer ${process.env.IACAFE_API_KEY}`
            }
          }

        );

        const histories =
          response.data?.data || [];

        const providerTx =
          histories.find(

            item =>

              item.request_id === tx.request_id ||

              item.ref === tx.request_id

          );

        if (!providerTx) {

          console.log(
            `⏳ Still pending: ${tx.request_id}`
          );

          continue;

        }

        const providerStatus = (

          providerTx.status ||

          ""

        ).toLowerCase();

        // =========================
        // SUCCESS
        // =========================

        if (

          providerStatus === "completed" ||

          providerStatus === "completed-api" ||

          providerStatus === "success"

        ) {

          await doc.ref.update({

            status: "success",

            updatedAt:
              admin.firestore
              .FieldValue
              .serverTimestamp()

          });

          console.log(
            `✅ SUCCESS UPDATED: ${tx.request_id}`
          );

        }

        // =========================
        // FAILED
        // =========================

        else if (

          providerStatus === "failed" ||

          providerStatus === "cancelled"

        ) {

          // REFUND USER

          const userRef =
            db.collection("users")
            .doc(tx.userId);

          await userRef.update({

            wallet:
              admin.firestore
              .FieldValue
              .increment(tx.amount)

          });

          // UPDATE TX

          await doc.ref.update({

            status: "failed",

            refunded: true,

            updatedAt:
              admin.firestore
              .FieldValue
              .serverTimestamp()

          });

          console.log(
            `💸 REFUNDED: ${tx.request_id}`
          );

        }

      }

      catch (err) {

        console.log(

          `❌ ERROR CHECKING ${tx.request_id}:`,

          err.message

        );

      }

    }

  }

  catch (err) {

    console.log(
      "PENDING CHECKER ERROR:",
      err.message
    );

  }

}

module.exports = checkPendingTransactions;