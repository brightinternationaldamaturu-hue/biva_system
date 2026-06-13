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
  !account.clientMac
){

  console.log(
    `⚠️ No MAC bound for ${accountDoc.id}`
  );

  continue;

}



const clientMac =
  account.clientMac;

const record =
  records.find(

    r =>

      r.mac &&
      clientMac &&

      r.mac.toUpperCase() ===
      clientMac.toUpperCase()

  );



if (
  record &&
  record.mac
){

console.log(
  `✅ Device ${clientMac} is online`
);


  const totalDownloadBytes =
  Number(record.download || 0);

const totalUploadBytes =
  Number(record.upload || 0);

const totalUsedBytes =
  totalDownloadBytes +
  totalUploadBytes;

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

if (
  record.id
) {

  try {

    await axios.post(

      "https://further-investigations-seconds-cake.trycloudflare.com/omada/disconnect-client",

      {

        authId:
          record.id

      }

    );

    console.log(
      `🔌 Disconnected ${voucherCode}`
    );

  }

  catch(err){

    console.log(
      `❌ Disconnect Failed ${voucherCode}`
    );

  }

}



  await accountDoc.ref.update({

    status: "expired",

    omadaValid: false

  });

  console.log(
    `🚫 Voucher ${voucherCode} expired`
  );

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
