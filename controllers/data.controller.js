const axios = require("axios");
const { db, admin } = require("../config/firebase");

/**
 * =========================
 * NETWORK MAP
 * =========================
 */
const networkNames = {
  "1": "MTN",
  "2": "GLO",
  "3": "AIRTEL",
  "4": "9MOBILE"
};

/**
 * =========================
 * BUY DATA
 * =========================
 */
exports.buyData = async (req, res) => {
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

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const userData = userSnap.data();

    const planRes = await axios.get(
      "https://iacafe.com.ng/devapi/v1/budget-data/plans",
      {
        params: { network_id },
        headers: {
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    const plans = planRes.data?.data || [];

    const selectedPlan = plans.find(
      p => String(p.data_plan) === String(data_plan)
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

    if (originalAmount <= 300) profit = 13;
    else if (originalAmount <= 1000) profit = 50;
    else if (originalAmount <= 2000) profit = 65;
    else if (originalAmount <= 3500) profit = 100;
    else if (originalAmount <= 5000) profit = 150;
    else profit = 200;

    const sellingAmount = originalAmount + profit;

    if (Number(userData.wallet) < sellingAmount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient balance"
      });
    }

    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(-sellingAmount)
    });

    const request_id =
      "BD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

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
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = response.data;

    const success =
      result?.success === true || result?.code === "success";

    if (!success) {
      throw new Error(result?.message || "Purchase failed");
    }

    const cleanPlanName =
      selectedPlan.name ||
      selectedPlan.plan_name ||
      selectedPlan.plan ||
      selectedPlan.size ||
      selectedPlan.description ||
      "Data Plan";

    const cashback = Math.floor(sellingAmount * 0.01);

    // =========================
    // MAIN TRANSACTION
    // =========================
    await db.collection("transactions").doc(request_id).set({
      userId,
      email: userData.email || "",
      fullName: userData.fullName || "",
      phone,

      type: "data",

      network: networkNames[String(network_id)] || "Unknown",
      plan: cleanPlanName,

      network_id,
      data_plan,

      originalAmount,
      profit,

      amount: sellingAmount,
      amountCharged: sellingAmount,

      status: "success",

      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // =========================
    // CASHBACK UPDATE
    // =========================
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(cashback)
    });

    // =========================
    // CASHBACK TRANSACTION
    // =========================
    await db.collection("transactions").add({
      userId,
      email: userData.email || "",
      fullName: userData.fullName || "",
      phone,

      type: "cashback",

      network: networkNames[String(network_id)] || "Unknown",
      plan: cleanPlanName,

      amount: cashback,
      amountCharged: cashback,

      description: `1% cashback from ${cleanPlanName}`,

      status: "success",

      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      message: `Data purchase successful. You earned ₦${cashback} cashback 🎉`,
      amountCharged: sellingAmount,
      cashback,
      data: result
    });

  } catch (err) {
    console.error("PURCHASE ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      error: "Data purchase failed",
      details: err.response?.data || err.message
    });
  }
};
