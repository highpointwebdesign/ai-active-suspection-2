# ESP32 Active Suspension Management System

**⚠️ NONE OF THIS HAS BEEN TESTED ON HARDWARE - THIS IS ONLY CONCEPTUAL AT THIS POINT**

A complete solution for ESP32-based active suspension control for RC vehicles, featuring a modern PWA interface and real-time sensor feedback.

## Project Structure

This is a monorepo containing two main components:

```
ai-active-suspension-2/
├── firmware/              # ESP32 C++ firmware (PlatformIO)
│   ├── src/              # Main application code
│   ├── include/          # Header files
│   └── README.md         # Firmware documentation
│
└── app/                   # PWA frontend (Static HTML + Express)
    ├── dist/             # Static web app (HTML/CSS/JS)
    ├── server.js         # HTTPS server + ESP32 proxy
    ├── certs/            # Local HTTPS certificates
    ├── package.json      # Dependencies
    └── README.md         # App documentation
```

## Features

### Firmware (ESP32)
- **MPU6050 Sensor Integration**: 6-axis IMU with complementary filter
- **Active Suspension Control**: 4-corner independent servo control
- **Battery Monitoring**: 3 configurable battery inputs with voltage dividers
- **API-Only Web Server**: Lightweight JSON endpoints (no HTML)
- **WebSocket Support**: Real-time sensor data streaming
- **WiFi AP/Client Mode**: Access Point fallback for portable use
- **Persistent Storage**: SPIFFS-based configuration

### PWA Application
- **Static HTML/CSS/JS UI**: Fast, responsive mobile-first interface
- **Real-time Data**: WebSocket connection to ESP32
- **Multi-Page Interface**: Dashboard, Settings, Tuning, Lights, FPV
- **Auto-Level Setup**: Visual bubble level for chassis leveling
- **Servo Configuration**: Range, trim, and rotation controls with lock feature
- **Network Management**: Home WiFi and Stand Alone mode switching
- **Live Debugging**: Console output and configuration viewer
- **HTTPS Server**: Secure local development with ESP32 API/WebSocket proxy
- **Progressive Web App**: Installable on mobile devices

## Quick Start

### Firmware Development

```bash
cd firmware
pio run --target upload
pio device monitor --baud 115200
```

See [firmware/README.md](firmware/README.md) for complete details.

### PWA Development

```bash
cd app
npm install
npm run serve
```

Open https://localhost:3443 in browser. Accept security warning for local cert. See [app/README.md](app/README.md) for complete details.

## Hardware Requirements

- **ESP32-D0WD-V3** (or compatible)
- **MPU6050** IMU Sensor
- **4x RC Servo Motors**
- **Voltage Dividers** for battery monitoring (70kΩ + 10kΩ = 8:1 ratio)

### Wiring
- **MPU6050**: SDA=GPIO21, SCL=GPIO22
- **Servos**: FL=GPIO12, FR=GPIO13, RL=GPIO14, RR=GPIO15
- **Battery ADC**: GPIO34, GPIO35, GPIO32

## Network Configuration

**Access Point Mode (Default)**:
- SSID: `ESP32-Suspension`
- Password: `12345678`
- IP: `192.168.4.1`

**Local Network Fallback**:
- Configure SSID/password in `firmware/include/Config.h`
- Automatically falls back to AP if WiFi fails

## Architecture

### Communication Flow
```
Browser (Static HTML) ←→ HTTPS/WSS ←→ Express Proxy ←→ HTTP/WS ←→ ESP32
                                                                    ↓
                                                           [MPU6050 + Servos]
```

### API Endpoints
- `GET /api/health` - System health and MPU status
- `GET/POST /api/config` - Suspension parameters
- `GET/POST /api/battery-config` - Battery configuration
- `GET/POST /api/servo-config` - Servo calibration
- `WS /ws` - Real-time sensor/battery/servo data

## Development Workflow

1. **Firmware Changes**: Edit code in `firmware/`, build and upload to ESP32
2. **UI Changes**: Edit code in `app/src/`, hot-reload automatically in browser
3. **Coordinated Updates**: Commit both firmware + app changes together

## Packaging for Production

### Android APK

```bash
cd app
npm run build
npm run cap:init      # First time only
npm run cap:add       # First time only
npm run cap:sync
npm run cap:open      # Opens Android Studio
```

Build APK in Android Studio (Build → Build Bundle(s) / APK(s) → Build APK(s))

### iOS App (requires macOS + Xcode)

```bash
cd app
npm run cap:add ios
npm run cap:sync
npm run cap:open      # Opens Xcode
```

## Documentation

- **Firmware Details**: [firmware/README.md](firmware/README.md)
- **App Development**: [app/README.md](app/README.md)
- **Architecture Overview**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Hardware Guide**: [HARDWARE.md](HARDWARE.md)
- **Quick Reference**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

## Key Configuration Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| Reaction Speed | 0.1 - 5.0 | How quickly suspension responds |
| Ride Height | 30 - 150° | Center servo position |
| Travel Range | 10 - 90° | Max compression/extension |
| Damping | 0.1 - 2.0 | Movement smoothing |
| Front/Rear Balance | 0.0 - 1.0 | Weight distribution |
| Stiffness | 0.5 - 3.0 | Suspension stiffness |

## Benefits of PWA Architecture

- **Reduced Flash Usage**: ~40% less ESP32 flash (no HTML strings)
- **Better Performance**: Phone CPU handles rendering
- **Easy Updates**: Update UI without reflashing firmware
- **Native Feel**: Install as app on phone
- **Portable**: Works anywhere with AP mode

## Contributing

This is a personal RC project. Feel free to fork and adapt for your own use!

## License

MIT License
