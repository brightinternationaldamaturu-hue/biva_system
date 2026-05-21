const express = require("express");

const router = express.Router();

const {

  buyVoucher

} = require(

  "../controllers/voucher.controller"

);

router.post(

  "/voucher/buy",

  buyVoucher

);

module.exports = router;
