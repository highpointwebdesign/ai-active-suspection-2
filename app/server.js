import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
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

// API proxy to ESP32
app.use('/api', (req, res, next) => {
  const target = 'http://192.168.4.1' + req.url;
  res.redirect(307, target);
});

// SPA fallback - serve index.html for all non-asset routes
app.get('*', (req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Suspension Control App running!`);
  console.log(`\n📱 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.87.23:${PORT}`);
  console.log(`\n💾 To install on phone:`);
  console.log(`   1. Open http://192.168.87.23:${PORT} on your phone`);
  console.log(`   2. Tap the share/menu button`);
  console.log(`   3. Select "Add to Home Screen"`);
  console.log(`\n✅ Server ready for PWA installation\n`);
});
