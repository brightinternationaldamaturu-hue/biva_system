const express = require("express");

const router = express.Router();

const {

  buyVoucher

} = require("../controllers/voucher.controller");


// ===============================
// BUY VOUCHER
// ===============================

router.post(

  "/buy-voucher",

  buyVoucher

);


module.exports = router;