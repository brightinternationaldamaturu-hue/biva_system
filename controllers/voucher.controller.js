const axios = require("axios");
const { db, admin } = require("../config/firebase");
const { sendAdminNotification } = require( "../js/utils/adminNotification" );
const { sendSalesNotification } = require( "../js/utils/sendSalesNotification");



// ===============================
// OFFICIAL VOUCHER PLANS
// ===============================

const voucherPlans = [

  {
    price:150,
    desc:"1GB",
    dataLimit:1073741824
  },

  {
    price:300,
    desc:"2GB",
    dataLimit:2147483648
  },

  {
    price:450,
    desc:"3GB",
    dataLimit:3221225472
  },

  {
    price:500,
    desc:"4GB",
    dataLimit:4294967296
  },

  {
    price:600,
    desc:"6GB",
    dataLimit:6442450944
  },

  {
    price:700,
    desc:"7GB",
    dataLimit:7516192768
  },

  {
    price:800,
    desc:"8GB",
    dataLimit:8589934592
  },

  {
    price:1000,
    desc:"10GB",
    dataLimit:10737418240
  },



  { 
  price: 2250,
  desc: "15GB",
  dataLimit: 16106127360
},

{
  price: 3000,
  desc: "20GB",
  dataLimit: 21474836480
},

{
  price: 3750,
  desc: "25GB",
  dataLimit: 26843545600
},

{
  price: 5400,
  desc: "36GB",
  dataLimit: 38654705664
},

{
  price: 9750,
  desc: "65GB",
  dataLimit: 69793218560
},

{
  price: 15000,
  desc: "100GB",
  dataLimit: 107374182400
},

{
  price: 16500,
  desc: "120GB",
  dataLimit: 128849018880
},

{
  price: 17500,
  desc: "150GB",
  dataLimit: 161061273600
},

{
  price: 25000,
  desc: "200GB",
  dataLimit: 214748364800
},

{
  price: 30000,
  desc: "Unlimited",
  dataLimit: null,
  validityDays: 30
}

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
// BALANCE SNAPSHOT
// =========================

const balanceBefore =
  Number(userData.wallet || 0);

const balanceAfter =
  balanceBefore - amountToCharge;

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
// CASHBACK
// =========================

// 10% cashback

const cashback =

  Math.floor(
    amountToCharge * 0.10
  );



    // =========================
    // GENERATE VOUCHER
    // =========================

    const response = await axios.post(

      "https://hook.us2.make.com/pm61x9gphx81e59lrvy1q7tmnfsd7ggo",

      {

  fullName:
    userData.fullName || "",

  email:
    userData.email || "",

  phone:
    userData.phone || "",

  type:
    "Voucher Purchase",

  plan:
    desc,

  price:
    amountToCharge,

  txId:
    request_id,

  balanceBefore,

  balanceAfter,
  
  cashback,

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




await db
.collection("pendingInternetAccounts")
.add({

  expiryDate:
  selectedPlan.validityDays
    ? new Date(
        Date.now() +
        selectedPlan.validityDays *
        24 *
        60 *
        60 *
        1000
      )
    : null,

  userId,

  voucherCode,

  plan: desc,

  totalDownloadBytes: 0,
  totalUploadBytes: 0,

  lastTrafficBytes: 0,
  lastDownloadBytes: 0,
  lastUploadBytes: 0,
  omadaValid: true,

  amount:
  amountToCharge,

  dataLimit:
    selectedPlan.dataLimit,

  usedBytes:0,

  remainingBytes:
    selectedPlan.dataLimit,

  status:"active",

  activated:false,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()
  

});




const profileRef =
  db.collection("internetProfiles")
  .doc(userId);

const profileSnap =
  await profileRef.get();

if (!profileSnap.exists) {



await profileRef.set({

  userId,

  totalPurchasedBytes:
    selectedPlan.dataLimit || 0,

  totalUsedBytes: 0,

  remainingBytes:
    selectedPlan.dataLimit || 0,

  isUnlimited:
    selectedPlan.dataLimit === null,

  expiryDate:
    selectedPlan.validityDays
      ? new Date(
          Date.now() +
          selectedPlan.validityDays *
          24 * 60 * 60 * 1000
        )
      : null,

  activeVoucherCode:
    voucherCode,

  lastConnectedMac: "",

  lastConnectedIp: "",

  status: "active",
  omadaValid: true,

  createdAt:
    admin.firestore.FieldValue.serverTimestamp(),

  updatedAt:
    admin.firestore.FieldValue.serverTimestamp()

});

}

else {

if (selectedPlan.dataLimit === null) {

  const expiryDate = new Date();

  expiryDate.setDate(
    expiryDate.getDate() + 30
  );

  await profileRef.update({

    totalPurchasedBytes: 0,

    totalUsedBytes: 0,

    remainingBytes: 0,

    isUnlimited: true,

    activeVoucherCode:
      voucherCode,

    expiryDate,

    status: "active",

    updatedAt:
      admin.firestore.FieldValue.serverTimestamp()

  });

} else {



await profileRef.update({

  totalPurchasedBytes:
    admin.firestore.FieldValue.increment(
      selectedPlan.dataLimit
    ),

  remainingBytes:
    admin.firestore.FieldValue.increment(
      selectedPlan.dataLimit
    ),

  isUnlimited: false,

  expiryDate: null,

  activeVoucherCode:
    voucherCode,

  status: "active",

  updatedAt:
    admin.firestore.FieldValue.serverTimestamp()

});

}

}



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




  await sendAdminNotification({

  type: "voucher",

  title:
    `${userData.fullName} generated ₦${amountToCharge} Voucher`,

  amount:
    amountToCharge,

  reference:
    request_id,

  user: {

    userId,

    fullName:
      userData.fullName,

    email:
      userData.email

  },

  extra: {

    voucher:
      voucherCode,

    plan:
      desc,

    email:
      userData.email,

    amount:
      amountToCharge,

    transactionType:
      "voucher"

  }

});




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

  email: userData.email,

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
