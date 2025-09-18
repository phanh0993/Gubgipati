const http = require('http');
const url = require('url');
require('dotenv').config({ path: './server/.env' });

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  console.log(`${req.method} ${path}`);

  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'OK',
      message: 'JULY SPA API Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }));
  } else if (path === '/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Test endpoint working',
      database_url: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Route ${path} not found`
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 JULY SPA API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = server;

