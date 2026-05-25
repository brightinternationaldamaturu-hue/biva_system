const brevo = require("@getbrevo/brevo");

// ===============================
// API INSTANCE
// ===============================

const apiInstance =
  new brevo.TransactionalEmailsApi();

// ===============================
// API KEY
// ===============================

apiInstance.setApiKey(

  brevo.TransactionalEmailsApiApiKeys.apiKey,

  process.env.BREVO_API_KEY

);

// ===============================
// SEND EMAIL
// ===============================

async function sendEmail({

  to,
  subject,
  html

}) {

  try {

    const sendSmtpEmail =
      new brevo.SendSmtpEmail();

    sendSmtpEmail.subject =
      subject;

    sendSmtpEmail.htmlContent =
      html;

    sendSmtpEmail.sender = {

      name: "BIVA",

      email:
        "noreply@biva.com"

    };

    sendSmtpEmail.to = [

      {

        email: to

      }

    ];

    const result =
      await apiInstance.sendTransacEmail(
        sendSmtpEmail
      );

    console.log(
      "EMAIL SENT:",
      result
    );

    return result;

  }

  catch(err){

    console.log(
      "EMAIL ERROR:",
      err.message
    );

  }

}

// ===============================
// EMAIL TEMPLATE
// ===============================

function transactionTemplate({

  title,
  amount,
  status,
  reference

}) {

  return `

  <div style="
    background:#0f172a;
    padding:30px;
    font-family:Arial;
    color:white;
  ">

    <h2 style="
      color:#00D492;
      margin-bottom:20px;
    ">
      BIVA Transaction Alert
    </h2>

    <div style="
      background:#111827;
      padding:20px;
      border-radius:14px;
    ">

      <h3>${title}</h3>

      <p>
        Amount:
        <b>
          ₦${Number(amount).toLocaleString()}
        </b>
      </p>

      <p>
        Status:
        <b>
          ${status}
        </b>
      </p>

      <p>
        Reference:
        <b>
          ${reference}
        </b>
      </p>

    </div>

    <p style="
      margin-top:20px;
      opacity:.7;
    ">
      Thank you for using BIVA.
    </p>

  </div>

  `;

}

// ===============================

module.exports = {

  sendEmail,
  transactionTemplate

};
