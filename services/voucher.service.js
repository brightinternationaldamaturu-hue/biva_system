import {
  db
}
from "../firebase/config.js";

import {

  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  addDoc,
  collection

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// CREATE PURCHASE LOCK
// ===============================

export async function createPurchaseLock(

  userId,
  txId

){

  const lockRef =
  doc(

    db,

    "purchaseLocks",

    userId

  );


  const lockSnap =
  await getDoc(lockRef);


  if(

    lockSnap.exists() &&

    lockSnap.data().locked

  ){

    throw new Error(

      "Transaction already processing"

    );

  }


  await setDoc(

    lockRef,

    {

      locked:true,

      txId,

      createdAt:
      serverTimestamp()

    }

  );

}


// ===============================
// RELEASE LOCK
// ===============================

export async function releasePurchaseLock(

  userId

){

  await setDoc(

    doc(
      db,
      "purchaseLocks",
      userId
    ),

    {

      locked:false

    },

    { merge:true }

  );

}


// ===============================
// DEDUCT WALLET
// ===============================

export async function deductWallet(

  userId,
  amount

){

  const userRef =
  doc(
    db,
    "users",
    userId
  );


  await runTransaction(

    db,

    async(transaction)=>{

      const userSnap =
      await transaction.get(
        userRef
      );


      if(!userSnap.exists()){

        throw new Error(
          "User not found"
        );

      }


      const wallet =
      Number(

        userSnap.data()
        .wallet || 0

      );


      if(wallet < amount){

        throw new Error(
          "Insufficient balance"
        );

      }


      transaction.update(

        userRef,

        {

          wallet:
          wallet - amount

        }

      );

    }

  );

}










// ===============================
// GENERATE VOUCHER
// ===============================

export async function generateVoucher(

  payload

){

  const res = await fetch(

    "https://hook.us2.make.com/pm61x9gphx81e59lrvy1q7tmnfsd7ggo",

    {

      method:"POST",

      headers:{

        "Content-Type":
        "application/json"

      },

      body:JSON.stringify(
        payload
      )

    }

  );


  if(!res.ok){

    throw new Error(
      "Voucher server error"
    );

  }


  const data =
  await res.json();


  if(!data.voucher){

    throw new Error(
      "Voucher not received"
    );

  }


  return data.voucher;

}





// ===============================
// SAVE VOUCHER
// ===============================

export async function saveVoucher({

  voucher,
  userId,
  email,
  plan,
  price

}){

  await setDoc(

    doc(
      db,
      "vouchers",
      voucher
    ),

    {

      code:voucher,

      plan,

      price,

      used:false,

      userId,

      email,

      createdAt:
      serverTimestamp()

    }

  );

}







async function buyVoucher(){

  try{

    showLoader(
      "Generating voucher..."
    );

    const txId =
    "TX_" + Date.now();


    await createPurchaseLock(
      user.uid,
      txId
    );


    const voucher =
    await generateVoucher({

      plan,
      price,
      email:user.email,
      txId

    });


    await deductWallet(
      user.uid,
      price
    );


    await saveVoucher({

      voucher,
      userId:user.uid,
      email:user.email,
      plan,
      price

    });


    showSuccess(
      "Voucher generated successfully"
    );

  }

  catch(error){

    showError(
      error.message
    );

  }

  finally{

    await releasePurchaseLock(
      user.uid
    );

    hideLoader();

  }

}








// ===============================
// BUY VOUCHER SERVICE
// ===============================

export async function buyVoucherService({

  userId,
  email,
  price,
  plan

}){

  const txId =

    "TX_" +

    Date.now();


  // CREATE LOCK
  await createPurchaseLock(

    userId,
    txId

  );


  try{

    // GENERATE VOUCHER
    const voucher =
    await generateVoucher({

      plan,
      price,
      email,
      txId

    });


    // DEDUCT WALLET
    await deductWallet(

      userId,
      price

    );


    // SAVE VOUCHER
    await saveVoucher({

      voucher,
      userId,
      email,
      plan,
      price

    });


// SAVE TRANSACTION
await addDoc(

  collection(

    db,
    "users",
    userId,
    "transactions"

  ),

  {

    title:
    `${plan} Voucher`,

    amount:price,

    type:"debit",

    category:"voucher",

    status:"success",

    reference:
    txId,

    provider:"BIVA",

    voucher,

    createdAt:
    serverTimestamp()

  }

);

// ADMIN NOTIFICATION
await addDoc(

  collection(
    db,
    "adminNotifications"
  ),

  {

    title:
    "Voucher Purchase",

    message:
    `${email} bought ${plan} voucher for ₦${Number(price).toLocaleString("en-NG")}`,

    type:"voucher",

    read:false,

    voucher,

    amount:price,

    createdAt:
    serverTimestamp()

  }

);
    return {

      success:true,

      voucher

    };

  }


  finally{

    // RELEASE LOCK
    await releasePurchaseLock(
      userId
    );

  }

}