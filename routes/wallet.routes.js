const express = require("express");

const router = express.Router();

const walletController =
  require("../controllers/wallet.controller");

// FUND WALLET
router.post(
  "/fund",
  walletController.fundWallet
);

// CREDIT WALLET
router.post(
  "/credit",
  walletController.creditWallet
);

// GET WALLET
router.get(
  "/wallet/:uid",
  walletController.getWallet
);

module.exports = router;
