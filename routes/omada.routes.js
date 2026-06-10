const express =
require("express");

const router =
express.Router();

const {
  testOmada
} = require(
  "../controllers/omada.controller"
);

router.get(
  "/omada/test",
  testOmada
);

module.exports =
router;
