const express =
require("express");

const router =
express.Router();

const {
  addDevice
} = require(
  "../controllers/device.controller"
);

router.post(
  "/device/add",
  addDevice
);

module.exports =
router;
