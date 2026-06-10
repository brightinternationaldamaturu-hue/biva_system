const express = require("express");

const router = express.Router();

const {
  subscribeInternet
} = require(
  "../controllers/internet.controller"
);

router.post(
  "/subscribe",
  subscribeInternet
);

module.exports = router;
