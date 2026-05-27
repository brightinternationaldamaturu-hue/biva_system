import { db } from "../firebase/config.js";

import {

  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ===============================
// SAVE TRANSACTION
// ===============================

export async function saveTransaction(transaction){

  try{

    await addDoc(

      collection(db, "transactions"),

      {

        userId:
        transaction.userId || "",

        title:
        transaction.title || "Transaction",

        amount:
        Number(transaction.amount || 0),

        type:
        transaction.type || "debit",

        category:
        transaction.category || "general",

        status:
        transaction.status || "success",

        provider:
        transaction.provider || "BIVA",

        phone:
        transaction.phone || "",

        network:
        transaction.network || "",

        plan:
        transaction.plan || "",

        reference:
        transaction.reference ||

        "BIVA_" + Date.now(),

        request_id:
        transaction.request_id || "",

        failureReason:
        transaction.failureReason || "",

        createdAt:
        serverTimestamp()

      }

    );

  }

  catch(error){

    console.log(
      "SAVE TRANSACTION ERROR:",
      error
    );

    throw error;

  }

}



// ===============================
// REALTIME TRANSACTIONS
// ===============================

export function listenToTransactions(

  uid,
  callback

){

  const q = query(

    collection(db, "transactions"),

    where("userId", "==", uid),

    orderBy("createdAt", "desc")

  );

  return onSnapshot(q, (snapshot)=>{

    const transactions = [];

    snapshot.forEach((doc)=>{

      transactions.push({

        id:doc.id,
        ...doc.data()

      });

    });

    callback(transactions);

  });

}