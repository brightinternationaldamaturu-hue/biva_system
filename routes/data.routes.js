const express = require("express");

const router = express.Router();

// IMPORT CONTROLLER
const dataController =
  require("../controllers/data.controller");


// ============================
// GET DATA PLANS
// ============================
router.get(
  "/plans/:network_id",
  dataController.getPlans
);


// ============================
// BUY DATA
// ============================
router.post(
  "/buy",
  dataController.buyData
);


// ============================
// WITHDRAW CASHBACK
// ============================
router.post(
  "/withdraw-cashback",
  dataController.withdrawCashback
);


module.exports = router;
