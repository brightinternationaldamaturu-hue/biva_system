import { auth } from "../firebase/config.js";

export async function buyAirtimeService(data){

  const token =
    await auth.currentUser.getIdToken();

  const response = await fetch(

    "https://biva-backend-ezvu.onrender.com/api/buy-airtime",

    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({

        userId:
          auth.currentUser.uid,

        email:
          auth.currentUser.email,

        ...data
      })
    }

  );

  const result =
    await response.json();

  if(!response.ok){

    throw new Error(

      result.error ||

      "Airtime purchase failed"

    );

  }

  return result;

}