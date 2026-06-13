const { db, admin } = require("../config/firebase");
const axios = require("axios");

exports.subscribeInternet =
async (req, res) => {

try {

  const {
    userId,
    planId
  } = req.body;

  if(
    !userId ||
    !planId
  ){
    return res.status(400).json({
      success:false,
      error:"Missing fields"
    });
  }

  const planRef =
    db.collection("wifiPlans")
    .doc(planId);

  const planSnap =
    await planRef.get();

  if(!planSnap.exists){

    return res.status(404).json({
      success:false,
      error:"Plan not found"
    });

  }

  const plan =
    planSnap.data();


    const userRef =
  db.collection("users")
  .doc(userId);

const userSnap =
  await userRef.get();

if(!userSnap.exists){

  return res.status(404).json({
    success:false,
    error:"User not found"
  });

}

const userData =
  userSnap.data();

const wallet =
  Number(userData.wallet || 0);

if(wallet < Number(plan.price)){

  return res.status(400).json({

    success:false,

    error:"Insufficient balance",

    wallet,

    required:
      plan.price

  });

}




const existingSubscription =
  await db
  .collection("subscriptions")
  .where(
    "userId",
    "==",
    userId
  )
  .where(
    "status",
    "==",
    "active"
  )
  .get();

if(
  !existingSubscription.empty
){

  return res.status(400).json({

    success:false,

    error:
      "You already have an active subscription"

  });

}









const amountToCharge =
  Number(plan.price);

const balanceBefore =
  wallet;

const balanceAfter =
  balanceBefore - amountToCharge;

const request_id =
  "INTERNET_" + Date.now();

const transactionRef =
  db.collection("transactions")
  .doc(request_id);

await transactionRef.set({

  request_id,

  userId,

  email:
    userData.email || "",

  fullName:
    userData.fullName || "",

  type:"internet",

  category:"internet",

  title:
    `${plan.name} Internet`,

  amount:
    amountToCharge,

  plan:
    plan.name,

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





await userRef.update({

  wallet:
    admin.firestore
    .FieldValue
    .increment(-amountToCharge)

});


const expiryDate = new Date();

expiryDate.setDate(
  expiryDate.getDate() +
  Number(plan.duration)
);





await db.collection(
  "subscriptions"
).add({

  userId,

  planId,

  planName:
    plan.name,

  dataLimit:
    plan.dataLimit,

  amount:
    amountToCharge,

  speed:
    plan.speed,

  devices:
    plan.devices,

  duration:
    plan.duration,

  status:"active",

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp(),

  expiryDate

});




//Cashback//


const cashback =
Math.floor(
  amountToCharge * 0.05
);


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

  title:
    "Internet Cashback",

  amount:
    cashback,

  status:"success",

  description:
    `5% cashback from ${plan.name} Internet subscription`,

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});




await transactionRef.update({

  status:"success",

  completedAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});



return res.json({

  success:true,

  message:
    "Internet subscription successful",

  planName:
    plan.name,

  amount:
    amountToCharge,

  cashback,

  request_id

});



}
catch(err){

  console.log(err);

  return res.status(500).json({
    success:false,
    error:err.message
  });

}

};








exports.getInternetStatus = async (req, res) => {

  try {

    const voucherCode =
      req.params.voucherCode;

    const snapshot =
      await db
        .collection(
          "internetAccounts"
        )
        .where(
          "voucherCode",
          "==",
          voucherCode
        )
        .limit(1)
        .get();

    if(snapshot.empty){

      return res.status(404).json({

        success:false,

        error:
          "Voucher not found"

      });

    }

    const account =
      snapshot.docs[0].data();

    return res.json({

      success:true,

      online:
        account.status ===
        "active",

      status:
        account.status,

      voucherCode,

      download:
        Number(
          account.totalDownloadBytes || 0
        ),

      upload:
        Number(
          account.totalUploadBytes || 0
        ),

      usedBytes:
        Number(
          account.totalUsedBytes || 0
        ),

      remainingBytes:
        Number(
          account.remainingBytes || 0
        ),

      signal: 0,

      device: "-",

      ip: "-",

      ssid: "-",

      isUnlimited:false

    });

  }

  catch(err){

    return res.status(500).json({

      success:false,

      error:
        err.message

    });

  }

};





