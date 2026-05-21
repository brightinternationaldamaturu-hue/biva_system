const express = require("express");

const router = express.Router();

const dataController =
require("../controllers/data.controller");

router.get(
  "/plans/:network_id",
  dataController.getPlans
);

router.post(
  "/buy",
  dataController.buyData
);

router.post(
  "/withdraw-cashback",
  dataController.withdrawCashback
);

module.exports = router;
