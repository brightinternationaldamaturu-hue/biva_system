const cron = require("node-cron");
const axios = require("axios");
const { db } = require("../config/firebase");

function startInternetUsageSync() {

  cron.schedule("* * * * *", async () => {

    try {

const activeAccounts =
  await db
    .collection("internetAccounts")
    .where(
      "status",
      "==",
      "active"
    )
    .get();

      console.log(
        `📶 Active Internet Accounts: ${activeAccounts.size}`
      );


const recordsResponse =
  await axios.get(
    "https://further-investigations-seconds-cake.trycloudflare.com/omada/authed-records"
  );

const records =
  recordsResponse.data.result.data;



console.log(
  `📡 Omada Records: ${records.length}`
);

for (const accountDoc of activeAccounts.docs) {

  const account =
    accountDoc.data();


if(

  !account.clientMacs ||

  !account.clientMacs.length

){

  console.log(

    `⚠️ No MAC bound for ${accountDoc.id}`

  );

  continue;

}



const clientMacs =
  account.clientMacs;

  const clientMac =
  clientMacs[0];

const accountRecords =
  records.filter(

    r =>

      account.clientMacs.some(

        mac =>

          r.mac &&

          r.mac.toUpperCase() ===

          mac.toUpperCase()

      )
    

  );

const record =
  accountRecords[0];

if(
  accountRecords.length
){

console.log(
  `✅ ${accountRecords.length} device(s) online`
);


const totalDownloadBytes =
  accountRecords.reduce(

    (sum,r)=>

      sum +

      Number(
        r.download || 0
      ),

    0

  );

const totalUploadBytes =
  accountRecords.reduce(

    (sum,r)=>

      sum +

      Number(
        r.upload || 0
      ),

    0

  );

const rawUsedBytes =
  totalDownloadBytes +
  totalUploadBytes;

  const usageOffsetBytes =
  Number(
    account.usageOffsetBytes || 0
  );

  if(
  !account.usageOffsetBytes
){

  await accountDoc.ref.update({

    usageOffsetBytes:
      rawUsedBytes

  });

  console.log(
    `📌 Usage Offset Saved: ${rawUsedBytes}`
  );

  continue;

}


const totalUsedBytes =
  Math.max(
    0,
    rawUsedBytes -
    usageOffsetBytes
  );

const remainingBytes =
  Math.max(
    0,
    Number(account.dataLimit || 0)
    - totalUsedBytes
  );

console.log(
  `⬇️ Download: ${totalDownloadBytes}`
);

console.log(
  `⬆️ Upload: ${totalUploadBytes}`
);

console.log(
  `📊 Used: ${totalUsedBytes}`
);

console.log(
  `📦 Remaining: ${remainingBytes}`
);







await accountDoc.ref.update({

  totalDownloadBytes,

  totalUploadBytes,

  totalUsedBytes,

  remainingBytes,

  omadaValid:
    record.valid === true,

  updatedAt:
    new Date()

});



console.log(
  `🔍 Omada Valid: ${record.valid}`
);


if (

  account.status !== "expired" &&

  remainingBytes <= 0

) {

for(

  const device of

  accountRecords

){

  if(
    device.id
  ){

    try{

      await axios.post(

        "https://further-investigations-seconds-cake.trycloudflare.com/omada/disconnect-client",

        {

          authId:
            device.id

        }

      );

      console.log(

        `🔌 Disconnected ${device.mac}`

      );

    }

    catch(err){

      console.log(

        `❌ Disconnect Failed ${device.mac}`

      );

    }

  }

}



  await accountDoc.ref.update({

    status: "expired",

    omadaValid: false

  });

console.log(
  `🚫 Device ${clientMac} expired`
);



  await db
  .collection("subscriptions")
  .where(
    "userId",
    "==",
    account.userId
  )
  .where(
    "status",
    "==",
    "active"
  )
  .get()
  .then(async(snapshot)=>{

    const batch =
      db.batch();

    snapshot.docs.forEach(doc=>{

      batch.update(
        doc.ref,
        {
          status:"expired"
        }
      );

    });

    await batch.commit();

  });

}






else {

  await accountDoc.ref.update({

    status: "active",

    omadaValid: true

  });

}


  


const profileRef =
  db.collection("internetProfiles")
    .doc(account.userId);

const profileSnap =
  await profileRef.get();

if (profileSnap.exists) {

await profileRef.update({

  totalUsedBytes,

  remainingBytes,

status:
  remainingBytes <= 0
    ? "expired"
    : "active",

  lastConnectedIp:
    record.ip || "",

  lastConnectedMac:
    record.mac || "",

  updatedAt:
    new Date()

});

  console.log(
    `👤 Profile Updated ${account.userId}`
  );

} else {

  console.log(
    `⚠️ Missing Profile ${account.userId}`
  );

}




console.log(
  "💾 Account Updated"
);

}
  
  
  else {

console.log(
  `⚠️ Device ${clientMac} not found in Omada records`
);

  }

}



    } catch (err) {

      console.error(
        "SYNC ERROR:",
        err.message
      );

    }

  });

}

module.exports = {
  startInternetUsageSync
};
