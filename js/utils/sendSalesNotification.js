const axios = require("axios");

exports.sendSalesNotification =
async(data)=>{

  try{

    await axios.post(

      process.env.MAKE_SALES_WEBHOOK,

      data

    );

  }

  catch(err){

    console.log(
      "EMAIL ERROR:",
      err.message
    );

  }

};