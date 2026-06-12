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

  const totalUsedBytes =
    Number(
      account.totalUsedBytes || 0
    );

  let totalBytes = null;

  if(
    account.plan &&
    account.plan
      .toLowerCase()
      .includes("unlimited")
  ){

    totalBytes = null;

  } else {

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

  online:false,

  voucherCode,

  device:
    account.lastDevice || "-",

  ip:
    account.lastIp || "-",

  signal:
    account.lastSignal || 0,

  ssid:
    account.lastSSID || "-",

  download:
  account.totalDownloadBytes || 0,

  upload:
  account.totalUploadBytes || 0,

  usedBytes:
    totalUsedBytes,

  remainingBytes,

  isUnlimited:
    totalBytes === null

});

}

const currentDownloadBytes =
  Number(client.trafficDown || 0);

const currentUploadBytes =
  Number(client.trafficUp || 0);


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


const previousDownload =
  Number(
    freshData.lastDownloadBytes || 0
  );

const previousUpload =
  Number(
    freshData.lastUploadBytes || 0
  );

const totalDownload =
  Number(
    freshData.totalDownloadBytes || 0
  );

const totalUpload =
  Number(
    freshData.totalUploadBytes || 0
  );


    let increment = 0;
    let downloadIncrement = 0;

if(
  currentDownloadBytes >=
  previousDownload
){

  downloadIncrement =
    currentDownloadBytes -
    previousDownload;

}else{

  // Omada reset
  downloadIncrement =
    currentDownloadBytes;

}


let uploadIncrement = 0;

if(
  currentUploadBytes >=
  previousUpload
){

  uploadIncrement =
    currentUploadBytes -
    previousUpload;

}else{

  // Omada reset
  uploadIncrement =
    currentUploadBytes;

}

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


remainingBytes:
  freshData.dataLimit
    ? Math.max(
        0,
        Number(freshData.dataLimit) -
        (previousUsed + increment)
      )
    : null,

    totalDownloadBytes:
      totalDownload +
      downloadIncrement,

    totalUploadBytes:
      totalUpload +
      uploadIncrement,

    lastTrafficBytes:
      currentTrafficBytes,

    lastDownloadBytes:
      currentDownloadBytes,

    lastUploadBytes:
      currentUploadBytes,

    lastDownload:
      client.trafficDown || 0,

    lastUpload:
      client.trafficUp || 0,

    lastDevice:
      client.name || "",

    lastIp:
      client.ip || "",

    lastSignal:
      client.signalLevel || 0,

    lastSSID:
      client.ssid || "",

    lastSeen:
      admin.firestore
        .FieldValue
        .serverTimestamp()

  }
);

  }
);



const updatedDoc =
  await accountDoc.ref.get();

const updatedData =
  updatedDoc.data();



  const profileRef =
  db.collection("internetProfiles")
  .doc(account.userId);

await profileRef.update({

  totalUsedBytes:
    updatedData.totalUsedBytes || 0,

  remainingBytes:
    updatedData.remainingBytes || 0,

  lastConnectedIp:
    client.ip || "",

  lastConnectedMac:
    client.mac || "",

  updatedAt:
    admin.firestore.FieldValue.serverTimestamp()

});


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
      Number(
        updatedData.totalUsedBytes || 0
      )
    );




return res.json({

  online: client.active,

  device: client.name,

  signal: client.signalLevel,

  ip: client.ip,

  ssid: client.ssid,

  download:
    updatedData.totalDownloadBytes || 0,

  upload:
    updatedData.totalUploadBytes || 0,

  usedBytes:
    updatedData.totalUsedBytes || 0,

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
