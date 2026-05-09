const axios = require("axios");
const { db, admin } = require("../config/firebase");

/**
 * =====================================
 * GET DATA PLANS
 * =====================================
 */

exports.getPlans = async (req, res) => {

  try {

    const { network_id } = req.params;

    console.log("NETWORK ID:", network_id);

    const response = await axios.get(
      "https://iacafe.com.ng/devapi/v1/budget-data/plans",
      {
        params: {
          network_id
        },
        headers: {
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    console.log("IACAFE RESPONSE:", response.data);

    const rawPlans = response.data.data || [];

    /**
     * ADD YOUR PROFIT HERE
     */
    const plans = rawPlans.map(plan => {

      const basePrice = Number(
        plan.api_user_price ||
        plan.reseller_price ||
        plan.price ||
        0
      );

      let profit = 0;

      // SMALL PLANS
      if (basePrice <= 1000) {
        profit = 50;
      }

      // MEDIUM PLANS
      else if (basePrice <= 5000) {
        profit = 100;
      }

      // BIG PLANS
      else {
        profit = 200;
      }

      return {

        ...plan,

        original_price: basePrice,

        selling_price: basePrice + profit
      };
    });

    return res.json({
      success: true,
      data: plans
    });

  } catch (err) {

    console.log(
      "FULL ERROR:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      error: "Failed to load plans"
    });
  }
};



/**
 * =====================================
 * BUY DATA
 * =====================================
 */

exports.buyData = async (req, res) => {

  try {

    const {
      userId,
      phone,
      data_plan,
      network_id
    } = req.body;

    /**
     * VALIDATION
     */
    if (!userId || !phone || !data_plan || !network_id) {

      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    /**
     * GET USER
     */
    const userRef =
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

    /**
     * FETCH PLANS
     */
    const planRes = await axios.get(
      "https://iacafe.com.ng/devapi/v1/budget-data/plans",
      {
        params: {
          network_id
        },
        headers: {
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    console.log(
      "PLANS RESPONSE:",
      planRes.data
    );

    const plans =
      planRes.data?.data || [];

    /**
     * FIND SELECTED PLAN
     */
    const selectedPlan = plans.find(
      p =>
        String(p.data_plan) ===
        String(data_plan)
    );

    console.log(
      "SELECTED PLAN:",
      selectedPlan
    );

    if (!selectedPlan) {

      return res.status(400).json({
        success: false,
        error: "Invalid data plan"
      });
    }

    /**
     * ORIGINAL PRICE
     */
    const originalAmount = Number(
      selectedPlan.api_user_price ||
      selectedPlan.reseller_price ||
      selectedPlan.price ||
      0
    );

    /**
     * ADD YOUR PROFIT
     */
    let profit = 0;

    if (originalAmount <= 1000) {
      profit = 50;
    }

    else if (originalAmount <= 5000) {
      profit = 100;
    }

    else {
      profit = 200;
    }

    const sellingAmount =
      originalAmount + profit;

    /**
     * CHECK WALLET
     */
    if (
      Number(userData.wallet) <
      sellingAmount
    ) {

      return res.status(400).json({
        success: false,
        error: "Insufficient balance"
      });
    }

    /**
     * DEDUCT USER WALLET
     */
    await userRef.update({

      wallet:
        admin.firestore.FieldValue.increment(
          -sellingAmount
        )
    });

    /**
     * GENERATE REQUEST ID
     */
    const request_id =
      "BD_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 1000);

    try {

      /**
       * SEND PURCHASE TO IACAFE
       */
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

      console.log(
        "PURCHASE RESPONSE:",
        response.data
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

      /**
       * SAVE TRANSACTION
       */
      await db.collection("transactions")
        .doc(request_id)
        .set({

          userId,
          phone,

          type: "data",

          network_id,
          data_plan,

          originalAmount,
          profit,
          amountCharged: sellingAmount,

          status: "success",

          response: result,

          createdAt: new Date()
        });

      return res.json({

        success: true,

        message:
          "Data purchase successful",

        amountCharged:
          sellingAmount,

        profit,

        data: result
      });

    } catch (err) {

      console.error(
        "PURCHASE ERROR:",
        err.response?.data || err.message
      );

      /**
       * REFUND USER
       */
      await userRef.update({

        wallet:
          admin.firestore.FieldValue.increment(
            sellingAmount
          )
      });

      return res.status(500).json({

        success: false,

        error:
          "Data purchase failed",

        details:
          err.response?.data ||
          err.message
      });
    }

  } catch (err) {

    console.error(
      "MAIN ERROR:",
      err.message
    );

    return res.status(500).json({

      success: false,

      error: err.message
    });
  }
};