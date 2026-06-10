const { db, admin } =
require("../config/firebase");

exports.subscribeInternet =
async (req, res) => {

try{

  const {
    userId,
    planId
  } = req.body;

  if(
    !userId ||
    !planId
  ){
    return res.status(400).json({
      success:false,
      error:"Missing fields"
    });
  }

  return res.json({
    success:true,
    message:"Internet subscription endpoint working"
  });

}
catch(err){

  console.log(err);

  return res.status(500).json({
    success:false,
    error:err.message
  });

}

};
