const express = require("express");

const router = express.Router();

const {
  createVirtualAccount
} = require(
  "../controllers/virtualaccount.controller"
);

router.post(
  "/create-virtual-account",
  createVirtualAccount
);

module.exports = router;
