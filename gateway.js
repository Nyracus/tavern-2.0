// gateway.js - API Gateway/Load Balancer for Render
// This replaces Nginx for Render deployment
// Uses Express with http-proxy-middleware for load balancing

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Backend instances
const backends = [
  process.env.BACKEND_1_URL || 'http://localhost:3001',
  process.env.BACKEND_2_URL || 'http://localhost:3002',
  process.env.BACKEND_3_URL || 'http://localhost:3003',
].filter(Boolean);

let currentBackend = 0;

// Round-robin load balancing
const getNextBackend = () => {
  const backend = backends[currentBackend];
  currentBackend = (currentBackend + 1) % backends.length;
  return backend;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    gateway: 'tavern-api-gateway',
    backends: backends.length,
    timestamp: new Date().toISOString(),
  });
});

// Proxy middleware configuration
const proxyOptions = {
  target: getNextBackend(),
  changeOrigin: true,
  router: (req) => {
    // Round-robin routing
    return getNextBackend();
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forward original host
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
    },
    error: (err, req, res) => {
      console.error('Proxy error:', err.message);
      // Try next backend on error
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: 'Backend service unavailable',
        });
      }
    },
  },
  logLevel: 'warn',
};

// API proxy
app.use('/api', createProxyMiddleware(proxyOptions));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Tavern API Gateway',
    version: '1.0.0',
    backends: backends,
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Tavern API Gateway running on port ${PORT}`);
  console.log(`📡 Load balancing across ${backends.length} backends:`);
  backends.forEach((backend, i) => {
    console.log(`   ${i + 1}. ${backend}`);
  });
});