exports.authorizeClient = async (req, res) => {

  try {

    const {
      userId,
      clientMac
    } = req.body;

    if (
      !userId ||
      !clientMac
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Missing userId or clientMac"

      });

    }

    const profileRef =
      db.collection("internetProfiles")
        .doc(userId);

    const profileSnap =
      await profileRef.get();

    if (!profileSnap.exists) {

      return res.status(404).json({

        success: false,

        error:
          "Internet profile not found"

      });

    }

    const profile =
      profileSnap.data();

    if (
      profile.status !== "active"
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Internet plan expired"

      });

    }

    if (
      Number(profile.remainingBytes || 0) <= 0
    ) {

      return res.status(400).json({

        success: false,

        error:
          "No remaining data"

      });

    }

    const response =
      await axios.post(

        "https://further-investigations-seconds-cake.trycloudflare.com/omada/authorize-client",

        {
          clientMac
        }

      );

    return res.json({

      success: true,

      data:
        response.data

    });

  }

  catch (err) {

    return res.status(500).json({

      success: false,

      error:
        err.message

    });

  }

};








exports.activateInternet =
async (req, res) => {

  try {

    const {
      userId,
      clientMac
    } = req.body;

    if (
      !userId ||
      !clientMac
    ) {

      return res.status(400).json({

        success:false,

        error:
          "Missing userId or clientMac"

      });

    }

    const pendingSnap =
      await db
      .collection(
        "pendingInternetAccounts"
      )
      .where(
        "userId",
        "==",
        userId
      )
.where(
  "activated",
  "==",
  false
)
.orderBy(
  "createdAt",
  "desc"
)
.limit(1)
      .get();

    if (
      pendingSnap.empty
    ) {

      return res.status(404).json({

        success:false,

        error:
          "No pending internet plan"

      });

    }

    const pendingDoc =
      pendingSnap.docs[0];



      const activeAccounts =
  await db
  .collection(
    "internetAccounts"
  )
  .where(
    "userId",
    "==",
    userId
  )
  .where(
    "status",
    "==",
    "active"
  )
  .get();

for(
  const account of
  activeAccounts.docs
){

  await account.ref.update({

    status:"expired",

    omadaValid:false

  });

}



const activeSubscriptions =
  await db
  .collection("subscriptions")
  .where(
    "userId",
    "==",
    userId
  )
  .where(
    "status",
    "==",
    "active"
  )
  .get();

for(
  const subscription of
  activeSubscriptions.docs
){

  await subscription.ref.update({

    status:"expired"

  });

}


    const pending =
      pendingDoc.data();

    await db
      .collection(
        "internetAccounts"
      )
      .add({

        userId,

        voucherCode:
          pending.voucherCode,

        plan:
          pending.plan,

        amount:
          pending.amount,

        dataLimit:
          pending.dataLimit,

        clientMac,

        totalDownloadBytes:0,

        totalUploadBytes:0,

        totalUsedBytes:0,

        remainingBytes:
          pending.dataLimit,

        status:"active",

        activated:true,

        createdAt:
          admin.firestore
          .FieldValue
          .serverTimestamp()

      });


const profileRef =
  db.collection(
    "internetProfiles"
  )
  .doc(userId);

await profileRef.set({

  activeVoucherCode:
    pending.voucherCode,

  remainingBytes:
    pending.dataLimit,

  totalUsedBytes:0,

  status:"active",

  lastConnectedMac:
    clientMac

}, { merge:true });




    await pendingDoc.ref.update({

      activated:true

    });

    return res.json({

      success:true,

      message:
        "Internet activated"

    });

  }

  catch(err){

    return res.status(500).json({

      success:false,

      error:
        err.message

    });

  }

};
