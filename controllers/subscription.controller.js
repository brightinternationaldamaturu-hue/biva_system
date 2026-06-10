const { db } =
require("../config/firebase");

exports.expireSubscriptions =
async (req, res) => {

try{

const now =
  new Date();

const snapshot =
  await db
  .collection(
    "subscriptions"
  )
  .where(
    "status",
    "==",
    "active"
  )
  .get();

let expired = 0;

for(const doc of snapshot.docs){

  const sub =
    doc.data();

  const expiryDate =
    sub.expiryDate.toDate
    ? sub.expiryDate.toDate()
    : new Date(
        sub.expiryDate
      );

  if(expiryDate <= now){

    await doc.ref.update({

      status:"expired"

    });

    expired++;

  }

}

return res.json({

  success:true,

  expired

});

}
catch(err){

return res.status(500).json({

  success:false,

  error:err.message

});

}

};
