// Main auth handler that routes to specific auth functions
const setupHandler = require('./auth/setup');
const loginHandler = require('./auth/login');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the path to determine which auth function to call
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  console.log('Auth API called:', {
    method: req.method,
    url: req.url,
    pathname: url.pathname,
    pathSegments
  });

  // Routes: /api/auth/login, /api/auth/setup, /auth/login, /auth/setup
  const action = pathSegments[pathSegments.length - 1]; // last segment
  
  try {
    if (action === 'login') {
      console.log('Routing to login handler');
      return await loginHandler(req, res);
    } else if (action === 'setup') {
      console.log('Routing to setup handler');
      return await setupHandler(req, res);
    } else {
      console.log('Unknown auth action:', action);
      return res.status(404).json({ 
        error: 'Auth endpoint not found',
        availableEndpoints: ['/auth/login', '/auth/setup'],
        requestedPath: url.pathname
      });
    }
  } catch (error) {
    console.error('Auth routing error:', error);
    return res.status(500).json({ 
      error: 'Auth routing failed: ' + error.message 
    });
  }
};
