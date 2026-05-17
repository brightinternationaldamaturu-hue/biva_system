const axios = require("axios");

const {
  db,
  admin
} = require("../config/firebase");


// ===============================
// VERIFY METER
// ===============================

exports.verifyMeter = async (

  req,
  res

)=>{

  try{

    const {

      disco,
      meterNumber,
      meterType

    } = req.body;


    if(

      !disco ||

      !meterNumber ||

      !meterType

    ){

      return res.status(400)
      .json({

        success:false,

        error:
        "Missing fields"

      });

    }


    const response =
    await axios.post(

      "https://iacafe.com.ng/devapi/v1/verify-customer",

      {

        customer_id:
        meterNumber,

        service_id:
        disco,

        variation_id:
        meterType

      },

      {

        headers:{

          Authorization:
          `Bearer ${process.env.IACAFE_API_KEY}`,

          "Content-Type":
          "application/json"

        }

      }

    );


    const data =
    response.data;


    return res.json({

      success:true,

      data:{

        name:
        data?.data
        ?.customer_name ||

        "Unknown User",


        address:
        data?.data
        ?.customer_address ||

        "Nigeria"

      }

    });

  }

  catch(error){

    console.log(error.message);

    return res.status(500)
    .json({

      success:false,

      error:
      "Meter verification failed"

    });

  }

};



// ===============================
// BUY ELECTRICITY
// ===============================

exports.buyElectricity = async (

  req,
  res

)=>{

  let userRef = null;

  let amount = 0;

  try{

    const {

      userId,
      disco,
      meterNumber,
      meterType,
      amount:buyAmount

    } = req.body;


    if(

      !userId ||

      !disco ||

      !meterNumber ||

      !meterType ||

      !buyAmount

    ){

      return res.status(400)
      .json({

        success:false,

        error:
        "Missing fields"

      });

    }


    amount =
    Number(buyAmount);


    if(amount < 100){

      return res.status(400)
      .json({

        success:false,

        error:
        "Minimum amount is ₦100"

      });

    }


    // USER
    userRef =
    db.collection("users")
    .doc(userId);


    const snap =
    await userRef.get();


    if(!snap.exists){

      return res.status(404)
      .json({

        success:false,

        error:
        "User not found"

      });

    }


    const user =
    snap.data();


    // CHECK WALLET
    if(

      Number(user.wallet || 0)

      < amount

    ){

      return res.status(400)
      .json({

        success:false,

        error:
        "Insufficient balance"

      });

    }


    // DEDUCT
    await userRef.update({

      wallet:
      admin.firestore
      .FieldValue
      .increment(-amount)

    });


    // REQUEST ID
    const request_id =

      "ELEC_" +
      Date.now();


    // API CALL
    const response =
    await axios.post(

      "https://iacafe.com.ng/devapi/v1/electricity",

      {

        request_id,

        customer_id:
        meterNumber,

        service_id:
        disco,

        variation_id:
        meterType,

        amount

      },

      {

        headers:{

          Authorization:
          `Bearer ${process.env.IACAFE_API_KEY}`,

          "Content-Type":
          "application/json"

        }

      }

    );


    const result =
    response.data;


    // CHECK SUCCESS
    const success =

      result?.code ===
      "success";


    if(!success){

      throw new Error(

        result?.message ||

        "Purchase failed"

      );

    }


    const token =

      result?.data
      ?.token ||

      "N/A";


    // SAVE TRANSACTION
    await db.collection(
      "transactions"
    )

    .doc(request_id)

    .set({

      userId,

      email:
      user.email || "",

      type:
      "electricity",

      status:
      "success",

      disco,

      meterType,

      meterNumber,

      token,

      units:
      result?.data
      ?.units || "",

      band:
      result?.data
      ?.band || "",

      customerName:
      result?.data
      ?.customer_name || "",

      customerAddress:
      result?.data
      ?.customer_address || "",

      amount,

      createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

    });


    // CASHBACK
    const cashback =

      Math.floor(
        amount * 0.01
      );


    await userRef.update({

      cashbackBalance:
      admin.firestore
      .FieldValue
      .increment(cashback)

    });


    // CASHBACK TRANSACTION
    await db.collection(
      "transactions"
    )

    .add({

      userId,

      email:
      user.email || "",

      type:
      "cashback",

      status:
      "success",

      amount:
      cashback,

      description:
      "Electricity cashback",

      createdAt:
      admin.firestore
      .FieldValue
      .serverTimestamp()

    });


    return res.json({

      success:true,

      message:
      "Electricity purchase successful",

      token,

      units:
      result?.data
      ?.units || "",

      band:
      result?.data
      ?.band || "",

      cashback

    });

  }

  catch(error){

    console.log(
      "ELECTRICITY ERROR:",
      error.message
    );


    // REFUND
    try{

      if(

        userRef &&

        amount > 0

      ){

        await userRef.update({

          wallet:
          admin.firestore
          .FieldValue
          .increment(amount)

        });

      }

    }

    catch(refundError){

      console.log(
        "REFUND ERROR:",
        refundError.message
      );

    }


    return res.status(500)
    .json({

      success:false,

      error:

      error.message ||

      "Electricity failed"

    });

  }

};
