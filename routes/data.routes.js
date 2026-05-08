const express = require("express");
const router = express.Router();
const { buyData } = require("../controllers/data.controller");

// BUY DATA
router.post("/buy", buyData);

// GET PLANS
router.get("/plans/:network", async (req, res) => {
  try {
    const axios = require("axios");

    const response = await axios.get(
      "https://iacafe.com.ng/devapi/v1/variations",
      {
        params: {
          product: "data",
          service_id: req.params.network
        },
        headers: {
          Authorization: `Bearer ${process.env.IACAFE_API_KEY}`
        }
      }
    );

    return res.json({
      success: true,
      data: response.data?.data || []
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load plans"
    });
  }
});

module.exports = router;