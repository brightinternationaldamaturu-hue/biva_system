const axios = require("axios");
const { db, admin } = require("../config/firebase");
const { sendAdminNotification } = require( "../js/utils/adminNotification" );



/**
 * ======================================
 * GET DATA PLANS
 * ======================================
 */
exports.getPlans = async (req, res) => {

  try {

    const { network_id } = req.params;

    const response = await axios.get(
      "https://iacafe.com.ng/devapi/v1/budget-data/plans",
      {
        params: { network_id },
        headers: {
          Authorization:
            `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    const rawPlans =
      response.data?.data || [];

    const plans = rawPlans.map(plan => {

      const basePrice = Number(
        plan.api_user_price ||
        plan.reseller_price ||
        plan.price ||
        0
      );

      let profit = 0;

      if (basePrice <= 300) {
        profit = 13;
      }
      else if (basePrice <= 1000) {
        profit = 50;
      }
      else if (basePrice <= 2000) {
        profit = 65;
      }
      else if (basePrice <= 3500) {
        profit = 100;
      }
      else if (basePrice <= 5000) {
        profit = 150;
      }
      else {
        profit = 200;
      }

      const selling_price =
        basePrice + profit;

      return {

        ...plan,

        original_price:
          basePrice,

        selling_price,

        cashback:
          Math.floor(
            selling_price * 0.01
          )

      };

    });

    return res.json({

      success: true,

      data: plans

    });

  }

  catch (err) {

    console.log(err.message);

    return res.status(500).json({

      success: false,

      error: "Failed to load plans"

    });

  }

};


/**
 * ======================================
 * BUY DATA (SECURED)
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

        error:
          "Missing required fields"

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
    // GET PLAN
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

      const balanceBefore =
  Number(userData.wallet || 0);

const balanceAfter =
  balanceBefore - sellingAmount;

    // ===============================
    // BALANCE CHECK
    // ===============================

    if (
      Number(userData.wallet || 0) <
      sellingAmount
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Insufficient balance"

      });

    }

    // ===============================
    // NETWORK MAP
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

      category: "data",

      title:
        `${networkMap[String(network_id)]} Data`,

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

        balanceBefore,
        balanceAfter,

      refunded: false,

      provider: "IACAFE",

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });

    // ===============================
    // DEDUCT WALLET FIRST
    // ===============================

    await userRef.update({

      wallet:
        admin.firestore
        .FieldValue
        .increment(-sellingAmount)

    });

    // ===============================
    // SEND API REQUEST
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

const apiStatus = (
  result?.status ||
  result?.data?.status ||
  ""
).toLowerCase();

const success =

  apiStatus === "completed" ||

  apiStatus === "successful" ||

  apiStatus === "success" ||

  apiStatus === "delivered";



if(

  apiStatus === "pending" ||

  apiStatus === "processing"

){

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
      "Transaction is processing",

    data: result

  });

}


    // ===============================
    // SUCCESS
    // ===============================

    if (success) {

      await transactionRef.update({

        status: "success",

        response: result,

        completedAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });

      // ===============================
      // CASHBACK ONLY ON SUCCESS
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

      // SAVE CASHBACK TX

      await db.collection("transactions")
      .add({

        userId,

        email:
          userData.email || "",

        fullName:
          userData.fullName || "",

        type: "cashback",

        category: "cashback",

        title: "Cashback Reward",

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
    // Admin Notification
    // ===============================

await sendAdminNotification({

  type: "data",

  title:
    `${userData.fullName} bought ₦${sellingAmount} Data`,

  amount:
    sellingAmount,

  reference:
    request_id,

  user: {

    userId,

    fullName:
      userData.fullName,

    email:
      userData.email,

    phone

  },

  extra: {

    network:
      networkMap[String(network_id)],

    phone,

    email:
      userData.email,

    amount:
      sellingAmount,

    plan:
      selectedPlan.plan_name,

    transactionType:
      "data"

  }

});



    // ===============================
    // FAILED
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
    // REFUND
    // ===============================

    try {

      if (
        userRef &&
        transactionRef &&
        sellingAmount > 0
      ) {

        const txSnap =
          await transactionRef.get();

        const txData =
          txSnap.data();

if (

  txData &&

  txData.refunded !== true &&

  txData.status !== "success" &&

  txData.status !== "pending"

)


 {



// MARK FAILED FIRST

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

// THEN REFUND

await userRef.update({

  wallet:
    admin.firestore
    .FieldValue
    .increment(sellingAmount)

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








/**
 * ======================================
 * WITHDRAW CASHBACK
 * ======================================
 */

exports.withdrawCashback = async (req, res) => {

  try {

    const { userId } = req.body;

    const userRef =
      db.collection("users")
      .doc(userId);

    const snap =
      await userRef.get();

    if (!snap.exists) {

      return res.status(404).json({

        success: false,

        error: "User not found"

      });

    }

    const user =
      snap.data();

    const cashback =
      Number(
        user.cashbackBalance || 0
      );

    if (cashback <= 0) {

      return res.status(400).json({

        success: false,

        error:
          "No cashback available"

      });

    }

    await userRef.update({

      wallet:
        admin.firestore
        .FieldValue
        .increment(cashback),

      cashbackBalance: 0

    });

    await db.collection("transactions")
    .add({

      userId,

      email:
        user.email || "",

      fullName:
        user.fullName || "",

      phone:
        user.phone || "",

      type:
        "cashback_withdrawal",

      category:
        "cashback",

      title:
        "Cashback Withdrawal",

      amount:
        cashback,

      status:
        "success",

      description:
        "Cashback moved to wallet",

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });







    try {

  await sendAdminNotification({

    type:
      "cashback_withdrawal",

    title:
      `${user.fullName} withdrew ₦${cashback} Cashback`,

    amount:
      cashback,

    reference:
      `CB_${Date.now()}`,

    user: {

      userId,

      fullName:
        user.fullName,

      email:
        user.email,

      phone:
        user.phone

    },

    extra: {

      email:
        user.email,

      amount:
        cashback,

      transactionType:
        "cashback_withdrawal"

    }

  });

}

catch(notifyErr){

  console.log(

    "ADMIN NOTIFICATION ERROR:",

    notifyErr.message

  );

}




    return res.json({

      success: true,

      message:
        "Cashback withdrawn successfully",

      amount:
        cashback

    });

  }


  

  catch (err) {

    console.log(err);

    return res.status(500).json({

      success: false,

      error:
        err.message

    });

  }

};
