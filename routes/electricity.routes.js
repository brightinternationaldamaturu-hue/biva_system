const express =
require("express");

const router =
express.Router();

const {

  verifyMeter,
  buyElectricity

}

= require(

"../controllers/electricity.controller"

);


// VERIFY
router.post(

  "/verify",

  verifyMeter

);


// BUY
router.post(

  "/buy",

  buyElectricity

);


module.exports =
router;