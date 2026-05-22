const express = require("express");
const router = express.Router();

const { withdrawCashback } = require("../controllers/cashback.controller");

// CASHBACK WITHDRAW ROUTE
router.post("/withdrawCashback", withdrawCashback);

module.exports = router;