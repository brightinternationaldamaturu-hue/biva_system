const cron = require("node-cron");
const axios = require("axios");
const { db } = require("../config/firebase");

function startInternetUsageSync() {

  cron.schedule("* * * * *", async () => {

    try {

      const activeAccounts =
        await db
          .collection("internetAccounts")
          .where("status", "==", "active")
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
  `📡 Omada Clients: ${clients.length}`
);

for (const accountDoc of activeAccounts.docs) {

  const account =
    accountDoc.data();

  const voucherCode =
    account.voucherCode;

const record =
  records.find(

    r =>
      r.voucherCode ===
      voucherCode

  );

if (
  record &&
  record.voucherCode
){

  console.log(
    `✅ Voucher ${voucherCode} is online`
  );

  console.log(
    `⬇️ Download: ${client.trafficDown}`
  );

  console.log(
    `⬆️ Upload: ${client.trafficUp}`
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




if (
  remainingBytes <= 0 ||
  record.valid === false
) {

  await accountDoc.ref.update({

    status: "expired",

    omadaValid: false

  });

  await db
    .collection("internetProfiles")
    .doc(account.userId)
    .update({

      status: "expired"

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

  await db
    .collection("internetProfiles")
    .doc(account.userId)
    .update({

      status: "active"

    });

}


  if (newRemainingBytes <= 0) {

  await accountDoc.ref.update({

    status: "expired"

  });

  await db
    .collection("internetProfiles")
    .doc(account.userId)
    .update({

      status: "expired"

    });

  console.log(
    `🚫 Voucher ${voucherCode} expired`
  );

}


await db
  .collection("internetProfiles")
  .doc(account.userId)
  .update({

    totalUsedBytes,

    remainingBytes,

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




console.log(
  "💾 Account Updated"
);

}
  
  
  else {

console.log(
  `⚠️ Voucher ${voucherCode} not found in Omada records`
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
