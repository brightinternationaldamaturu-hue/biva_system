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

const accountSnapshot =
  await db
    .collection("internetAccounts")
    .where(
      "voucherCode",
      "==",
      voucherCode
    )
    .limit(1)
    .get();

if(accountSnapshot.empty){

  return res.status(404).json({

    success:false,

    error:"Voucher not found"

  });

}

const accountDoc =
  accountSnapshot.docs[0];

const account =
  accountDoc.data();

await accountDoc.ref.update({

  activated:true,

  lastSeen:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});


const clientsResponse =
  await axios.get(
    "https://enterprises-caused-role-deaf.trycloudflare.com/omada/clients"
  );


  console.log(
  JSON.stringify(
    clientsResponse.data,
    null,
    2
  )
);



  const clients =
  clientsResponse.data
  .result
  .data;



  const client =
  clients.find(c =>

    c.authInfo &&
    c.authInfo.some(

      auth =>
        auth.info ===
        voucherCode

    )

  );


  if(!client){

  return res.json({

    online:false,

    voucherCode

  });

}

const currentTrafficBytes =
  Number(client.trafficDown || 0) +
  Number(client.trafficUp || 0);

const previousTrafficBytes =
  Number(account.lastTrafficBytes || 0);

const previousUsedBytes =
  Number(account.totalUsedBytes || 0);

let increment = 0;

if (
  currentTrafficBytes >=
  previousTrafficBytes
) {

  increment =
    currentTrafficBytes -
    previousTrafficBytes;

} else {

  // Omada session reset
  increment =
    currentTrafficBytes;

}

const totalUsedBytes =
  previousUsedBytes +
  increment;


await db.runTransaction(
  async (transaction) => {

    const freshDoc =
      await transaction.get(
        accountDoc.ref
      );

    const freshData =
      freshDoc.data();

    const previousTraffic =
      Number(
        freshData.lastTrafficBytes || 0
      );

    const previousUsed =
      Number(
        freshData.totalUsedBytes || 0
      );

    let increment = 0;

    if (
      currentTrafficBytes >=
      previousTraffic
    ) {

      increment =
        currentTrafficBytes -
        previousTraffic;

    } else {

      increment =
        currentTrafficBytes;

    }

    transaction.update(
      accountDoc.ref,
      {

        totalUsedBytes:
          previousUsed +
          increment,

        lastTrafficBytes:
          currentTrafficBytes,

        lastSeen:
          admin.firestore
            .FieldValue
            .serverTimestamp()

      }
    );

  }
);



let totalBytes = null;

if(
  account.plan
    .toLowerCase()
    .includes("unlimited")
){

  totalBytes = null;

}else{

  const totalGB =
    parseFloat(
      account.plan
        .replace("GB","")
        .trim()
    );

  totalBytes =
    totalGB *
    1024 *
    1024 *
    1024;

}



const remainingBytes =

  totalBytes === null

  ? null

  : Math.max(
      0,
      totalBytes -
      totalUsedBytes
    );




return res.json({

  online: client.active,

  device: client.name,

  signal: client.signalLevel,

  ip: client.ip,

  ssid: client.ssid,

  download: client.trafficDown,

  upload: client.trafficUp,

  usedBytes: totalUsedBytes,

  remainingBytes,

  isUnlimited:
    totalBytes === null,

  voucherCode

});



  }

  catch(err){

    return res.status(500).json({

      success:false,

      error:err.message

    });

  }

};
