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

  return res.json({

    success:true,

    planId,

    planName:
      plan.name,

    amount:
      plan.price,

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
