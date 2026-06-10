const { db, admin } =
require("../config/firebase");

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

return res.json({

  success:true,

  planId,

  planName:
    plan.name,

  amount:
    plan.price,

  wallet,

  speed:
    plan.speed,

  devices:
    plan.devices,

  duration:
    plan.duration

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
