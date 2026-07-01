const cron = require("node-cron");
const axios = require("axios");
const { db } = require("../config/firebase");

function startInternetUsageSync() {

  cron.schedule("*/4 * * * *", async () => {

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







const updates = {};

const currentDownload =
  Math.max(
    0,
    totalDownloadBytes - usageOffsetBytes
  );

const currentUpload =
  Math.max(
    0,
    totalUploadBytes
  );

if (account.totalDownloadBytes !== currentDownload) {
  updates.totalDownloadBytes = currentDownload;
}

if (account.totalUploadBytes !== currentUpload) {
  updates.totalUploadBytes = currentUpload;
}

if (account.totalUsedBytes !== totalUsedBytes) {
  updates.totalUsedBytes = totalUsedBytes;
}

if (account.remainingBytes !== remainingBytes) {
  updates.remainingBytes = remainingBytes;
}

if (account.omadaValid !== (record.valid === true)) {
  updates.omadaValid = record.valid === true;
}



console.log(
  `🔍 Omada Valid: ${record.valid}`
);


if(

  account.expiryDate &&

  new Date(account.expiryDate)
  < new Date()

){

if (account.status !== "expired") {

  await accountDoc.ref.update({

    status: "expired"

  });

}

  continue;

}





if (

  account.plan !== "Home/Business Unlimited" &&

  account.status !== "expired" &&

  account.status !== "daily_limit_reached" &&

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

  if (
    account.status !== "active" ||
    account.omadaValid !== true
  ) {

    await accountDoc.ref.update({

      status: "active",

      omadaValid: true

    });

  }

}


  


if (Object.keys(updates).length > 0) {

  updates.updatedAt = new Date();

  await accountDoc.ref.update(updates);

  console.log("💾 Internet Account Updated");



  const profileRef =
    db.collection("internetProfiles")
      .doc(account.userId);

  const profileSnap =
    await profileRef.get();

  if(profileSnap.exists){

    const profile =
      profileSnap.data();

    const profileUpdates = {};

    const profileStatus =
      account.plan === "Home/Business Unlimited"

        ? "active"

        : account.plan === "Phone Unlimited"

          ? (
              remainingBytes <= 0
                ? "daily_limit_reached"
                : "active"
            )

          : (
              remainingBytes <= 0
                ? "expired"
                : "active"
            );

    if(profile.totalUsedBytes !== totalUsedBytes){
      profileUpdates.totalUsedBytes = totalUsedBytes;
    }

    if(profile.remainingBytes !== remainingBytes){
      profileUpdates.remainingBytes = remainingBytes;
    }

    if(profile.status !== profileStatus){
      profileUpdates.status = profileStatus;
    }

    if(profile.lastConnectedIp !== (record.ip || "")){
      profileUpdates.lastConnectedIp = record.ip || "";
    }

    if(profile.lastConnectedMac !== (record.mac || "")){
      profileUpdates.lastConnectedMac = record.mac || "";
    }

    if(Object.keys(profileUpdates).length){

      profileUpdates.updatedAt = new Date();

      await profileRef.update(profileUpdates);

      console.log("👤 Profile Updated");

    }

  }

}else{

  console.log("⏭ No Internet Account Changes");

}


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
