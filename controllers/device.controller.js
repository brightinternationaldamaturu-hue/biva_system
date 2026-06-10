const { db, admin } =
require("../config/firebase");

exports.addDevice =
async (req, res) => {

try{

const {
  userId,
  deviceName,
  macAddress
} = req.body;

if(
  !userId ||
  !deviceName ||
  !macAddress
){

  return res.status(400).json({
    success:false,
    error:"Missing fields"
  });

}

await db.collection(
  "devices"
).add({

  userId,

  deviceName,

  macAddress:
    macAddress
    .toUpperCase(),

  createdAt:
    admin.firestore
    .FieldValue
    .serverTimestamp()

});

return res.json({

  success:true,

  message:
    "Device added successfully"

});

}
catch(err){

return res.status(500).json({
  success:false,
  error:err.message
});

}

};
