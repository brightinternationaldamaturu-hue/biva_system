const express = require("express");

const router = express.Router();

const {
  buyData,
  getPlans
} = require("../controllers/data.controller");

// BUY DATA
router.post("/buy", buyData);

// GET PLANS
router.get("/plans/:network_id", getPlans);

router.post(
  "/withdraw-cashback",
  dataController.withdrawCashback
);

module.exports = router;
