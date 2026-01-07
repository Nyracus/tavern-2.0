// gateway.js - API Gateway/Load Balancer for Render
// This replaces Nginx for Render deployment
// Uses Express with http-proxy-middleware for load balancing

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Handle OPTIONS requests FIRST (before any other middleware)
// This is critical for CORS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// Enable CORS for all routes (allow frontend to call API Gateway)
// Configure CORS with explicit options for preflight requests
app.use(cors({
  origin: true, // Allow all origins (or specify your frontend URL)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
}));

app.use(express.json());

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
    const backend = getNextBackend();
    // Render provides full URLs like https://service.onrender.com
    // Backends have routes under /api, so proxy /api/* to backend/api/*
    return backend;
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forward original host
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
      console.log(`[Gateway] Proxying ${req.method} ${req.path} to ${proxyReq.path}`);
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`[Gateway] Response ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    error: (err, req, res) => {
      console.error('[Gateway] Proxy error:', err.message);
      console.error('[Gateway] Request path:', req.path);
      console.error('[Gateway] Available backends:', backends);
      // Try next backend on error
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: 'Backend service unavailable',
          error: err.message,
        });
      }
    },
  },
  logLevel: 'debug',
};

// Create proxy middleware instance
const apiProxy = createProxyMiddleware(proxyOptions);

// API proxy - exclude OPTIONS requests (handled above)
app.use('/api', (req, res, next) => {
  // Don't proxy OPTIONS requests - they're handled by CORS middleware above
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Proxy all other requests
  apiProxy(req, res, next);
});

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

