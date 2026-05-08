const axios = require("axios");
const { db, admin } = require("../config/firebase");
const { username, apiKey } = require("../config/vtu");

// ================= AIRTIME =================
const buyAirtime = async (req, res) => {
  try {
    const { phone, amount, network, userId } = req.body;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const wallet = userDoc.data().wallet || 0;

    if (wallet < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // deduct wallet first
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(-amount)
    });

    const response = await axios.post("https://www.clubkonnect.com/api/", {
      request_id: Date.now(),
      username,
      apiKey,
      service: "AIRTIME",
      phone,
      amount,
      network
    });

    const success = response.data?.status === "success";

    if (!success) {
      await userRef.update({
        wallet: admin.firestore.FieldValue.increment(amount)
      });

      return res.status(400).json({
        error: "Airtime failed",
        details: response.data
      });
    }

    await db.collection("transactions").add({
      userId,
      phone,
      amount,
      network,
      type: "airtime",
      status: "success",
      createdAt: new Date()
    });

    return res.json({
      success: true,
      message: "Airtime sent successfully"
    });

  } catch (err) {
    console.error("AIRTIME ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ================= DATA =================
const buyData = async (req, res) => {
  try {
    const { phone, network, variation_id, price, userId } = req.body;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const wallet = userDoc.data().wallet || 0;

    if (wallet < price) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // deduct wallet first
    await userRef.update({
      wallet: admin.firestore.FieldValue.increment(-price)
    });

    const response = await axios.post(
      "https://iacafe.com.ng/devapi/v1/data",
      {
        username,
        api_key: apiKey,
        variation_id,
        phone,
        request_id: "DATA_" + Date.now()
      }
    );

    console.log("DATA RESPONSE:", response.data);

    const success =
      response.data?.code === "success" ||
      response.data?.data?.status === "completed-api";

    if (!success) {
      await userRef.update({
        wallet: admin.firestore.FieldValue.increment(price)
      });

      return res.status(400).json({
        success: false,
        error: "Data purchase failed",
        details: response.data
      });
    }

    await db.collection("transactions").add({
      userId,
      phone,
      network,
      variation_id,
      amount: price,
      type: "data",
      status: "success",
      createdAt: new Date()
    });

    return res.json({
      success: true,
      message: "Data purchased successfully"
    });

  } catch (err) {
    console.error("DATA ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  buyAirtime,
  buyData
};