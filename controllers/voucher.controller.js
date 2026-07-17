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
  price: 2000,
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
  price: 5500,
  desc: "Phone Unlimited",
  dataLimit: null,
  validityDays: 30
},

{
  price: 30000,
  desc: "Home/Business Unlimited",
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
  desc,
  recipientPhone

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
    
    const planBytes =
  Number(
    selectedPlan.dataLimit || 0
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
// BENEFICIARY
// =========================

let beneficiaryId =
  userId;

let beneficiaryName =
  userData.fullName;

if(recipientPhone){

  const recipientQuery =
    await db
    .collection("users")
    .where(
      "phone",
      "==",
      recipientPhone
    )
    .limit(1)
    .get();

  if(recipientQuery.empty){

    return res.status(404).json({

      success:false,

      error:
        "Recipient not found"

    });

  }

  beneficiaryId =
    recipientQuery.docs[0].id;

  beneficiaryName =
    recipientQuery.docs[0]
    .data()
    .fullName;

}

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
      
        recipientPhone:
  recipientPhone || "",

recipientName:
  recipientPhone
    ? beneficiaryName
    : "",

      type:"voucher",

      category:"voucher",

      title:

recipientPhone

? `${desc} purchased for ${beneficiaryName}`

: `${desc} Voucher`,

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

// 5% cashback

const cashback =

  Math.floor(
    amountToCharge * 0.05
  );



    // =========================
    // GENERATE VOUCHER
    // =========================

const voucherCode =

  "BIVA-" +

  Date.now();

  const profileRef =
  db.collection("internetProfiles")
  .doc(beneficiaryId);

const activeAccountSnap =
  await db
  .collection(
    "internetAccounts"
  )
.where(
  "userId",
  "==",
  beneficiaryId
)
  .limit(1)
  .get();



  const isUnlimitedPlan =

  desc === "Phone Unlimited" ||

  desc === "Home/Business Unlimited";



  if(
  !activeAccountSnap.empty
){

  const accountDoc =
    activeAccountSnap.docs[0];


  const account =
  accountDoc.data();



  if(isUnlimitedPlan){

await accountDoc.ref.update({

  voucherCode:
    voucherCode,

  plan:
    desc,

  amount:
    amountToCharge,

  isUnlimited:true,

  dailyLimit:
    desc === "Phone Unlimited"
      ? 6442450944
      : null,

  dataLimit:null,

  remainingBytes:
    desc === "Phone Unlimited"
      ? 6442450944
      : -1,

  maxDevices:
    desc === "Phone Unlimited"
      ? 4
      : 8,

  totalUsedBytes:0,

  totalDownloadBytes:0,

  totalUploadBytes:0,

  usageOffsetBytes:0,

  expiryDate:
    new Date(
      Date.now() +
      30 * 24 * 60 * 60 * 1000
    ),

  status:"active",

  omadaValid:true,

  updatedAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});

await profileRef.update({

  isUnlimited: true,

  activeVoucherCode:
    voucherCode,

  remainingBytes:
    desc === "Phone Unlimited"
      ? 6442450944
      : -1,

  totalUsedBytes: 0,

  expiryDate:
    new Date(
      Date.now() +
      30 * 24 * 60 * 60 * 1000
    ),

  status: "active",

  updatedAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});

await transactionRef.update({

  status:"success",

  response:{
    voucher:voucherCode
  },

  completedAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


await userRef.update({

  cashbackBalance:
    admin.firestore
    .FieldValue
    .increment(cashback)

});



await db.collection(
  "transactions"
).add({

  userId,

  email:
    userData.email,

  type:"cashback",

  category:"cashback",

  title:"Voucher Cashback",

  amount:cashback,

  status:"success",

  description:
    `5% cashback from ${desc} purchase`,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


return res.json({

  success:true,

  purchaseType:"replacement",

  status:"success",

  service:"voucher",

  provider:"BIVA",

  voucher:voucherCode,

  cashback,

  plan:desc,

  amount:amountToCharge,

  reference:request_id,

  balanceBefore,

  balanceAfter,

  message:"Unlimited plan activated"

});

}
    

await accountDoc.ref.update({

  dataLimit:
    admin.firestore.FieldValue.increment(
      planBytes
    ),

  remainingBytes:
    admin.firestore.FieldValue.increment(
      planBytes
    ),

  status:"active",

  omadaValid:true,

  expiryDate:
    new Date(
      Date.now() +
      30 * 24 * 60 * 60 * 1000
    )

});

  await profileRef.update({

    totalPurchasedBytes:
      admin.firestore.FieldValue.increment(
        planBytes
      ),

    remainingBytes:
      admin.firestore.FieldValue.increment(
        planBytes
      ),

    expiryDate:
      new Date(
        Date.now() +
        30 * 24 * 60 * 60 * 1000
      ),

    updatedAt:
      admin.firestore.FieldValue.serverTimestamp()

  });




  

if(
  account.clientMacs &&
  account.clientMacs.length
){

  for(
    const mac of
    account.clientMacs
  ){

    try{

      await axios.post(

        "https://portal.biva.ng/omada/authorize-client",

        {
          clientMac: mac
        }

      );

    }

    catch(err){

      console.log(
        err.message
      );

    }

  }

}


  await transactionRef.update({

  status:"success",

  completedAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


await userRef.update({

  cashbackBalance:
    admin.firestore
    .FieldValue
    .increment(cashback)

});


await db.collection(
  "transactions"
).add({

  userId,

  email:
    userData.email,

  type:"cashback",

  category:"cashback",

  title:"Voucher Cashback",

  amount:cashback,

  status:"success",

  description:
    `10% cashback from ${desc} top-up purchase`,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});



  return res.json({

    success:true,

    purchaseType:"topup",

    message:
      `${desc} Top-up to your Balance`

  });

}

  await db
  .collection(
    "pendingInternetAccounts"
  )
  .add({

    userId:
  beneficiaryId,

    voucherCode,

    plan:
      desc,

    dataLimit:
      selectedPlan.dataLimit,

    amount:
      amountToCharge,

    activated:false,

    createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

  });





const profileSnap =
  await profileRef.get();

if (!profileSnap.exists) {



await profileRef.set({

  userId:
    beneficiaryId,

  totalPurchasedBytes:
    selectedPlan.dataLimit || 0,

  totalUsedBytes: 0,

  remainingBytes:
    selectedPlan.dataLimit || 0,

  isUnlimited:
    selectedPlan.dataLimit === null,

expiryDate:
  new Date(
    Date.now() +
    30 * 24 * 60 * 60 * 1000
  ),

  activeVoucherCode:
    voucherCode,

  lastConnectedMac: "",

  lastConnectedIp: "",

  status: "active",

  createdAt:
    admin.firestore.FieldValue.serverTimestamp(),

  updatedAt:
    admin.firestore.FieldValue.serverTimestamp()

});

}

else {

await profileRef.update({

  totalPurchasedBytes:
    admin.firestore
    .FieldValue
    .increment(
      selectedPlan.dataLimit
    ),

  remainingBytes:
    admin.firestore
    .FieldValue
    .increment(
      selectedPlan.dataLimit
    ),

  activeVoucherCode:
    voucherCode,

  expiryDate:
    new Date(
      Date.now() +
      30 * 24 * 60 * 60 * 1000
    ),

  status:"active",

  updatedAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});

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

        beneficiaryId,

recipientPhone:
  recipientPhone || "",

recipientName:
  recipientPhone
    ? beneficiaryName
    : "",

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

      response:{ voucher: voucherCode },
      

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

  beneficiaryName,

  message:

recipientPhone

? `${desc} successfully purchased for ${beneficiaryName}`

: `Voucher generated successfully. Cashback ₦${cashback} earned 🎉`,

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
