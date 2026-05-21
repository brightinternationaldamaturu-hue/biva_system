const express = require("express");

const router = express.Router();

const {

  getPlans,
  buyData,
  withdrawCashback

} = require("../controllers/data.controller");



// ===============================
// ROUTES
// ===============================

router.get(
  "/plans/:network_id",
  getPlans
);

router.post(
  "/buy",
  buyData
);

router.post(
  "/withdraw-cashback",
  withdrawCashback
);

module.exports = router;
