export async function buyVoucherService({

  userId,
  desc

}) {

  const response = await fetch(

    "/api/buy-voucher",

    {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body: JSON.stringify({

        userId,
        desc

      })

    }

  );

  const data = await response.json();

  if (!response.ok || !data.success) {

    throw new Error(

      data.error ||

      "Voucher purchase failed"

    );

  }

  return data;

}
