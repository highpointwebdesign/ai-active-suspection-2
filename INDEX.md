# ESP32 Active Suspension Simulator - Complete Documentation Index

Welcome to the ESP32 Active Suspension Simulator project! This document provides a roadmap to all project documentation and resources.

---

## 📚 Quick Navigation

### For Getting Started (First Time)
1. **[QUICKSTART.md](QUICKSTART.md)** ← Start here!
   - Step-by-step setup instructions
   - Hardware assembly checklist
   - Software installation (VS Code + PlatformIO)
   - First power-on and testing
   - Troubleshooting quick reference

### For Hardware Setup
- **[HARDWARE.md](HARDWARE.md)** - Complete wiring guide
  - Detailed pinout diagrams
  - Component list and specifications
  - Step-by-step assembly instructions
  - Power supply configuration
  - I2C and PWM connection details
  - Testing procedures for each component
  - Common issues and solutions

### For Software and Configuration
- **[README.md](README.md)** - Full project documentation
  - Feature overview
  - Installation instructions
  - Usage guide
  - Technical details and algorithms
  - File structure
  - Troubleshooting guide

- **[CONFIG_API.md](CONFIG_API.md)** - Configuration and API reference
  - Configuration file structure
  - Web API endpoints
  - Parameter reference (detailed descriptions and ranges)
  - Preset configurations
  - Serial debug output
  - Advanced customization

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and internals
  - System architecture overview
  - Data flow diagrams
  - Module descriptions
  - Physics algorithms
  - Performance characteristics
  - Extensibility guide
  - Testing checklist

### For Development
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Development guidelines
  - Project structure
  - Key components
  - Customization instructions

---

## 📁 Project File Structure

```
ai-active-suspension-2/
├── README.md                    # Main documentation
├── QUICKSTART.md               # Getting started guide
├── HARDWARE.md                 # Wiring and assembly
├── CONFIG_API.md               # Configuration reference
├── ARCHITECTURE.md             # System design
├── INDEX.md                    # This file
│
├── platformio.ini              # PlatformIO build config
├── package.json                # Project metadata
├── INSTRUCTIONS.json           # Build instructions
│
├── firmware/
│   ├── src/
│   │   └── main.cpp           # Main firmware code (50 Hz loop, initialization)
│   │
│   └── include/
│       ├── Config.h           # Constants, data structures, GPIO pins
│       ├── SensorFusion.h     # Complementary filter algorithm
│       ├── SuspensionSimulator.h # Physics simulation for 4 corners
│       ├── StorageManager.h   # SPIFFS persistence layer
│       ├── PWMOutputs.h       # Servo PWM driver
│       └── WebServer.h        # Async web API server
│
├── app/
│   ├── dist/                  # Static web app (HTML/CSS/JS)
│   │   ├── index.html         # Main application
│   │   ├── css/               # Stylesheets and fonts
│   │   ├── js/                # JavaScript libraries
│   │   └── plugins/           # UI components
│   │
│   ├── server.js              # HTTPS server + ESP32 proxy
│   ├── certs/                 # SSL certificates
│   ├── package.json           # Server dependencies
│   └── README.md              # App documentation
│
└── .github/
    └── copilot-instructions.md # Development instructions
```

---

## 🎯 Quick Fact Sheet

| Aspect | Detail |
|--------|--------|
| **Microcontroller** | ESP32 (any variant) |
| **Sensor** | MPU6050 (6-axis IMU) |
| **Outputs** | 4x PWM servo channels (GPIO 12-15) |
| **Update Rate** | 50 Hz (20ms loop) |
| **WiFi** | AP mode (SSID: ESP32-Suspension) |
| **Web UI** | http://192.168.4.1 |
| **Storage** | SPIFFS (persistent config) |
| **Servo Range** | 0-180° (1-2ms PWM) |
| **Programmable Params** | 6 main + sample rate |

---

## 🔧 Quick Reference: Getting Help

### I just want to...

