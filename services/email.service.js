const brevo = require('@getbrevo/brevo');

const client = brevo.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new brevo.TransactionalEmailsApi();

module.exports = apiInstance;
