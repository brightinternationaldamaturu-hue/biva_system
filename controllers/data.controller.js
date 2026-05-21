const axios = require("axios");
const { db, admin } = require("../config/firebase");

/**
 * ======================================
 * BUY DATA (SECURED FINTECH VERSION)
 * ======================================
 */

exports.buyData = async (req, res) => {

  let sellingAmount = 0;
  let userRef = null;
  let transactionRef = null;

  try {

    const {
      userId,
      phone,
      data_plan,
      network_id
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (
      !userId ||
      !phone ||
      !data_plan ||
      !network_id
    ) {

      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });

    }

    // ===============================
    // USER
    // ===============================

    userRef =
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

    // ===============================
    // GET PLANS
    // ===============================

    const planRes = await axios.get(
      "https://iacafe.com.ng/devapi/v1/budget-data/plans",
      {
        params: { network_id },
        headers: {
          Authorization:
            `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    const plans =
      planRes.data?.data || [];

    const selectedPlan =
      plans.find(
        p =>
          String(p.data_plan) ===
          String(data_plan)
      );

    if (!selectedPlan) {

      return res.status(400).json({
        success: false,
        error: "Invalid data plan"
      });

    }

    // ===============================
    // PRICE
    // ===============================

    const originalAmount = Number(
      selectedPlan.api_user_price ||
      selectedPlan.reseller_price ||
      selectedPlan.price ||
      0
    );

    let profit = 0;

    if (originalAmount <= 300) {
      profit = 13;
    }
    else if (originalAmount <= 1000) {
      profit = 50;
    }
    else if (originalAmount <= 2000) {
      profit = 65;
    }
    else if (originalAmount <= 3500) {
      profit = 100;
    }
    else if (originalAmount <= 5000) {
      profit = 150;
    }
    else {
      profit = 200;
    }

    sellingAmount =
      originalAmount + profit;

    // ===============================
    // BALANCE CHECK
    // ===============================

    if (
      Number(userData.wallet || 0) <
      sellingAmount
    ) {

      return res.status(400).json({
        success: false,
        error: "Insufficient balance"
      });

    }

    // ===============================
    // NETWORK NAME
    // ===============================

    const networkMap = {
      "1": "MTN",
      "2": "GLO",
      "3": "AIRTEL",
      "4": "9MOBILE"
    };

    // ===============================
    // REQUEST ID
    // ===============================

    const request_id =
      "BD_" + Date.now();

    // ===============================
    // CREATE PENDING TRANSACTION
    // ===============================

    transactionRef =
      db.collection("transactions")
      .doc(request_id);

    await transactionRef.set({

      request_id,

      userId,

      email:
        userData.email || "",

      fullName:
        userData.fullName || "",

      phone,

      type: "data",

      status: "pending",

      network:
        networkMap[
          String(network_id)
        ] || "Unknown",

      network_id,

      data_plan,

      plan:
        selectedPlan.plan_name ||
        selectedPlan.name ||
        "Data Plan",

      originalAmount,

      profit,

      amount:
        sellingAmount,

      amountCharged:
        sellingAmount,

      refunded: false,

      provider: "IACAFE",

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });

    // ===============================
    // DEDUCT WALLET
    // ===============================

    await userRef.update({

      wallet:
        admin.firestore
        .FieldValue
        .increment(-sellingAmount)

    });

    // ===============================
    // SEND TO IACAFE
    // ===============================

    const response = await axios.post(
      "https://iacafe.com.ng/devapi/v1/budget-data",
      {
        request_id,
        phone,
        data_plan,
        network_id
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.IACAFE_API_KEY}`,
          "Content-Type":
            "application/json"
        }
      }
    );

    const result =
      response.data;

    console.log(
      "IACAFE RESPONSE:",
      result
    );

    // ===============================
    // SUCCESS CHECK
    // ===============================

    const success =
      result?.success === true ||
      result?.code === "success";

    // ===============================
    // SUCCESS
    // ===============================

    if (success) {

      // UPDATE TRANSACTION

      await transactionRef.update({

        status: "success",

        response: result,

        completedAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });

      // ===============================
      // CASHBACK
      // ===============================

      const cashback =
        Math.floor(
          sellingAmount * 0.01
        );

      await userRef.update({

        cashbackBalance:
          admin.firestore
          .FieldValue
          .increment(cashback)

      });

      // SAVE CASHBACK TRANSACTION

      await db.collection("transactions")
      .add({

        userId,

        type: "cashback",

        status: "success",

        amount: cashback,

        description:
          `1% cashback from ${selectedPlan.plan_name || "Data Purchase"}`,

        createdAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });

      return res.json({

        success: true,

        message:
          `Data purchase successful. You earned ₦${cashback} cashback 🎉`,

        cashback,

        amountCharged:
          sellingAmount,

        data: result

      });

    }

    // ===============================
    // IF FAILED
    // ===============================

    throw new Error(
      result?.message ||
      "Data purchase failed"
    );

  }

  catch (err) {

    console.log(
      "BUY DATA ERROR:",
      err.message
    );

    // ===============================
    // REFUND USER
    // ===============================

    try {

      if (
        userRef &&
        transactionRef &&
        sellingAmount > 0
      ) {

        // CHECK TRANSACTION

        const txSnap =
          await transactionRef.get();

        const txData =
          txSnap.data();

        // REFUND ONLY ONCE

        if (
          txData &&
          txData.refunded !== true
        ) {

          // REFUND WALLET

          await userRef.update({

            wallet:
              admin.firestore
              .FieldValue
              .increment(sellingAmount)

          });

          // UPDATE TRANSACTION

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
        err.message ||
        "Data purchase failed"

    });

  }

};
