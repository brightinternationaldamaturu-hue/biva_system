const brevo = require('@getbrevo/brevo');

// Create API instance
const apiInstance = new brevo.TransactionalEmailsApi();

// Set API key (IMPORTANT FIX)
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

module.exports = apiInstance;
