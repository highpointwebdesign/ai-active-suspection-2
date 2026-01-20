# Configuration and API Reference

## Configuration File Management

All configuration is stored in SPIFFS as a JSON file at `/config.json`. This file is created automatically on first run or when settings are saved.

### Automatic Persistence

Configuration is automatically:
- **Loaded** on startup (or defaults used if file missing)
- **Saved** whenever you click "Save" button in web UI
- **Survives** power cycles and reboots
- **Recoverable** by erasing flash if corrupted

### Default Configuration

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

---

## Web API Reference

The ESP32 web server exposes two JSON API endpoints for configuration management.

### Endpoint 1: GET /api/config

**Purpose**: Retrieve current configuration

**Request**:
```
GET http://192.168.4.1/api/config
```

**Response** (200 OK):
```json
{
  "reactionSpeed": 1.2,
  "rideHeightOffset": 85.5,
  "rangeLimit": 65.0,
  "damping": 0.9,
  "frontRearBalance": 0.6,
  "stiffness": 1.1,
  "sampleRate": 50
}
```

**Example using curl**:
```bash
curl http://192.168.4.1/api/config
```

**Example using JavaScript (in browser)**:
```javascript
fetch('/api/config')
  .then(response => response.json())
  .then(config => console.log(config));
```

---

### Endpoint 2: POST /api/config

**Purpose**: Update configuration parameters

**Request**:
```
POST http://192.168.4.1/api/config
Content-Type: application/json

{
  "reactionSpeed": 1.5,
  "damping": 0.75
}
```

**Notes**:
- Send only the parameters you want to update (partial updates supported)
- Omitted parameters retain their current values
- Invalid parameters are ignored
- All parameters must be valid numbers within their ranges

**Response** (200 OK):
```json
{
  "status": "success"
}
```

**Response** (400 Bad Request):
```json
{
  "status": "error"
}
```

**Example using curl**:
```bash
curl -X POST http://192.168.4.1/api/config \
  -H "Content-Type: application/json" \
  -d '{"reactionSpeed":2.0,"damping":0.6}'
```

**Example using JavaScript**:
```javascript
async function updateConfig(newSettings) {
  const response = await fetch('/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newSettings)
  });
  
  const result = await response.json();
  console.log(result.status);
}

// Usage
updateConfig({ reactionSpeed: 2.0, damping: 0.6 });
```

---

## Parameter Reference

### reactionSpeed
- **Type**: Float
- **Range**: 0.1 to 5.0
- **Default**: 1.0
- **Description**: Controls how quickly the suspension responds to motion
- **Effect**:
  - **0.1 - 0.5** (Slow): Mushy, delayed response - good for road/cruiser feel
  - **1.0** (Normal): Balanced response - default good-all-around setting
  - **2.0 - 5.0** (Fast): Snappy, instant response - good for sporty/off-road feel
- **Physics**: Affects the time constant of the 1st-order low-pass filter

### rideHeightOffset
- **Type**: Float
- **Range**: 30 to 150 (servo degrees)
- **Default**: 90.0
- **Description**: Center position for servo outputs
- **Effect**:
  - **30 - 60**: Servos start more retracted (less extended)
  - **90**: Servos at middle position (50% extension) - standard
  - **120 - 150**: Servos start more extended (more contracted)
- **Note**: 0° and 180° are physical servo limits
- **Typical values**: 80-100° for most RC vehicles

### rangeLimit
- **Type**: Float
- **Range**: 10 to 90 (degrees)
- **Default**: 60.0
- **Description**: Maximum suspension travel distance (±degrees from center)
- **Effect**:
  - **10 - 20**: Limited suspension travel - stiff setup
  - **40 - 60**: Normal range - good for most vehicles
  - **70 - 90**: Maximum suspension travel - soft/extreme setup
- **Limits**: Final servo position = rideHeightOffset ± rangeLimit
- **Example**: If ride height = 90 and range = 60, servos output between 30-150°

### damping
- **Type**: Float
- **Range**: 0.1 to 2.0
- **Default**: 0.8
- **Description**: Dampening of vertical acceleration effects
- **Effect**:
  - **0.1 - 0.3**: Minimal compression under acceleration - floaty feel
  - **0.8 - 1.0**: Balanced dampening - standard vehicles
  - **1.5 - 2.0**: Strong compression under acceleration - heavy feel
- **Physics**: Multiplier for vertical acceleration component
- **Note**: Higher damping = more noticeable up/down compression

### frontRearBalance
- **Type**: Float
- **Range**: 0.0 to 1.0
- **Default**: 0.5
- **Description**: Weight distribution between front and rear suspension
- **Effect**:
  - **0.0**: All suspension movement goes to rear only
  - **0.5**: Equal front and rear movement - neutral
  - **1.0**: All suspension movement goes to front only
  - **0.4**: Rear-biased (common for trucks)
  - **0.6**: Front-biased (common for sports cars)
- **Use case**: Affects how vehicle "dives" and "squats" during acceleration/braking
- **Pitch effect distribution**: Front = value, Rear = 1.0 - value

### stiffness
- **Type**: Float
- **Range**: 0.5 to 3.0
- **Default**: 1.0
- **Description**: Overall suspension stiffness multiplier
- **Effect**:
  - **0.5 - 0.7**: Soft, subtle suspension movements
  - **1.0**: Standard suspension response
  - **1.5 - 2.0**: Stiff, exaggerated movements
  - **2.5 - 3.0**: Very stiff, pronounced response
