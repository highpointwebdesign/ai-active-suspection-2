# Copilot Development Instructions

This is an ESP32 firmware project for an active suspension  with web configuration interface.

## Project Structure

- **platformio.ini** - PlatformIO build configuration
- **src/main.cpp** - Main firmware code with sensor loop and suspension management
- **include/** - Header files for modular components:
  - Config.h - Constants and data structures
  - SensorFusion.h - Complementary filter for IMU data
  - SuspensionSimulator.h - Physics simulation for suspension
  - StorageManager.h - SPIFFS persistence layer
  - PWMOutputs.h - Servo PWM control
  - WebServer.h - Async web server with HTML UI
- **README.md** - Complete project documentation
- **package.json** - Project metadata

## Development Workflow

### Building
```bash
platformio run --target upload
```

### Monitoring
```bash
platformio device monitor --baud 115200
```

### Key Components

1. **MPU6050 Integration** (main.cpp, SensorFusion.h)
   - Reads 6-axis IMU at 50 Hz
   - Complementary filter combines gyro + accelerometer
   - Outputs: roll, pitch, vertical acceleration

2. **Suspension Simulation** (SuspensionSimulator.h)
   - Takes orientation and acceleration inputs
   - Calculates servo positions for 4 corners (FL, FR, RL, RR)
   - Applies damping and range limits

3. **Web Interface** (WebServer.h)
   - Serves HTML/CSS/JavaScript on port 80
   - JSON API endpoints for config management
   - Mobile-responsive design

4. **Persistent Storage** (StorageManager.h)
   - Stores settings in SPIFFS
   - Loads on startup
   - JSON format

5. **PWM Outputs** (PWMOutputs.h)
   - Drives servos on GPIO 12-15
   - 50 Hz frequency, maps 0-180° to 1-2ms pulses

## Important Notes

- Default WiFi: SSID "ESP32-Suspension", Password "12345678"
- Access web UI at http://192.168.4.1
- Servo connections: FL=12, FR=13, RL=14, RR=15
- I2C pins: SDA=21, SCL=22
- All settings persist across power cycles via SPIFFS

## Customization

To adjust defaults, edit Config.h:
- Sample rate: `SUSPENSION_SAMPLE_RATE_HZ`
- GPIO pins: `PWM_*_PIN` constants
- WiFi credentials: `WIFI_SSID`, `WIFI_PASSWORD`
- Default parameters: `DEFAULT_*` constants

## Serial Monitor Output Expected
```
ESP32 Active Suspension Management - Starting...
SPIFFS initialized
MPU6050 initialized successfully
Setup complete!
WiFi SSID: ESP32-Suspension
Access at http://192.168.4.1 or http://esp32.local
Web server started on http://192.168.4.1
```
