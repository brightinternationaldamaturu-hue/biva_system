const router = require("express").Router();
const payment = require("../controllers/payment.controller");

router.post("/verify", payment.verifyPayment);

module.exports = router;