- **Physics**: Multiplies roll and pitch effects before position calculation
- **Note**: Higher stiffness = bigger servo movements for same tilt

### sampleRate
- **Type**: Integer
- **Range**: 10 to 200 (Hz)
- **Default**: 50
- **Description**: Sensor reading and suspension update frequency
- **Effect**:
  - **10 - 25 Hz**: Low update rate, more CPU-efficient, sluggish feel
  - **50 Hz**: Standard, good balance
  - **100+ Hz**: High update rate, more responsive, more CPU usage
- **Note**: Cannot be changed from web UI, only via code
- **Affects**: MPU6050 read frequency and suspension calculation frequency
- **PWM frequency**: Always 50 Hz (servo standard), regardless of sample rate

---

## Configuration Presets

### Rock Crawler (Off-Road Focus)
```json
{
  "reactionSpeed": 0.5,
  "rideHeightOffset": 95.0,
  "rangeLimit": 75.0,
  "damping": 1.5,
  "frontRearBalance": 0.4,
  "stiffness": 0.8
}
```
**Characteristics**: Soft, compliant suspension with slow response

### Street Car (Road Focus)
```json
{
  "reactionSpeed": 1.5,
  "rideHeightOffset": 90.0,
  "rangeLimit": 55.0,
  "damping": 0.7,
  "frontRearBalance": 0.6,
  "stiffness": 1.1
}
```
**Characteristics**: Responsive, minimal excessive movement

### Racing Car (Performance Focus)
```json
{
  "reactionSpeed": 3.0,
  "rideHeightOffset": 85.0,
  "rangeLimit": 50.0,
  "damping": 0.5,
  "frontRearBalance": 0.55,
  "stiffness": 1.3
}
```
**Characteristics**: Snappy response, stiff, minimal body roll

### Truck (Load Biased)
```json
{
  "reactionSpeed": 0.8,
  "rideHeightOffset": 100.0,
  "rangeLimit": 65.0,
  "damping": 0.9,
  "frontRearBalance": 0.35,
  "stiffness": 0.9
}
```
**Characteristics**: Rear-biased, higher ride height for loading

### Luxury Car (Comfort Focus)
```json
{
  "reactionSpeed": 0.4,
  "rideHeightOffset": 92.0,
  "rangeLimit": 70.0,
  "damping": 1.2,
  "frontRearBalance": 0.5,
  "stiffness": 0.7
}
```
**Characteristics**: Very smooth, slow response, maximum comfort

---

## Modifying Configuration Programmatically

If you want to load different presets or adjust settings in code, edit `src/main.cpp` in the `setup()` function:

```cpp
// In setup(), after loading config:
SuspensionConfig myConfig = storageManager.getConfig();

// Modify parameters
myConfig.reactionSpeed = 2.0f;
myConfig.damping = 0.6f;

// Save back
storageManager.setConfig(myConfig);
```

Or modify defaults in `include/Config.h`:

```cpp
#define DEFAULT_REACTION_SPEED 1.5f
#define DEFAULT_RIDE_HEIGHT 85.0f
#define DEFAULT_DAMPING 0.7f
// etc...
```

---

## Serial Debug Output

When configuration changes are made, you'll see output like:

```
Config loaded from SPIFFS
Config saved to SPIFFS
```

You can enable more detailed logging by modifying `src/main.cpp`:

```cpp
// Add before loop() in main.cpp
Serial.print("Roll: "); Serial.print(roll);
Serial.print(" Pitch: "); Serial.print(pitch);
Serial.print(" Vertical Accel: "); Serial.println(verticalAccel);
```

---

## Resetting Configuration

### Method 1: Via Web UI
Click the "Reset" button in the web interface. This reloads saved configuration from SPIFFS.

### Method 2: Erase SPIFFS
```bash
platformio run --target erase
```
This erases all flash memory. On next boot, defaults will be used.

### Method 3: Manual Deletion
If you have SPIFFS access:
```cpp
SPIFFS.remove(CONFIG_SPIFFS_PATH);
```

---

## Troubleshooting Configuration Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Changes don't save | SPIFFS full or unmounted | Check serial output for "SPIFFS initialized" |
| Settings revert after power cycle | Configuration not saving | Click "Save" button (check status message) |
| Can't change certain parameters | Parameter locked | Check Config.h for hardcoded values |
| Web API returns error | Invalid JSON format | Use proper JSON syntax, check value ranges |
| Servo doesn't respond to changes | Simulation not updating | Check if device is tilting, try reboot |

---

## Advanced: Custom Simulation Behavior

To create custom suspension logic, modify `include/SuspensionSimulator.h`:

```cpp
// In SuspensionSimulator::update()
// Modify how roll, pitch, and vertical effects are combined

// Example: Add tire slip simulation
float slipEffect = abs(verticalAccel) * 0.1f;
frontLeft.target += slipEffect;
```

See the code comments in SuspensionSimulator.h for detailed physics documentation.

---

Next: See [QUICKSTART.md](QUICKSTART.md) for getting started, or [HARDWARE.md](HARDWARE.md) for wiring instructions.
