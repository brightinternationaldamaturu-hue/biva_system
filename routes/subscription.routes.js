const express =
require("express");

const router =
express.Router();

const {
  expireSubscriptions
} = require(
  "../controllers/subscription.controller"
);

router.get(
  "/subscriptions/expire",
  expireSubscriptions
);

module.exports =
router;
