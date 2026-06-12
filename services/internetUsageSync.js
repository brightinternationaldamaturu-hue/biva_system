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


      const clientsResponse =
  await axios.get(
    "https://enterprises-caused-role-deaf.trycloudflare.com/omada/clients"
  );

const clients =
  clientsResponse.data.result.data;

console.log(
  `📡 Omada Clients: ${clients.length}`
);

for (const accountDoc of activeAccounts.docs) {

  const account =
    accountDoc.data();

  const voucherCode =
    account.voucherCode;

  const client =
    clients.find(c =>

      c.authInfo &&
      c.authInfo.some(

        auth =>
          auth.info ===
          voucherCode

      )

    );

if(client){

  console.log(
    `✅ Voucher ${voucherCode} is online`
  );

  console.log(
    `⬇️ Download: ${client.trafficDown}`
  );

  console.log(
    `⬆️ Upload: ${client.trafficUp}`
  );


  const currentTrafficBytes =
  Number(client.trafficDown || 0) +
  Number(client.trafficUp || 0);



  console.log(
  `🗄️ Previous Traffic: ${account.lastTrafficBytes || 0}`
);

console.log(
  `🌐 Current Traffic: ${currentTrafficBytes}`
);




const previousTrafficBytes =
  Number(account.lastTrafficBytes || 0);

let increment = 0;

if (
  currentTrafficBytes >=
  previousTrafficBytes
) {

  increment =
    currentTrafficBytes -
    previousTrafficBytes;

} else {

  increment =
    currentTrafficBytes;

}

console.log(
  `📊 Increment: ${increment}`
);


await accountDoc.ref.update({

  totalUsedBytes:
    Number(account.totalUsedBytes || 0)
    + increment,

  remainingBytes:
    Math.max(
      0,
      Number(account.dataLimit || 0)
      -
      (
        Number(account.totalUsedBytes || 0)
        + increment
      )
    ),

  lastTrafficBytes:
    currentTrafficBytes

});




const newTotalUsedBytes =
  Number(account.totalUsedBytes || 0)
  + increment;

const newRemainingBytes =
  Math.max(
    0,
    Number(account.dataLimit || 0)
    - newTotalUsedBytes
  );


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

    totalUsedBytes:
      newTotalUsedBytes,

    remainingBytes:
      newRemainingBytes,

    lastConnectedIp:
      client.ip || "",

    lastConnectedMac:
      client.mac || "",

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
      `❌ Voucher ${voucherCode} is offline`
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
