export async function transferService(data){

  const response =
    await fetch(

      "https://biva-backend-ezvu.onrender.com/api/transfer",

      {
        method:"POST",

        headers:{
          "Content-Type":
          "application/json"
        },

        body:
          JSON.stringify(data)
      }

    );

  const result =
    await response.json();

  if(!result.success){

    throw new Error(
      result.error
    );

  }

  return result;

}
