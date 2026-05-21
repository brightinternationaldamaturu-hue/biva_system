const express = require("express");

const router = express.Router();

const {

  getPlans,
  buyData,
  withdrawCashback

} = require("../controllers/data.controller");


// ===============================
// GET PLANS
// ===============================

router.get(
  "/plans/:network_id",
  getPlans
);


// ===============================
// BUY DATA
// ===============================

router.post(
  "/buy",
  buyData
);


// ===============================
// WITHDRAW CASHBACK
// ===============================

router.post(
  "/withdraw-cashback",
  withdrawCashback
);

module.exports = router;
