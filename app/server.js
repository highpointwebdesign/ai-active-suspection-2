import express from 'express';
import https from 'https';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3443;
const DIST_DIR = join(__dirname, 'dist');

// Middleware
app.use(compression());
app.use((req, res, next) => {
  // Set CORS headers for local network access
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Service worker caching headers
  if (req.path === '/sw.js' || req.path === '/manifest.json') {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  next();
});

// Serve static files
app.use(express.static(DIST_DIR));

// Explicit routes for manifest and service worker
app.get('/manifest.json', (req, res) => {
  res.type('application/json').sendFile(join(DIST_DIR, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.type('application/javascript').sendFile(join(DIST_DIR, 'sw.js'));
});

// API proxy to ESP32
app.use('/api', (req, res, next) => {
  const targetIp = req.headers['x-esp32-ip'];
  
  if (!targetIp) {
    return res.status(400).json({ error: 'Missing X-ESP32-IP header', hint: 'Set ESP32 IP in Settings first' });
  }
  
  const targetPath = `/api${req.url}`;
  const targetUrl = new URL(`http://${targetIp}${targetPath}`);

  const headers = { ...req.headers };
  delete headers.host;

  const proxyReq = http.request(
    {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: req.method,
      headers
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 500);
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (value !== undefined) res.setHeader(key, value);
      });
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: 'Bad gateway', details: err.message });
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
});

// SPA fallback - serve index.html for all non-asset routes
app.get('*', (req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'));
});

// HTTPS options
const httpsOptions = {
  key: fs.readFileSync(join(__dirname, 'certs', 'localhost-key.pem')),
  cert: fs.readFileSync(join(__dirname, 'certs', 'localhost.pem'))
};

// Create HTTPS server
const server = https.createServer(httpsOptions, app);

// WebSocket proxy
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  if (request.url.startsWith('/ws')) {
    const url = new URL(request.url, 'http://localhost');
    const esp32Ip = url.searchParams.get('ip');
    
    if (!esp32Ip) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, async (ws) => {
      const WebSocket = (await import('ws')).default;
      const esp32Ws = new WebSocket(`ws://${esp32Ip}/ws`);
      
      // Forward messages both ways
      ws.on('message', (data) => {
        if (esp32Ws.readyState === WebSocket.OPEN) esp32Ws.send(data);
      });
      
      esp32Ws.on('message', (data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });
      
      // Handle disconnections
      ws.on('close', () => esp32Ws.close());
      esp32Ws.on('close', () => ws.close());
      esp32Ws.on('error', (err) => {
        console.error('ESP32 WS error:', err.message);
        ws.close();
      });
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Suspension Control App running!`);
  console.log(`\n📱 Local:   https://localhost:${PORT}`);
  console.log(`🌐 Network: https://192.168.87.23:${PORT}`);
  console.log(`\n💾 To install on phone:`);
  console.log(`   1. Open https://192.168.87.23:${PORT} on your phone`);
  console.log(`   2. Accept the security certificate (trust mkcert CA)`);
  console.log(`   3. Tap the share/menu button`);
  console.log(`   4. Select "Add to Home Screen"`);
  console.log(`\n✅ Server ready for PWA installation\n`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});
