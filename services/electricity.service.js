const BASE_URL =
"https://biva-backend-ezvu.onrender.com/api";


// ===============================
// VERIFY METER
// ===============================

export async function verifyMeterService({

  disco,
  meterNumber,
  meterType

}){

  const res = await fetch(

    `${BASE_URL}/electricity/verify`,

    {

      method:"POST",

      headers:{
        "Content-Type":
        "application/json"
      },

      body:JSON.stringify({

        disco,
        meterNumber,
        meterType

      })

    }

  );


  const data =
  await res.json();


  if(!res.ok || !data.success){

    throw new Error(

      data.error ||

      "Meter verification failed"

    );

  }


  return data;

}



// ===============================
// BUY ELECTRICITY
// ===============================

export async function buyElectricityService(payload){

  const res = await fetch(

    `${BASE_URL}/electricity/buy`,

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


  const data =
  await res.json();


  if(!res.ok || !data.success){

    throw new Error(

      data.error ||

      "Electricity purchase failed"

    );

  }


  return data;

}