**...build and upload the firmware**
→ See [QUICKSTART.md](QUICKSTART.md#step-2-software-setup)

**...understand the hardware connections**
→ See [HARDWARE.md](HARDWARE.md)

**...access the web interface**
→ Go to http://192.168.4.1 (WiFi: ESP32-Suspension / 12345678)

**...adjust suspension parameters**
→ See [CONFIG_API.md](CONFIG_API.md#parameter-reference) for what each setting does

**...understand how the physics works**
→ See [ARCHITECTURE.md](ARCHITECTURE.md#suspension-simulation)

**...modify the code for my needs**
→ See [ARCHITECTURE.md](ARCHITECTURE.md#extensibility)

**...find why something isn't working**
→ Check the troubleshooting section in [QUICKSTART.md](QUICKSTART.md#troubleshooting-quick-checklist)

**...understand the API endpoints**
→ See [CONFIG_API.md](CONFIG_API.md#web-api-reference)

---

## 📋 Setup Checklist

### Phase 1: Hardware Assembly
- [ ] Gather all components (see [HARDWARE.md](HARDWARE.md))
- [ ] Wire I2C (MPU6050): SDA→GPIO21, SCL→GPIO22
- [ ] Wire PWM servos: GPIO12-15 + common ground + 5V power
- [ ] Verify all connections match [HARDWARE.md](HARDWARE.md) pinout table
- [ ] Connect USB for programming (don't power servos yet)

### Phase 2: Software Setup
- [ ] Install VS Code
- [ ] Install PlatformIO extension
- [ ] Open this project folder in VS Code
- [ ] Click "Build" (should compile without errors)
- [ ] Click "Upload" (should complete successfully)
- [ ] Click "Monitor" (should show startup messages)

### Phase 3: Initial Testing
- [ ] See "Setup complete!" in serial monitor
- [ ] WiFi AP "ESP32-Suspension" appears in WiFi networks
- [ ] Connect device WiFi to ESP32-Suspension (password: 12345678)
- [ ] Open http://192.168.4.1 in browser
- [ ] Web UI loads without errors
- [ ] Move web UI sliders, observe servo responses

### Phase 4: Fine-Tuning
- [ ] Tilt the device with MPU6050
- [ ] Watch suspension respond to motion
- [ ] Adjust parameters for desired behavior
- [ ] Save settings (check confirmation message)
- [ ] Power cycle to verify settings persist
- [ ] Mount on RC vehicle (optional)

---

## 🚀 Common Tasks

### To upload the latest code:
```bash
# Option 1: Using VS Code PlatformIO sidebar
Click: PlatformIO → Build → Upload

# Option 2: Command line
platformio run --target upload
```

### To monitor serial output:
```bash
# Option 1: Using VS Code PlatformIO sidebar
Click: PlatformIO → Monitor

# Option 2: Command line
platformio device monitor --baud 115200
```

### To change WiFi credentials:
1. Edit `include/Config.h`
2. Change `WIFI_SSID` and `WIFI_PASSWORD`
3. Rebuild and upload

### To add another servo:
1. Add more entries to `SuspensionSimulator.h` (CornerState structs)
2. Add GPIO pin assignment to `Config.h`
3. Update calculations in `SuspensionSimulator::update()`
4. Add PWM output calls in `main.cpp`

### To reset all settings to defaults:
1. Click "Reset" button in web UI, OR
2. Run: `platformio run --target erase`
3. Device will boot with default values

---

## 📊 Parameter Guide (Quick)

| Parameter | Range | Effect |
|-----------|-------|--------|
| **Reaction Speed** | 0.1-5.0 | Slow (mushy) → Fast (snappy) |
| **Ride Height** | 30-150° | Servo starting position (90° = center) |
| **Travel Range** | 10-90° | Max suspension compression/extension |
| **Damping** | 0.1-2.0 | Vertical motion smoothing |
| **Front/Rear** | 0.0-1.0 | Rear-heavy (0) → Front-heavy (1) |
| **Stiffness** | 0.5-3.0 | Soft (subtle) → Stiff (exaggerated) |

For detailed parameter explanation, see [CONFIG_API.md](CONFIG_API.md#parameter-reference)

---

## 🎓 Learning Path

**Beginner (Want to use it)**:
1. [QUICKSTART.md](QUICKSTART.md) - Get it running
2. [CONFIG_API.md](CONFIG_API.md) - Learn what each parameter does
3. Experiment with settings

**Intermediate (Want to customize it)**:
1. [README.md](README.md) - Understand full system
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Learn how it works
3. [HARDWARE.md](HARDWARE.md) - Understand connections
4. Modify code to suit your needs

**Advanced (Want to extend it)**:
1. [ARCHITECTURE.md](ARCHITECTURE.md#extensibility) - Extension guide
2. Review source code
3. Implement new features (Kalman filter, more servos, telemetry, etc.)

---

## 🐛 Troubleshooting Directory

| Problem | Solution |
|---------|----------|
| Upload fails | See [QUICKSTART.md - Option A/B](QUICKSTART.md) |
| MPU6050 not detected | See [HARDWARE.md - I2C Connection](HARDWARE.md) |
| Web page won't load | See [QUICKSTART.md - Test Suspension](QUICKSTART.md) |
| Servos not moving | See [HARDWARE.md - Testing](HARDWARE.md) |
| Settings don't save | See [CONFIG_API.md - Troubleshooting](CONFIG_API.md) |
| Device resets | See [HARDWARE.md - Power Supply](HARDWARE.md) |

---

## 📞 Support Resources

### If you encounter an issue:

1. **Check the relevant troubleshooting section**
   - [QUICKSTART.md](QUICKSTART.md#troubleshooting-quick-checklist)
   - [HARDWARE.md](HARDWARE.md#common-issues-and-solutions)
   - [CONFIG_API.md](CONFIG_API.md#troubleshooting-configuration-issues)

2. **Review the serial monitor output**
   - Look for error messages
   - Compare with expected output in documentation

3. **Check hardware connections**
   - Verify all wiring matches [HARDWARE.md](HARDWARE.md)
   - Use multimeter to check voltages

4. **Test individual components**
   - See [HARDWARE.md - Testing](HARDWARE.md#testing-individual-components)

---

## 📝 File Descriptions

### Documentation Files
- **README.md** (3000 lines) - Complete user documentation
- **QUICKSTART.md** (600 lines) - Getting started guide
- **HARDWARE.md** (800 lines) - Wiring and assembly
- **CONFIG_API.md** (700 lines) - Configuration reference
- **ARCHITECTURE.md** (600 lines) - System design
- **INDEX.md** (this file) - Navigation guide

### Source Code Files
- **src/main.cpp** (150 lines) - Application entry point
- **include/Config.h** (50 lines) - Constants and structures
- **include/SensorFusion.h** (70 lines) - IMU fusion algorithm
- **include/SuspensionSimulator.h** (100 lines) - Physics simulation
- **include/StorageManager.h** (100 lines) - Configuration storage
- **include/PWMOutputs.h** (60 lines) - Servo driver
- **include/WebServer.h** (350 lines) - Web interface + API

### Configuration Files
- **platformio.ini** - PlatformIO project config
- **package.json** - Project metadata
- **INSTRUCTIONS.json** - Build instructions

---

## 💡 Tips & Tricks

### For best results:
1. **Sensor placement**: Mount MPU6050 rigidly (not loose)
2. **Wiring**: Use shielded cable for servo signals if possible
3. **Power**: Use dedicated 5V supply for servos (don't share with ESP32)
4. **Tuning**: Start with defaults, adjust one parameter at a time
5. **Testing**: Tilt slowly at first to understand response

### For development:
1. **Serial debugging**: Monitor shows all startup info
2. **Configuration**: Edit Config.h for hardware customization
3. **Parameters**: Modify defaults or use web UI for live testing
4. **Extension**: SuspensionSimulator.h is well-commented for modifications

---

## 🔄 Document Maintenance

Last Updated: January 2026
Version: 1.0.0

All documentation is kept in sync with the firmware code. When you see version mismatches or documentation issues, please check the serial monitor output for actual device status.

---

## 🎯 Next Steps

1. **New to the project?** → Start with [QUICKSTART.md](QUICKSTART.md)
2. **Already set up?** → Go to [CONFIG_API.md](CONFIG_API.md) to adjust parameters
3. **Want to understand it?** → Read [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Need hardware help?** → See [HARDWARE.md](HARDWARE.md)
5. **Found an issue?** → Check troubleshooting sections

---

## 📚 Document Map

```
You are here (INDEX.md)
       ↓
       ├─→ QUICKSTART.md (Getting started)
       │      ↓
       │      └─→ HARDWARE.md (Hardware details)
       │
       ├─→ README.md (Full documentation)
       │      ↓
       │      ├─→ CONFIG_API.md (Configuration)
       │      └─→ ARCHITECTURE.md (System design)
       │
       └─→ .github/copilot-instructions.md (Development)
```

---

**Happy suspension simulating! 🚗**

For questions or issues, refer to the appropriate documentation file above. Each document is self-contained and cross-referenced.
