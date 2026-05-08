const express = require("express");
const router = express.Router();

const { buyAirtime } = require("../controllers/airtime.controller");

// FINAL ROUTE
router.post("/buy-airtime", buyAirtime);

module.exports = router;