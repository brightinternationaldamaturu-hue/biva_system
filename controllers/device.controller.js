const { db, admin } =
require("../config/firebase");

exports.registerDevice =
async (req, res) => {

try{

  const {
    userId,
    macAddress,
    deviceName
  } = req.body;

  if(
    !userId ||
    !macAddress
  ){
    return res.status(400).json({
      success:false,
      error:"Missing fields"
    });
  }

  const existing =
    await db
    .collection("devices")
    .where(
      "macAddress",
      "==",
      macAddress
    )
    .get();

  if(!existing.empty){

    return res.status(400).json({
      success:false,
      error:"Device already registered"
    });

  }

  await db
  .collection("devices")
  .add({

    userId,

    macAddress,

    deviceName:
      deviceName || "",

    status:"active",

    createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

  });

  return res.json({

    success:true,

    message:
      "Device registered"

  });

}
catch(err){

  return res.status(500).json({

    success:false,

    error:err.message

  });

}

};









exports.validateDevice =
async (req, res) => {

try{

  const {
    userId,
    macAddress
  } = req.body;

  const subSnapshot =
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

  if(subSnapshot.empty){

    return res.json({

      allowed:false,

      reason:
        "No active subscription"

    });

    const deviceExists =
  await db
  .collection("devices")
  .where(
    "userId",
    "==",
    userId
  )
  .where(
    "macAddress",
    "==",
    macAddress
  )
  .get();

if(deviceExists.empty){

  return res.json({

    allowed:false,

    reason:
      "Device not registered"

  });

}

  }

  const sub =
    subSnapshot.docs[0].data();

  const devicesSnapshot =
    await db
    .collection("devices")
    .where(
      "userId",
      "==",
      userId
    )
    .get();

  const deviceCount =
    devicesSnapshot.size;

  if(
    deviceCount >
    Number(sub.devices)
  ){

    return res.json({

      allowed:false,

      reason:
        "Device limit exceeded"

    });

  }

  return res.json({

    allowed:true

  });

}
catch(err){

  return res.status(500).json({

    success:false,

    error:err.message

  });

}

};
