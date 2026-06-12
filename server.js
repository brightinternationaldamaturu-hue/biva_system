require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const electricityRoutes = require("./routes/electricity.routes");
const cashbackRoutes = require("./routes/cashback.routes");
const accountRoutes = require("./routes/account.routes");
const deviceRoutes = require("./routes/device.routes");
const { startInternetUsageSync} = require("./services/internetUsageSync");




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
app.use("/api/account", accountRoutes );
app.use("/api", require("./routes/voucher.routes"));
app.use("/", cashbackRoutes);
app.use( "/api", require("./routes/virtualaccount.routes"));
app.use("/api/internet", require("./routes/internet.routes"));
app.use("/api", require("./routes/device.routes"));
app.use( "/api",require("./routes/subscription.routes"));
app.use("/api", require("./routes/omada.routes"));
app.use("/api/device", deviceRoutes);

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

  startInternetUsageSync();

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
