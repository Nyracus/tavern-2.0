// gateway.js - API Gateway/Load Balancer for Render
// This replaces Nginx for Render deployment
// Uses Express with http-proxy-middleware for load balancing

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Helper function to normalize backend URLs
// Render's fromService.property.host returns hostname, need to add https://
// Also handles service names that need to be converted to full hostnames
const normalizeBackendUrl = (url) => {
  if (!url) return null;
  
  // If already has protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's just a service name (no dots), convert to Render hostname format
  // e.g., "tavern-backend-1" -> "tavern-backend-1.onrender.com"
  if (!url.includes('.')) {
    console.warn(`[Gateway] Service name detected: ${url}, converting to hostname`);
    return `https://${url}.onrender.com`;
  }
  
  // If it's a hostname without protocol, add https://
  return `https://${url}`;
};

// Backend instances - normalize URLs to ensure they have https://
const rawBackends = [
  process.env.BACKEND_1_URL,
  process.env.BACKEND_2_URL,
  process.env.BACKEND_3_URL,
].filter(Boolean);

const backends = rawBackends.map(normalizeBackendUrl).filter(Boolean);

// Validate backend URLs
const invalidBackends = backends.filter(url => {
  try {
    const urlObj = new URL(url);
    return !urlObj.hostname || (!urlObj.hostname.includes('.') && !urlObj.hostname.includes('localhost'));
  } catch {
    return true;
  }
});

if (invalidBackends.length > 0) {
  console.error('[Gateway] Invalid backend URLs detected:', invalidBackends);
  console.error('[Gateway] URLs must be valid HTTP/HTTPS URLs with hostname');
}

// Log backend configuration for debugging
if (backends.length > 0) {
  console.log('[Gateway] Configured backend URLs:');
  backends.forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`);
  });
} else {
  console.warn('[Gateway] No backend URLs configured! Using localhost fallback.');
  console.warn('[Gateway] Set BACKEND_1_URL, BACKEND_2_URL, BACKEND_3_URL environment variables.');
  console.warn('[Gateway] In Render, use fromService to reference backend services:');
  console.warn('  fromService:');
  console.warn('    type: web');
  console.warn('    name: tavern-backend-1');
  console.warn('    property: host');
}

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
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

app.use(express.json());
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    gateway: 'tavern-api-gateway',
    backends: backends.length,
    backendUrls: backends, // Include URLs for debugging
    rawBackendEnvVars: {
      BACKEND_1_URL: process.env.BACKEND_1_URL || 'not set',
      BACKEND_2_URL: process.env.BACKEND_2_URL || 'not set',
      BACKEND_3_URL: process.env.BACKEND_3_URL || 'not set',
    },
    timestamp: new Date().toISOString(),
  });
});

// Create a single proxy instance that uses router function for dynamic routing
const apiProxy = createProxyMiddleware({
  target: backends[0] || 'http://localhost:3001', // Default target (router will override)
  changeOrigin: true,
  secure: true, // Verify SSL certificates
  timeout: 30000, // 30 second timeout
  router: (req) => {
    // Round-robin routing - called for each request
    const backend = getNextBackend();
    // Store backend URL in request for error logging
    req._gatewayBackend = backend;
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
      console.log(`[Gateway] Response ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    error: (err, req, res) => {
      console.error('[Gateway] Proxy error:', err.message);
      console.error('[Gateway] Error code:', err.code);
      console.error('[Gateway] Request path:', req.path);
      console.error('[Gateway] Request method:', req.method);
      console.error('[Gateway] Available backends:', backends);
      console.error('[Gateway] Attempted backend:', req._gatewayBackend || 'unknown');
      
      // Set CORS headers even on error
      if (!res.headersSent) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        // Provide more helpful error messages
        if (err.code === 'ENOTFOUND') {
          res.status(503).json({
            success: false,
            message: 'Backend service hostname not found. Service may be sleeping (free tier) or URL misconfigured.',
            error: err.message,
            code: err.code,
            hint: 'Check that BACKEND_1_URL, BACKEND_2_URL, BACKEND_3_URL are set correctly in Render environment variables.',
          });
        } else if (err.code === 'ECONNREFUSED') {
          res.status(503).json({
            success: false,
            message: 'Backend service connection refused. Service may be sleeping (free tier).',
            error: err.message,
            code: err.code,
            hint: 'Free tier services sleep after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.',
          });
        } else if (err.code === 'ETIMEDOUT') {
          res.status(503).json({
            success: false,
            message: 'Backend service request timeout. Service may be sleeping (free tier).',
            error: err.message,
            code: err.code,
            hint: 'Free tier services take time to wake up. Please try again in a few seconds.',
          });
        } else {
          res.status(502).json({
            success: false,
            message: 'Gateway proxy error',
            error: err.message,
            code: err.code,
          });
        }
      }
    },
  },
  logLevel: 'debug',
});

// API proxy - handle all /api routes
app.use('/api', (req, res, next) => {
  // OPTIONS requests should already be handled by CORS middleware
  // But add explicit check as backup
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Use the proxy middleware
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
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`⏱️  Request timeout: 30 seconds`);
});

