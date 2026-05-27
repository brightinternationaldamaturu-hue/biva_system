// ===============================
// LOAD DATA PLANS
// ===============================

export async function getDataPlans(

  network

){

  const networkMap = {

    mtn:1,
    glo:2,
    "9mobile":3,
    airtel:4

  };


  const network_id =

  networkMap[
    network.toLowerCase()
  ];


  const res = await fetch(

    `https://biva-backend-ezvu.onrender.com/api/data/plans/${network_id}`

  );


  const data =
  await res.json();


  if(

    !res.ok ||

    !data.success

  ){

    throw new Error(

      data.error ||

      "Failed to load plans"

    );

  }


  return data.data || [];

}



// ===============================
// BUY DATA
// ===============================

export async function buyDataService(

  payload

){

  const res = await fetch(

    "https://biva-backend-ezvu.onrender.com/api/data/buy",

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


  if(

    !res.ok ||

    !data.success

  ){

    throw new Error(

      data.message ||

      "Data purchase failed"

    );

  }


  return data;

}