const express = require("express");

const router = express.Router();

const {
  deleteAccount
} = require(
  "../controllers/account.controller"
);

router.post(
  "/delete",
  deleteAccount
);

module.exports = router;
