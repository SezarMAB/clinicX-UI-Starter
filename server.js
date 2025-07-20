const express = require('express');
const compression = require('compression');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4200;

// Enable gzip compression for all responses
app.use(compression({
  // Options for compression
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, where 9 is best compression but slowest)
  threshold: 1024, // Only compress files larger than 1KB
  memLevel: 8,
}));

// Proxy API requests to backend server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080/api',
  changeOrigin: true,
  logger: console,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} ${req.url} to backend`);
    },
    error: (err, req, res) => {
      console.error('Proxy error:', err);
      if (res && !res.headersSent) {
        res.status(500).json({ error: 'Proxy error', message: err.message });
      }
    }
  }
}));

// Serve static files from the dist/browser directory (Angular v20 output)
const staticPath = path.join(__dirname, 'dist/starter/browser');
app.use(express.static(staticPath, {
  // Enable strong ETags for better caching
  etag: true,
  // Set cache control headers
  maxAge: '1y',
  // Set proper headers for compressed files
  setHeaders: (res, filePath) => {
    // Set cache headers based on file type
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Handle Angular routing - fallback to index.html
app.use((req, res, next) => {
  // Only handle GET requests for paths without file extensions
  if (req.method === 'GET' && !path.extname(req.path)) {
    res.sendFile(path.join(staticPath, 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('API proxy configured to http://localhost:8080');
  console.log('Compression is enabled for all text-based responses');
});
