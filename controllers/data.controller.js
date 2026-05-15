const axios = require("axios");
const { db, admin } = require("../config/firebase");

/**
 * ============================
 * GET DATA PLANS
 * ============================
 */
exports.getPlans = async (req, res) => {
  try {
    const { network_id } = req.params;

    const response = await axios.get(
      "https://iacafe.com.ng/devapi/v1/budget-data/plans",
      {
        params: { network_id },
        headers: {
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    const rawPlans = response.data?.data || [];

    const plans = rawPlans.map(plan => {
      const basePrice = Number(
        plan.api_user_price ||
        plan.reseller_price ||
        plan.price ||
        0
      );

      let profit = 0;

      if (basePrice <= 300) profit = 13;
      else if (basePrice <= 1000) profit = 50;
      else if (basePrice <= 2000) profit = 65;
      else if (basePrice <= 3500) profit = 100;
      else if (basePrice <= 5000) profit = 150;
      else profit = 200;

      const selling_price = basePrice + profit;

      return {
        ...plan,
        original_price: basePrice,
        selling_price,
        cashback: Math.floor(selling_price * 0.01)
      };
    });

    return res.json({
      success: true,
      data: plans
    });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to load plans"
    });
  }
};


/**
 * ============================
 * BUY DATA
 * ============================
 */
exports.buyData = async (req, res) => {

  let sellingAmount = 0;
  let userRef = null;

  try {

    const {
      userId,
      phone,
      data_plan,
      network_id
    } = req.body;

    if (!userId || !phone || !data_plan || !network_id) {

      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });

    }

    userRef =
      db.collection("users").doc(userId);

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

    if (
      Number(userData.wallet) <
      sellingAmount
    ) {

      return res.status(400).json({
        success: false,
        error: "Insufficient balance"
      });

    }

    await userRef.update({

      wallet:
        admin.firestore.FieldValue.increment(
          -sellingAmount
        )

    });

    const request_id =
      "BD_" + Date.now();

    const networkMap = {

      "1": "MTN",
      "2": "GLO",
      "3": "AIRTEL",
      "4": "9MOBILE"

    };

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

    const success =
      result?.success === true ||
      result?.code === "success";

    if (!success) {

      throw new Error(
        result?.message ||
        "Purchase failed"
      );

    }

    const cleanPlan =
      result?.data?.plan_name ||
      selectedPlan?.name ||
      selectedPlan?.plan_name ||
      "Data Plan";

    await db.collection("transactions")
    .doc(request_id)
    .set({

      userId,

      email:
        userData.email || "",

      fullName:
        userData.fullName || "",

      phone,

      type: "data",

      status: "success",

      network:
        result?.data?.network ||
        networkMap[
          String(network_id)
        ] ||
        "Unknown",

      plan:
        cleanPlan,

      network_id,

      data_plan,

      originalAmount,

      profit,

      amount:
        sellingAmount,

      amountCharged:
        sellingAmount,

      response:
        result,

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });

    // CASHBACK
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

    await db.collection("transactions")
    .add({

      userId,

      email:
        userData.email || "",

      fullName:
        userData.fullName || "",

      phone,

      type: "cashback",

      status: "success",

      amount:
        cashback,

      amountCharged:
        cashback,

      network:
        result?.data?.network ||
        networkMap[
          String(network_id)
        ] ||
        "Unknown",

      plan:
        cleanPlan,

      description:
        `1% cashback from ${cleanPlan}`,

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

      data:
        result

    });

  } catch (err) {

    console.log(
      "BUY DATA ERROR:",
      err.message
    );

    try {

      if (
        userRef &&
        sellingAmount > 0
      ) {

        await userRef.update({

          wallet:
            admin.firestore
            .FieldValue
            .increment(sellingAmount)

        });

      }

    } catch (refundErr) {

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

exports.withdrawCashback = async (req, res) => {

  try {

    const { userId } = req.body;
    console.log(req.body);

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
        error: "No cashback available"
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

      type:
        "cashback_withdrawal",

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

    return res.json({

      success: true,

      message:
        "Cashback withdrawn successfully",

      amount:
        cashback

    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({

      success: false,

      error:
        err.message

    });

  }

};
