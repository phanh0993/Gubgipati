// Netlify function wrapper for Express app
const serverless = require('serverless-http');
const app = require('../../server/index');

// Wrap Express app for serverless
const handler = serverless(app);

exports.handler = async (event, context) => {
  // Handle serverless function
  const result = await handler(event, context);
  return result;
};
