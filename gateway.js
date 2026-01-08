// gateway.js - API Gateway/Load Balancer for Render
// This replaces Nginx for Render deployment
// Uses Express with http-proxy-middleware for load balancing

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

<<<<<<< Updated upstream
// Handle OPTIONS requests FIRST (before any other middleware)
// This is critical for CORS preflight requests
=======
// Helper function to normalize backend URLs
// Render's fromService.property.host returns just hostname, need to add https://
const normalizeBackendUrl = (url) => {
  if (!url) return null;
  // If already has protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Add https:// for Render deployments
  return `https://${url}`;
};

// Backend instances - normalize URLs to ensure they have https://
const rawBackends = [
  process.env.BACKEND_1_URL,
  process.env.BACKEND_2_URL,
  process.env.BACKEND_3_URL,
].filter(Boolean);

const backends = rawBackends.map(normalizeBackendUrl).filter(Boolean);

// Fallback to localhost for development
if (backends.length === 0) {
  backends.push('http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003');
}

let currentBackend = 0;

// Round-robin load balancing
const getNextBackend = () => {
  if (backends.length === 0) {
    throw new Error('No backend servers available');
  }
  const backend = backends[currentBackend];
  currentBackend = (currentBackend + 1) % backends.length;
  return backend;
};

// Enable CORS for all routes FIRST (before any other middleware)
// This is critical for CORS preflight requests
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
  preflightContinue: false, // Don't continue to next middleware for OPTIONS
}));

// Explicit OPTIONS handler for all routes (backup, though CORS middleware should handle it)
>>>>>>> Stashed changes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

<<<<<<< Updated upstream
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

=======
app.use(express.json());

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
// Create a single proxy instance that uses router function for dynamic routing
const apiProxy = createProxyMiddleware({
  target: backends[0] || 'http://localhost:3001', // Default target (router will override)
  changeOrigin: true,
  secure: true, // Verify SSL certificates
  timeout: 30000, // 30 second timeout
  router: (req) => {
    // Round-robin routing - called for each request
    const backend = getNextBackend();
    console.log(`[Gateway] Routing ${req.method} ${req.path} to ${backend}`);
    return backend;
  },
  // No pathRewrite needed - keep /api path as-is
  // Frontend calls /api/auth/login -> backend receives /api/auth/login
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forward original host and protocol
      proxyReq.setHeader('X-Forwarded-For', req.ip || req.socket.remoteAddress);
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol || 'https');
      proxyReq.setHeader('X-Forwarded-Host', req.get('host') || '');
      proxyReq.setHeader('X-Real-IP', req.ip || req.socket.remoteAddress);
      console.log(`[Gateway] Proxying ${req.method} ${req.path} to ${proxyReq.getHeader('host')}${proxyReq.path}`);
    },
    proxyRes: (proxyRes, req, res) => {
      // Add CORS headers to response (in case backend doesn't)
      proxyRes.headers['access-control-allow-origin'] = '*';
      proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
      proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With';
>>>>>>> Stashed changes
      console.log(`[Gateway] Response ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    error: (err, req, res) => {
      console.error('[Gateway] Proxy error:', err.message);
      console.error('[Gateway] Request path:', req.path);
<<<<<<< Updated upstream
      console.error('[Gateway] Available backends:', backends);
      // Try next backend on error
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: 'Backend service unavailable',
          error: err.message,
        });
=======
      console.error('[Gateway] Request method:', req.method);
      console.error('[Gateway] Available backends:', backends);
      
      // Set CORS headers even on error
      if (!res.headersSent) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
          res.status(503).json({
            success: false,
            message: 'Backend service unavailable or sleeping (free tier)',
            error: err.message,
            code: err.code,
          });
        } else {
          res.status(502).json({
            success: false,
            message: 'Gateway proxy error',
            error: err.message,
            code: err.code,
          });
        }
>>>>>>> Stashed changes
      }
    },
  },
  logLevel: 'debug',
<<<<<<< Updated upstream
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
=======
});

// API proxy - handle all /api routes
app.use('/api', (req, res, next) => {
  // OPTIONS requests should already be handled by CORS middleware
  // But add explicit check as backup
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Use the proxy middleware
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`⏱️  Request timeout: 30 seconds`);
>>>>>>> Stashed changes
});

