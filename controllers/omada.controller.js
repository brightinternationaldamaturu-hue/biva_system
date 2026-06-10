const axios = require("axios");

exports.testOmada =
async (req, res) => {

  try{

    const response =
      await axios.post(

        `${process.env.OMADA_URL}/openapi/authorize/login?client_id=${process.env.OMADA_CLIENT_ID}&omadac_id=${process.env.OMADA_ID}`,

        {

          username:
            process.env.OMADA_USERNAME,

          password:
            process.env.OMADA_PASSWORD

        },

        {
          httpsAgent:
            new (require("https").Agent)({
              rejectUnauthorized:false
            })
        }

      );

    return res.json({

      success:true,

      result:
        response.data

    });

  }

  catch(err){

    console.log(
      err.response?.data ||
      err.message
    );

    return res.status(500).json({

      success:false,

      error:
        err.response?.data ||
        err.message

    });

  }

};
