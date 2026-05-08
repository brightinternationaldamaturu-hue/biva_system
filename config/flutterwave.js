require("dotenv").config();

module.exports = {
  secretKey: process.env.FLW_SECRET_KEY,
  publicKey: process.env.FLW_PUBLIC_KEY
};