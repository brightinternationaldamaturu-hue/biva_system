const cron = require("node-cron");
const axios = require("axios");
const { db } = require("../config/firebase");

function startInternetUsageSync() {

  cron.schedule("* * * * *", async () => {

    try {

const activeSnapshot =
  await db
    .collection("internetAccounts")
    .where(
      "status",
      "in",
      [
        "active",
        "daily_limit_reached"
      ]
    )
    .get();

const activeAccounts =
  activeSnapshot;

      console.log(
        `📶 Active Internet Accounts: ${activeAccounts.size}`
      );


const recordsResponse =
  await axios.get(
    "https://portal.biva.ng/omada/authed-records"
  );

const records =
  recordsResponse.data.result.data;



console.log(
  `📡 Omada Records: ${records.length}`
);




for (const accountDoc of activeAccounts.docs) {

  const account =
    accountDoc.data();


  const today =
  new Date().toDateString();

const lastResetDate =
  account.lastResetDate || "";


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


  console.log(
  "RECORDS FOUND:",
  accountRecords.map(r => ({
    mac: r.mac,
    valid: r.valid,
    authId: r.id,
    expireTime: r.expireTime
  }))
);




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



if(

  account.plan === "Phone Unlimited" &&

  lastResetDate !== today

){

  await accountDoc.ref.update({

    usageOffsetBytes:
      rawUsedBytes,

    totalUsedBytes: 0,

    remainingBytes:
      account.dailyLimit,

    lastResetDate:
      today,

    status:"active",

    omadaValid:true

  });

  console.log(
    `🔄 Daily reset for ${account.voucherCode}`
  );

  continue;

}


  const usageOffsetBytes =
  Number(
    account.usageOffsetBytes || 0
  );

if(
  !account.usageOffsetBytes
){

  await accountDoc.ref.update({

    usageOffsetBytes:
      rawUsedBytes,

    totalDownloadBytes: 0,

    totalUploadBytes: 0,

    totalUsedBytes: 0,

    remainingBytes:
      account.plan === "Phone Unlimited"
        ? account.dailyLimit
        : account.dataLimit,

    lastResetDate:
      today

  });

  continue;

}


const totalDownloadBytesCurrent =
  Math.max(
    0,
    totalDownloadBytes -
    usageOffsetBytes
  );

const totalUsedBytes =
  Math.max(
    0,
    rawUsedBytes -
    usageOffsetBytes
  );

let remainingBytes;

if(account.plan === "Home/Business Unlimited"){

  remainingBytes = -1;

}else if(account.plan === "Phone Unlimited"){

  remainingBytes =
    Math.max(
      0,
      Number(account.dailyLimit || 0)
      - totalUsedBytes
    );

}else{

  remainingBytes =
    Math.max(
      0,
      Number(account.dataLimit || 0)
      - totalUsedBytes
    );

}

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

totalDownloadBytes:
  Math.max(
    0,
    totalDownloadBytes -
    usageOffsetBytes
  ),

  totalUploadBytes:
  Math.max(
    0,
    totalUploadBytes
  ),

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


if(

  account.expiryDate &&

  new Date(account.expiryDate)
  < new Date()

){

  await accountDoc.ref.update({

    status:"expired"

  });

  continue;

}





if (

  account.plan !== "Home/Business Unlimited" &&

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

        "https://portal.biva.ng/omada/disconnect-client",

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

  status: "daily_limit_reached",

  omadaValid: false

});

console.log(
  `🚫 Device ${clientMac} expired`
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
  account.plan ===
  "Home/Business Unlimited"

    ? "active"

    : account.plan ===
      "Phone Unlimited"

      ? (
          remainingBytes <= 0
            ? "daily_limit_reached"
            : "active"
        )

      : (
          remainingBytes <= 0
            ? "expired"
            : "active"
        ),

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
