# NONE OF THIS HAS BEEN TESTED ON HARDWRE - THIS IS ONLY CONCEPTUAL AT THIS POINT

# ESP32 Active Suspension Simulator

A complete firmware solution for ESP32 microcontroller that simulates RC vehicle suspension behavior using an MPU6050 accelerometer/gyroscope sensor. Features real-time sensor readings, configurable suspension simulation, PWM servo outputs, and a mobile-friendly web interface for live configuration.

## Features

- **MPU6050 Sensor Integration**: Reads 6-axis IMU data (accelerometer + gyroscope)
- **Advanced Sensor Fusion**: Complementary filter for stable orientation estimation
- **Realistic Suspension Simulation**: Calculates four independent suspension corners (FL, FR, RL, RR)
- **PWM Servo Outputs**: Drives standard RC servos on GPIO pins 12-15
- **Web-Based Configuration**: Mobile-friendly UI accessible via WiFi
- **Persistent Storage**: Settings stored in SPIFFS, survive power cycles
- **WiFi Access Point**: Built-in AP mode with mDNS support
- **Real-time Parameters**: Adjust reaction speed, damping, stiffness, and more on-the-fly

## Hardware Requirements

- **ESP32 Development Board** (ESP32-DevKit-V1 or compatible)
- **MPU6050** IMU Sensor Module
- **4x RC Servo Motors** (or servo driver board)
- **Wiring**:
  - MPU6050 SDA → GPIO 21
  - MPU6050 SCL → GPIO 22
  - Servo Front-Left → GPIO 12
  - Servo Front-Right → GPIO 13
  - Servo Rear-Left → GPIO 14
  - Servo Rear-Right → GPIO 15
  - Common GND and Power connections

## Software Setup

### Prerequisites

- PlatformIO CLI or VS Code with PlatformIO extension
- Python 3.6+

### Installation

1. **Clone or download this project**:
   ```bash
   cd ai-active-suspension-2
   ```

2. **Open in PlatformIO**:
   - Open VS Code and install the PlatformIO extension
   - Open this folder in VS Code
   - PlatformIO will automatically detect and set up the environment

3. **Build and Upload**:
   ```bash
   platformio run --target upload
   ```

4. **Monitor Serial Output**:
   ```bash
   platformio device monitor --baud 115200
   ```

## Usage

### Connecting to the Web Interface

1. **Power on the ESP32**
2. **Connect to WiFi**: Look for SSID `ESP32-Suspension` (password: `12345678`)
3. **Open in Browser**: Navigate to `http://192.168.4.1` or `http://esp32.local`

### Configuration Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Reaction Speed** | 0.1 - 5.0 | How quickly suspension responds to motion |
| **Ride Height** | 30 - 150° | Center position for servo (90° = middle) |
| **Travel Range** | 10 - 90° | Maximum suspension compression/extension |
| **Damping** | 0.1 - 2.0 | Dampening/smoothing of movements |
| **Front/Rear Balance** | 0.0 - 1.0 | Weight distribution (0=rear, 1=front) |
| **Stiffness** | 0.5 - 3.0 | Overall suspension stiffness multiplier |

### How It Works

1. **Sensor Reading**: MPU6050 reads acceleration and rotation at 50 Hz
2. **Sensor Fusion**: Complementary filter combines accel + gyro for stable orientation
3. **Suspension Calculation**: Roll, pitch, and vertical acceleration drive suspension logic
4. **Corner Isolation**: Each corner receives independent height adjustments
5. **PWM Output**: Servo positions (0-180°) are output via PWM on GPIO pins
6. **Web Sync**: Configuration changes are immediately applied and saved

## Technical Details

### Sensor Fusion Algorithm

Uses a complementary filter (95% gyro, 5% accelerometer) to combine gyroscope angular rates with accelerometer angle estimates. This provides stable orientation with low drift and minimal lag.

```
Roll  = 0.95 * (Roll + Gyro_X * dt) + 0.05 * Accel_Roll
Pitch = 0.95 * (Pitch + Gyro_Y * dt) + 0.05 * Accel_Pitch
```

### Suspension Simulation

Each corner's position is calculated as:
```
Position = CenterHeight 
         + PitchEffect * BalanceFactor
         + RollEffect
         + VerticalEffect
         + DampingSmoothing
```

The simulation uses 1st-order low-pass filtering for natural suspension response.

### File Structure

```
ai-active-suspension-2/
├── platformio.ini           # PlatformIO configuration
├── src/
│   └── main.cpp            # Main firmware entry point
├── include/
│   ├── Config.h            # Configuration constants
│   ├── SensorFusion.h      # Sensor fusion algorithm
│   ├── SuspensionSimulator.h # Suspension physics simulation
│   ├── StorageManager.h    # SPIFFS configuration storage
│   ├── PWMOutputs.h        # PWM servo driver
│   └── WebServer.h         # Async web server + HTML UI
└── README.md               # This file
```

## API Endpoints

### GET /api/config
Returns current configuration as JSON:
```json
{
  "reactionSpeed": 1.0,
  "rideHeightOffset": 90.0,
  "rangeLimit": 60.0,
  "damping": 0.8,
  "frontRearBalance": 0.5,
  "stiffness": 1.0,
  "sampleRate": 50
}
```

### POST /api/config
Updates configuration. Send JSON with parameters to update (partial updates supported):
```json
{
  "reactionSpeed": 1.5,
  "damping": 0.7
}
```

## Troubleshooting

### MPU6050 Not Detected
- Verify I2C wiring (SDA=21, SCL=22)
- Check for address conflicts (MPU6050 default: 0x68)
- Try adding 4.7kΩ pull-up resistors on SDA/SCL

### Web Page Not Loading
- Ensure WiFi is connected to `ESP32-Suspension`
- Try accessing via IP address: `http://192.168.4.1`
- Check serial monitor for errors

### Servo Not Moving
- Verify GPIO connections (12, 13, 14, 15)
- Check servo power supply (typically 5V)
- Confirm PWM frequency (should be 50 Hz for servos)
- Monitor servo signal with oscilloscope if available

### Configuration Not Saving
- Check SPIFFS is initialized in serial monitor
- Verify device has available flash space
- Try erasing entire flash: `platformio run --target erase`

## Future Enhancements

- PCA9685 PWM driver support for more servos
- Station mode WiFi configuration UI
- Real-time telemetry dashboard
- Advanced Kalman filter option
- Motion recording and playback
- Multi-device synchronization
- OTA firmware updates

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues, questions, or contributions, please open an issue on the project repository.
