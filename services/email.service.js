const brevo = require("@getbrevo/brevo");


// ===============================
// CONFIG
// ===============================

const apiInstance =

  new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(

  brevo.TransactionalEmailsApiApiKeys.apiKey,

  process.env.BREVO_API_KEY

);


// ===============================
// TEMPLATE
// ===============================

function transactionTemplate({

  title,
  amount,
  status,
  reference

}){

  return `

  <div style="
    background:#07111F;
    padding:40px;
    font-family:Arial;
    color:white;
  ">

    <div style="
      max-width:500px;
      margin:auto;
      background:#0F172A;
      border-radius:24px;
      padding:30px;
    ">

      <h1 style="
        color:#00D492;
        margin-top:0;
      ">
        BIVA
      </h1>

      <h2>
        ${title}
      </h2>

      <p>
        Your transaction was successful.
      </p>

      <div style="
        background:#07111F;
        padding:20px;
        border-radius:18px;
        margin-top:20px;
      ">

        <p>
          <strong>Amount:</strong>
          ₦${Number(amount)
            .toLocaleString("en-NG")}
        </p>

        <p>
          <strong>Status:</strong>
          ${status}
        </p>

        <p>
          <strong>Reference:</strong>
          ${reference}
        </p>

      </div>

      <p style="
        margin-top:30px;
        opacity:.7;
      ">
        Thank you for using BIVA ❤️
      </p>

    </div>

  </div>

  `;

}


// ===============================
// SEND EMAIL
// ===============================

async function sendEmail({

  to,
  subject,
  html

}){

  try{

    const email =

      new brevo.SendSmtpEmail();

    email.sender = {

      name: "BIVA",

      email: "noreply@biva.com.ng"

    };

    email.to = [

      { email: to }

    ];

    email.subject = subject;

    email.htmlContent = html;

    await apiInstance.sendTransacEmail(
      email
    );

    console.log(
      "EMAIL SENT:",
      to
    );

  }

  catch(err){

    console.log(
      "EMAIL ERROR:",
      err.message
    );

  }

}


module.exports = {

  sendEmail,
  transactionTemplate

};