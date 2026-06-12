const cron = require("node-cron");

function startInternetUsageSync() {

  cron.schedule("* * * * *", async () => {

    console.log(
      "🔄 Internet Usage Sync Running:",
      new Date().toISOString()
    );

  });

}

module.exports = {
  startInternetUsageSync
};
