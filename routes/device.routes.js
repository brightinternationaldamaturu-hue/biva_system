const express =
require("express");

const router =
express.Router();

const {
  registerDevice,
  validateDevice
} = require(
  "../controllers/device.controller"
);

router.post(
  "/register",
  registerDevice
);

router.post(
  "/validate",
  validateDevice
);

module.exports =
router;
