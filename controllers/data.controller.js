const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.buyData = async (req, res) => {
  try {
    const { userId, phone, service_id, variation_id } = req.body;

    if (!userId || !phone || !service_id || !variation_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userData = userSnap.data();

    // generate unique request id
    const request_id = `DATA_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // STEP 1: GET PLANS FROM IACAFE
    const planRes = await axios.get(
      "https://iacafe.com.ng/devapi/v1/variations",
      {
        params: {
          product: "data",
          service_id
        },
        headers: {
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    const plans = planRes.data?.data || [];

    const plan = plans.find(
      p => String(p.variation_id) === String(variation_id)
    );

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: "Invalid data plan selected"
      });
    }

    const price = Number(plan.price);

    // STEP 2: CHECK WALLET
    if (userData.wallet < price) {
      return res.status(400).json({
        success: false,
        error: "Insufficient balance"
      });
    }

    // STEP 3: DEDUCT WALLET FIRST
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(-price)
    });

    try {
      // STEP 4: CALL IACAFE API
      const response = await axios.post(
        "https://iacafe.com.ng/devapi/v1/data",
        {
          request_id,
          phone,
          service_id,
          variation_id
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
        result?.code === "success" ||
        result?.message?.toLowerCase().includes("completed");

      if (!success) {
        throw new Error("Provider failed");
      }

      // STEP 5: SAVE TRANSACTION
      await db.collection("transactions").doc(request_id).set({
        userId,
        phone,
        service_id,
        variation_id,
        amount: price,
        type: "data",
        status: "success",
        createdAt: new Date()
      });

      return res.json({
        success: true,
        message: "Data purchase successful",
        data: result
      });

    } catch (err) {
      console.error("IACAFE ERROR:", err.response?.data || err.message);

      // STEP 6: REFUND ON FAILURE
      await userRef.update({
        wallet: admin.firestore.FieldValue.increment(price)
      });

      return res.status(500).json({
        success: false,
        error: "Data purchase failed",
        details: err.response?.data || err.message
      });
    }

  } catch (err) {
    console.error("SERVER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};