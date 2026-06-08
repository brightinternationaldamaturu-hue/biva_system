const {
  db,
  admin
} = require("../config/firebase");

exports.deleteAccount =
async(req,res)=>{

  try{

    const { userId } =
    req.body;

    if(!userId){

      return res.status(400)
      .json({

        success:false,

        error:
        "User ID required"

      });

    }

    await db
    .collection("users")
    .doc(userId)
    .delete();

    await admin
    .auth()
    .deleteUser(userId);

    return res.json({

      success:true,

      message:
      "Account deleted successfully"

    });

  }

  catch(error){

    console.log(
      "DELETE ACCOUNT ERROR:",
      error
    );

    return res.status(500)
    .json({

      success:false,

      error:
      error.message

    });

  }

};
