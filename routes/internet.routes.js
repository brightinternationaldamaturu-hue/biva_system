const express = require("express");

const router = express.Router();

const {
  subscribeInternet,
  getInternetStatus,
  activateInternet,
  authorizeClient
} = require(
  "../controllers/internet.controller"
);

router.post(
  "/subscribe",
  subscribeInternet
);


router.post(
  "/activate",
  activateInternet
);


router.post(
  "/authorize-client",
  authorizeClient
);



router.get(
  "/status/:voucherCode",
  getInternetStatus
);



module.exports = router;
