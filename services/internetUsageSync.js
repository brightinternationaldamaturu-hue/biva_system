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

activeAccounts.forEach(accountDoc => {

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

}
  
  
  else {

    console.log(
      `❌ Voucher ${voucherCode} is offline`
    );

  }

});



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
