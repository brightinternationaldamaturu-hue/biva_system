const axios = require("axios");
const { db, admin } = require("../config/firebase");

exports.createVirtualAccount = async (req, res) => {

  try {

    const { uid, email, fullName, phone } = req.body;

    if (!uid || !email || !fullName) {

      return res.status(400).json({
        error: "Missing fields"
      });

    }

    // CHECK IF USER ALREADY HAS ACCOUNT
    const userRef = db.collection("users").doc(uid);

    const userSnap = await userRef.get();

    if (!userSnap.exists) {

      return res.status(404).json({
        error: "User not found"
      });

    }

    const userData = userSnap.data();

    if (userData.virtualAccount) {

      return res.json({
        success: true,
        virtualAccount: userData.virtualAccount
      });

    }

console.log(response.data);

    // CREATE FLUTTERWAVE ACCOUNT
    const response = await axios.post(

      `${process.env.FLW_BASE_URL}/virtual-account-numbers`,

      {
        email,
        is_permanent: true,
        bvn: "22222222222",
        tx_ref: `BIVA-${Date.now()}`,
        firstname: fullName.split(" ")[0],
        lastname: fullName.split(" ")[1] || "USER",
        narration: "BIVA Wallet",
        phone_number: phone || "08000000000"
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }

    );

    const account = response.data.data;

const virtualAccount = {

  accountNumber:
    account.account_number || "",

  accountName:
    account.account_name ||
    `${fullName}`,

  bankName:
    account.bank_name || ""

};




    // SAVE TO FIRESTORE
    await userRef.update({

      virtualAccount

    });

    return res.json({

      success: true,
      virtualAccount

    });

  } catch (error) {

    console.log(error.response?.data || error);

    return res.status(500).json({

      error: "Failed to create account"

    });

  }

};
