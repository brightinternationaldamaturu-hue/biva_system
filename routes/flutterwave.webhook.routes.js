const express = require("express");

const router = express.Router();

const {
  flutterwaveWebhook
} = require(
  "../controllers/flutterwave.webhook.controller"
);

router.post(
  "/flutterwave-webhook",
  flutterwaveWebhook
);

module.exports = router;