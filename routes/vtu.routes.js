const express = require("express");
const router = express.Router();

const dataController = require("../controllers/data.controller");

console.log("CONTROLLER:", dataController); // 🔥 DEBUG

router.post("/data", dataController.buyData);

module.exports = router;