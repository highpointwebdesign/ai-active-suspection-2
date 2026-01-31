# ESP32 Active Suspension - PWA Application

Modern PWA interface for controlling the ESP32 Active Suspension system.

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Capacitor** - Native app packaging for Android/iOS

## Development

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Install Dependencies
```bash
cd app
npm install
```

### Development Server
```bash
npm run dev
```
Opens at http://localhost:3000 with proxy to ESP32 at 192.168.4.1

### Build for Production
```bash
npm run build
```

### Package as Android APK

1. Initialize Capacitor (first time only):
```bash
npm run cap:init
```

2. Add Android platform (first time only):
```bash
npm run cap:add
```

3. Sync web assets to native project:
```bash
npm run cap:sync
```

4. Open in Android Studio to build APK:
```bash
npm run cap:open
```

## Project Structure

```
app/
├── src/
│   ├── api/
│   │   └── esp32.js          # ESP32 API client
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page components
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── App.css               # Styles
├── index.html                # HTML template
├── package.json              # Dependencies
└── vite.config.js            # Vite configuration
```

## ESP32 Connection

The app connects to ESP32 at `192.168.4.1` by default (Access Point mode).

To change the IP address:
- Click settings icon in app
- Enter custom IP address
- IP is saved to localStorage

## API Endpoints Used

- `GET /api/health` - Health check
- `GET /api/config` - Get configuration
- `POST /api/config` - Update configuration
- `GET /api/battery-config` - Get battery config
- `POST /api/battery-config` - Update battery config
- `GET /api/servo-config` - Get servo config
- `POST /api/servo-config` - Update servo config
- `POST /api/calibrate` - Calibrate servo
- `WS /ws` - WebSocket for live data

## Features

- Real-time sensor data via WebSocket
- Configuration management
- Battery monitoring with color-coded status
- Servo calibration
- Offline detection with retry
- Responsive mobile-first design
- PWA features (installable, cached assets)
