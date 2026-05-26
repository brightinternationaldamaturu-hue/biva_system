const axios = require("axios");
const { db, admin } = require("../config/firebase");



// ===============================
// OFFICIAL VOUCHER PLANS
// ===============================

const voucherPlans = [

  { price:150, desc:"1GB" },
  { price:300, desc:"2GB" },
  { price:450, desc:"3GB" },
  { price:600, desc:"4GB" },
  { price:900, desc:"6GB" },
  { price:1050, desc:"7GB" },
  { price:1200, desc:"8GB" },
  { price:1500, desc:"10GB" },
  { price:2250, desc:"15GB" },
  { price:3000, desc:"20GB" },
  { price:3750, desc:"25GB" },
  { price:5400, desc:"36GB" },
  { price:9750, desc:"65GB" },
  { price:15000, desc:"100GB" },
  { price:16500, desc:"120GB" },
  { price:17500, desc:"150GB" },
  { price:25000, desc:"200GB" },
  { price:30000, desc:"Unlimited" }

];


// ===============================
// BUY VOUCHER
// ===============================

exports.buyVoucher = async (req, res) => {

  let amountToCharge = 0;

  let userRef = null;

  let transactionRef = null;

  try {

    const {

      userId,
      desc

    } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (

      !userId ||
      !desc

    ) {

      return res.status(400).json({

        success:false,

        error:"Missing fields"

      });

    }

    // =========================
    // FIND PLAN
    // =========================

    const selectedPlan =

      voucherPlans.find(

        p => p.desc === desc

      );

    if (!selectedPlan) {

      return res.status(400).json({

        success:false,

        error:"Invalid voucher plan"

      });

    }

    amountToCharge =

      Number(selectedPlan.price);


      const balanceBefore = Number(userData.wallet || 0);
const balanceAfter = balanceBefore - amountToCharge;

    // =========================
    // USER
    // =========================

    userRef =

      db.collection("users")
      .doc(userId);

    const userSnap =

      await userRef.get();

    if (!userSnap.exists) {

      return res.status(404).json({

        success:false,

        error:"User not found"

      });

    }

    const userData =

      userSnap.data();

    // =========================
    // BALANCE CHECK
    // =========================

    if (

      Number(userData.wallet || 0) <
      amountToCharge

    ) {

      return res.status(400).json({

        success:false,

        error:"Insufficient balance"

      });

    }

    // =========================
    // REQUEST ID
    // =========================

    const request_id =

      "VOUCHER_" + Date.now();

    // =========================
    // CREATE PENDING TX
    // =========================

    transactionRef =

      db.collection("transactions")
      .doc(request_id);

    await transactionRef.set({

      request_id,

      userId,

      email:
        userData.email || "",

      fullName:
        userData.fullName || "",

      type:"voucher",

      category:"voucher",

      title:
        `${desc} Voucher`,

      amount:
        amountToCharge,

      plan:
        desc,
        
      balanceBefore,
      balanceAfter,
      status:"pending",


      refunded:false,

      provider:"BIVA",

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });

    // =========================
    // DEDUCT WALLET
    // =========================

    await userRef.update({

      wallet:
        admin.firestore
        .FieldValue
        .increment(-amountToCharge)

    });

    // =========================
    // GENERATE VOUCHER
    // =========================

    const response = await axios.post(

      "https://hook.us2.make.com/pm61x9gphx81e59lrvy1q7tmnfsd7ggo",

      {

        plan: desc,

        price: amountToCharge,

        email:
          userData.email,

        txId:
          request_id

      }

    );

    const result = response.data;

    console.log(
      "VOUCHER RESPONSE:",
      result
    );

    // =========================
    // CHECK RESPONSE
    // =========================

    if (

      !result ||
      !result.voucher

    ) {

      throw new Error(
        "Voucher generation failed"
      );

    }

    const voucherCode =

      result.voucher;

    // =========================
    // SAVE VOUCHER
    // =========================

    await db.collection("vouchers")
    .doc(voucherCode)
    .set({

      code:
        voucherCode,

      plan:
        desc,

      amount:
        amountToCharge,

      used:false,

      userId,

      email:
        userData.email,

      createdAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });

    // =========================
    // SUCCESS TX
    // =========================

    await transactionRef.update({

      status:"success",

      voucher:
        voucherCode,

      response:
        result,

      completedAt:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });




    // =========================
// CASHBACK
// =========================

// 10% cashback

const cashback =

  Math.floor(
    amountToCharge * 0.10
  );

// ADD TO USER

await userRef.update({

  cashbackBalance:
    admin.firestore
    .FieldValue
    .increment(cashback)

});

// SAVE CASHBACK TX

await db.collection(
  "transactions"
).add({

  userId,

  type: "cashback",

  category: "cashback",

  title: "Voucher Cashback",

  amount: cashback,

  status: "success",

  description:
    `10% cashback from ${desc} voucher purchase`,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


    // =========================
    // RESPONSE
    // =========================

    return res.json({

      success:true,

      message:
        `Voucher generated successfully. Cashback ₦${cashback} earned 🎉`,

      voucher:
        voucherCode,

      cashback,

      amount:
        amountToCharge

    });

  }

  catch(err){

    console.log(
      "VOUCHER ERROR:",
      err.message
    );

    // =========================
    // REFUND
    // =========================

    try {

      if (

        userRef &&
        transactionRef &&
        amountToCharge > 0

      ) {

        const txSnap =

          await transactionRef.get();

        const txData =
          txSnap.data();

        if (

          txData &&
          txData.refunded !== true &&
          txData.status !== "success"

        ) {

          // MARK FAILED

          await transactionRef.update({

            status:"failed",

            refunded:true,

            failureReason:
              err.message || "Unknown error",

            failedAt:
              admin.firestore
              .FieldValue
              .serverTimestamp()

          });

          // REFUND

          await userRef.update({

            wallet:
              admin.firestore
              .FieldValue
              .increment(amountToCharge)

          });

        }

      }

    }

    catch(refundErr){

      console.log(
        "REFUND ERROR:",
        refundErr.message
      );

    }

    return res.status(500).json({

      success:false,

      error:
        err.message || "Voucher failed"

    });

  }

};
