# Quick Start Guide

## Step 1: Hardware Assembly

### Wiring Diagram
```
ESP32 Development Board:
├── I2C (MPU6050 Communication)
│   ├── GPIO 21 (SDA) → MPU6050 SDA
│   ├── GPIO 22 (SCL) → MPU6050 SCL
│   ├── GND → MPU6050 GND
│   └── 3.3V → MPU6050 VCC
│
└── PWM Outputs (Servo Control)
    ├── GPIO 12 → Servo Front-Left (Signal)
    ├── GPIO 13 → Servo Front-Right (Signal)
    ├── GPIO 14 → Servo Rear-Left (Signal)
    ├── GPIO 15 → Servo Rear-Right (Signal)
    ├── GND → All Servo GND
    └── 5V → All Servo VCC (from separate power supply)
```

### Component Checklist
- [ ] ESP32-DevKit-V1 board
- [ ] MPU6050 IMU module with I2C interface
- [ ] 4x RC servo motors (standard 5V)
- [ ] 5V power supply for servos (1-2A minimum)
- [ ] 3.3V regulator for ESP32 (if not built-in)
- [ ] USB cable for programming
- [ ] Jumper wires for connections
- [ ] Optional: 4.7kΩ pull-up resistors for I2C (if not on module)

## Step 2: Software Setup

### Option A: Using VS Code + PlatformIO Extension (Recommended)

1. **Install VS Code** from https://code.visualstudio.com
2. **Install PlatformIO Extension**:
   - Open VS Code
   - Click Extensions (Ctrl+Shift+X)
   - Search for "PlatformIO IDE"
   - Click Install
3. **Open Project**:
   - File → Open Folder
   - Select the `ai-active-suspension-2` directory
   - PlatformIO will auto-detect the project
4. **Build and Upload**:
   - Click PlatformIO icon (alien) on left sidebar
   - Under "esp32", click "Build" 
   - Connect ESP32 via USB
   - Click "Upload"
5. **Monitor**:
   - Click "Monitor" under "esp32" in PlatformIO sidebar

### Option B: Using Command Line

```bash
# Install PlatformIO CLI
pip install platformio

# Navigate to project
cd ai-active-suspension-2

# Build
platformio run

# Upload to connected ESP32
platformio run --target upload

# Monitor serial output
platformio device monitor --baud 115200
```

## Step 3: Configure WiFi Access Point

The ESP32 automatically starts as a WiFi Access Point:
- **SSID**: `ESP32-Suspension`
- **Password**: `12345678`

To change these, edit in `include/Config.h`:
```cpp
#define WIFI_SSID "YourSSID"
#define WIFI_PASSWORD "YourPassword"
```

Then rebuild and upload.

## Step 4: Access Web Interface

1. **Connect your phone/computer WiFi** to `ESP32-Suspension`
2. **Open a browser** and go to:
   - `http://192.168.4.1` (works on all devices)
   - OR `http://esp32.local` (works on most devices)
3. **You should see** the Suspension Control dashboard

## Step 5: Test Suspension Response

1. **Power on the setup** (ESP32 + servos)
2. **Tilt the MPU6050** in different directions
3. **Watch servos respond** to the tilt
4. **Use the web UI** to adjust parameters in real-time:
   - Increase Reaction Speed → faster servo response
   - Adjust Damping → smoother or snappier movement
   - Change Front/Rear Balance → front-heavy vs rear-heavy behavior

## Troubleshooting Quick Checklist

| Problem | Solution |
|---------|----------|
| Upload fails | Check USB cable, try different port, restart IDE |
| "MPU6050 connection failed" | Verify I2C wiring, check I2C address (0x68 default) |
| Web page won't load | Ensure WiFi connected to ESP32-Suspension, try http://192.168.4.1 |
| Servos not responding | Check GPIO connections, verify 5V power supply, test with oscilloscope |
| Settings not saving | Wait for "Config saved" in serial monitor, check SPIFFS status |
| Device resets constantly | Check power supply voltage (should be 3.3V for ESP32, 5V for servos) |

## Serial Monitor Expected Output

When you first power on or upload, you should see:

```
ESP32 Active Suspension Manager - Starting...
SPIFFS initialized
MPU6050 initialized successfully
Setup complete!
WiFi SSID: ESP32-Suspension
Access at http://192.168.4.1 or http://esp32.local
Web server started on http://192.168.4.1
```

If you see errors, check the troubleshooting section above.

## Understanding the Simulation

The suspension manager works like this:

1. **Input**: Tilt the ESP32 board (which has the MPU6050 attached)
2. **Sensor Fusion**: The gyroscope and accelerometer are combined to get stable tilt angles
3. **Physics**: The system calculates:
   - Roll effect: Tilt left/right → left/right suspension compresses
   - Pitch effect: Tilt forward/backward → front/rear suspension compresses
   - Vertical acceleration: Fast up/down motion → compression effect
4. **Output**: Servo positions (0-180°) are sent to the RC servos

### Web UI Parameters Explained

- **Reaction Speed (0.1-5.0)**: How quickly servos follow the movement
  - Low (0.1) = very slow, smooth, mushy response
  - High (5.0) = instant, snappy response
  
- **Ride Height (30-150°)**: Center position of servos (90° = middle)
  - Lower values = servos start more retracted
  - Higher values = servos start more extended

- **Travel Range (10-90°)**: How much each servo can move up/down
  - Lower = less suspension movement
  - Higher = more suspension travel
  
- **Damping (0.1-2.0)**: Smoothing of movements
  - Low = quick stop and start
  - High = very smooth, bouncy
  
- **Front/Rear Balance (0-1)**: Weight distribution
  - 0 = all movement goes to rear wheels
  - 0.5 = equal front and rear
  - 1 = all movement goes to front wheels
  
- **Stiffness (0.5-3.0)**: How strong the movement response is
  - Low = gentle, subtle movements
  - High = exaggerated movements

## Next Steps

1. **Experiment** with different parameter settings
2. **Connect to a real RC chassis** instead of just watching servos
3. **Fine-tune** the simulation to match desired vehicle behavior
4. **Consider PCA9685 driver** if you need more than 4 servos
5. **Add features** like telemetry display or motion recording

Enjoy your suspension manager!
