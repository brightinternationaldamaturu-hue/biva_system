export async function buyVoucherService(data){

  const response = await fetch(

    "/api/voucher/buy",

    {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify(data)

    }

  );

  const result = await response.json();

  if(!response.ok){

    throw new Error(

      result.error ||

      "Voucher purchase failed"

    );

  }

  return result;

}
