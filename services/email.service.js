const brevo = require("@getbrevo/brevo");

// =========================
// API INSTANCE
// =========================

const apiInstance =
  new brevo.TransactionalEmailsApi();

// =========================
// API KEY
// =========================

apiInstance.setApiKey(

  brevo.TransactionalEmailsApiApiKeys.apiKey,

  process.env.BREVO_API_KEY

);

// =========================
// SEND EMAIL
// =========================

async function sendEmail({

  to,
  subject,
  html

}) {

  const sendSmtpEmail =
    new brevo.SendSmtpEmail();

  sendSmtpEmail.subject =
    subject;

  sendSmtpEmail.htmlContent =
    html;

  sendSmtpEmail.sender = {

    name: "BIVA",
    email: "noreply@biva.ng"

  };

  sendSmtpEmail.to = [

    {
      email: to
    }

  ];

  return await apiInstance
    .sendTransacEmail(
      sendSmtpEmail
    );

}

// =========================
// EMAIL TEMPLATE
// =========================

function transactionTemplate({

  title,
  amount,
  status,
  reference

}) {

  return `

  <div style="
    font-family:Arial;
    background:#0F172A;
    color:white;
    padding:30px;
  ">

    <h2 style="
      color:#00D492;
    ">
      ${title}
    </h2>

    <p>
      Your transaction was successful.
    </p>

    <div style="
      background:#111827;
      padding:20px;
      border-radius:14px;
      margin-top:20px;
    ">

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

  </div>

  `;

}

module.exports = {

  sendEmail,
  transactionTemplate

};
