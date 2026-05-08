const express = require("express");
const router = express.Router();

const walletController = require("../controllers/wallet.controller");

// IMPORTANT: must be function reference
router.post("/fund", walletController.fundWallet);

module.exports = router;