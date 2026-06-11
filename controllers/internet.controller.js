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


await db
.collection("internetAccounts")
.where(
  "voucherCode",
  "==",
  voucherCode
)
.get()
.then(snapshot => {

  snapshot.forEach(doc => {

    doc.ref.update({

      activated:true,

      lastSeen:
        admin.firestore
        .FieldValue
        .serverTimestamp()

    });

  });

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


return res.json({

  online:
    client.active,

  device:
    client.name,

  signal:
    client.signalLevel,

  ip:
    client.ip,

  ssid:
    client.ssid,

  download:
    client.trafficDown,

  upload:
    client.trafficUp,

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
