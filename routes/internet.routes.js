const express = require("express");

const router = express.Router();

const {
  subscribeInternet,
  getInternetStatus
} = require(
  "../controllers/internet.controller"
);

router.post(
  "/subscribe",
  subscribeInternet
);


router.get(
  "/status/:voucherCode",
  getInternetStatus
);

module.exports = router;
