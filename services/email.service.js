const brevo = require('@getbrevo/brevo');

// Create API client
const apiInstance = new brevo.TransactionalEmailsApi();

// Configure API key correctly (v5 style)
apiInstance.authentications = {
  'api-key': {
    type: 'apiKey',
    apiKey: process.env.BREVO_API_KEY,
    in: 'header',
    name: 'api-key',
  },
};

module.exports = apiInstance;