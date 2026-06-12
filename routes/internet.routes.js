const express = require("express");

const router = express.Router();

const {
  subscribeInternet,
  getInternetStatus,
  authorizeClient
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



router.post(
  "/authorize-client",
  authorizeClient
);




module.exports = router;
