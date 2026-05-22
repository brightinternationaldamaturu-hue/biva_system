require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const electricityRoutes = require("./routes/electricity.routes");
const checkPendingTransactions = require("./services/pendingChecker");
const cashbackRoutes = require("./routes/cashback.routes");


// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api", require("./routes/airtime.routes"));
app.use("/api", require("./routes/wallet.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/vtu", require("./routes/vtu.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/data", require("./routes/data.routes"));
app.use("/api",require("./routes/flutterwave.webhook.routes"));
app.use("/api/electricity",electricityRoutes);
app.use("/api", require("./routes/voucher.routes"));
app.use("/", cashbackRoutes);
// VIRTUAL ACCOUNT ROUTE
app.use(
  "/api",
  require("./routes/virtualaccount.routes")
);

// FRONTEND
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public/index.html")
  );
});

// SERVER
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );

});

console.log("ENV LOADED:", {

  iacafe:
    process.env.IACAFE_API_KEY
      ? "SET"
      : "MISSING",

  flutterwave:
    process.env.FLW_SECRET_KEY
      ? "SET"
      : "MISSING"

});


app.get("/test", (req, res) => {
  res.send("Backend working successfully");
});


// RUN EVERY 2 MINUTES

// RUN IMMEDIATELY ON SERVER START

checkPendingTransactions();

// RUN EVERY 2 MINUTES

setInterval(() => {

  checkPendingTransactions();

}, 120000);
