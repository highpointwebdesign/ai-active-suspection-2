# Hardware Setup Guide

## Complete Wiring Instructions

### Component List

**Essential**:
- 1x ESP32-DevKit-V1 (or compatible ESP32 board)
- 1x MPU6050 6-axis IMU module
- 4x RC servo motors (standard 5V)
- 1x 5V power supply (1-2A minimum for servos)
- 1x USB cable (for ESP32 programming)
- Jumper wires (male-to-male and male-to-female)

**Optional**:
- 2x 4.7kΩ pull-up resistors (for I2C, often built-in on MPU6050 module)
- 1x Logic level converter (if using 5V servos with 3.3V signal, though not required)
- 1x Perfboard or breadboard for connections
- Small capacitors (0.1μF) for power supply decoupling

---

## Pinout Reference

### ESP32-DevKit-V1 Relevant Pins

```
Top Row (Left side):
  GND - 3.3V - EN - SVP - SVN - IO35 - IO34 - IO39 - IO36 - IO23 - IO22 - IO21 - IO19

Bottom Row (Left side):
  IO18 - IO5 - IO17 - IO16 - IO4 - IO0 - IO2 - IO15 - IO14 - IO13 - IO12 - GND

Right side:
  VIN - GND - D35 - D34 - D33 - D32 - D25 - D26 - D27 - D14 - D13 - GND
```

---

## I2C Connection (MPU6050)

### Pinout
```
MPU6050 Module Pins:
├── VCC  → ESP32 3.3V
├── GND  → ESP32 GND
├── SCL  → ESP32 GPIO 22
├── SDA  → ESP32 GPIO 21
├── AD0  → GND (sets address to 0x68, standard)
└── INT  → (optional, leave unconnected)
```

### Wiring Steps
1. **Power connections**:
   - MPU6050 VCC → ESP32 3.3V
   - MPU6050 GND → ESP32 GND

2. **I2C connections**:
   - MPU6050 SDA (Serial Data) → ESP32 GPIO 21
   - MPU6050 SCL (Serial Clock) → ESP32 GPIO 22

3. **Optional pull-ups** (if not on module):
   - 4.7kΩ resistor from GPIO 21 to 3.3V
   - 4.7kΩ resistor from GPIO 22 to 3.3V

### Troubleshooting I2C
- Most MPU6050 modules have built-in pull-up resistors
- If you get "MPU6050 connection failed", verify:
  - VCC and GND are connected
  - SDA and SCL are on correct pins
  - I2C address is 0x68 (confirm with `i2cdetect` tool)

---

## PWM Servo Connections

### GPIO Assignments
```
ESP32 GPIO → Servo Position → RC Vehicle Location
├── GPIO 12 → Servo 1 → Front-Left suspension
├── GPIO 13 → Servo 2 → Front-Right suspension
├── GPIO 14 → Servo 3 → Rear-Left suspension
└── GPIO 15 → Servo 4 → Rear-Right suspension
```

### Servo Connector Pinout (Standard 3-Pin)
```
Servo Connector (viewing connector head-on):
  Brown/Black - Red - Yellow/Orange
  |            |     |
  GND          5V    Signal
```

### Wiring Steps for Each Servo

**Servo 1 (Front-Left)**:
- Signal (Yellow) → ESP32 GPIO 12
- Power (Red) → 5V power supply
- Ground (Brown) → Common ground with ESP32

**Servo 2 (Front-Right)**:
- Signal (Yellow) → ESP32 GPIO 13
- Power (Red) → 5V power supply
- Ground (Brown) → Common ground with ESP32

**Servo 3 (Rear-Left)**:
- Signal (Yellow) → ESP32 GPIO 14
- Power (Red) → 5V power supply
- Ground (Brown) → Common ground with ESP32

**Servo 4 (Rear-Right)**:
- Signal (Yellow) → ESP32 GPIO 15
- Power (Red) → 5V power supply
- Ground (Brown) → Common ground with ESP32

### Important Notes
- **NEVER** power servos from ESP32 directly—use separate 5V supply
- **MUST** connect common ground between ESP32 and servo power supply
- Use thick wires (16-18 AWG) for servo power to avoid voltage drop
- Place a 100μF capacitor across servo power input (+ to -, - to GND)

---

## Power Supply Configuration

### Recommended Setup

```
┌─────────────────────────────────────────────────────┐
│                 5V Power Supply                      │
│              (1-2A minimum recommended)              │
└──────────────┬────────────────────────────┬──────────┘
               │                            │
         ┌─────┴────────┐         ┌─────────┴─────┐
         │              │         │               │
      [100μF Cap]   Servo GND  Servo Power   [100μF Cap]
         │              │         │               │
         │    ┌─────────┴─────────┴───┐           │
         │    │  Servo 1, 2, 3, 4    │           │
         │    │  Power Rails          │           │
         │    └───────────────────────┘           │
         │              │                         │
         └──────────────┼──────────────────────────┘
                        │
                    [COM GND]
                        │
    ┌───────────────────┴──────────────────┐
    │                                      │
    │         ESP32 Development Board      │
    │         ┌──────────────────┐        │
    │         │ GND Pins ────────┼────────┘
    │         │ 3.3V (to MPU6050)│
    │         │ GPIO 12-15──┐    │
    │         │            │    │
    │         └──────┬──────┘    │
    │                │           │
    │         Signal Wires to    │
    │         Servo 1,2,3,4      │
    │         GPIO 21,22 (I2C)   │
    │                │           │
    │         To MPU6050         │
    └────────────────┼───────────┘
                     │
```

---

## Complete Connection Summary Table

| Component | Pin | ESP32 Pin | Function |
|-----------|-----|-----------|----------|
| MPU6050 | VCC | 3.3V | Power |
| MPU6050 | GND | GND | Ground |
| MPU6050 | SCL | GPIO 22 | I2C Clock |
| MPU6050 | SDA | GPIO 21 | I2C Data |
| Servo 1 | Signal | GPIO 12 | Front-Left |
| Servo 1 | Power | 5V Supply | Power |
| Servo 1 | Ground | GND (common) | Ground |
| Servo 2 | Signal | GPIO 13 | Front-Right |
| Servo 2 | Power | 5V Supply | Power |
| Servo 2 | Ground | GND (common) | Ground |
| Servo 3 | Signal | GPIO 14 | Rear-Left |
| Servo 3 | Power | 5V Supply | Power |
| Servo 3 | Ground | GND (common) | Ground |
| Servo 4 | Signal | GPIO 15 | Rear-Right |
| Servo 4 | Power | 5V Supply | Power |
| Servo 4 | Ground | GND (common) | Ground |

---

## Step-by-Step Assembly

1. **Prepare the breadboard/perfboard** (optional but recommended for stability)

2. **Connect power rails**:
   - Connect GND from 5V power supply to GND on breadboard (multiple points)
   - Connect 5V from power supply to power rail on breadboard

3. **Connect ESP32**:
   - Place ESP32 on breadboard with pins accessible
   - Connect GND from ESP32 to common GND
   - Connect 3.3V (if needed for logic level conversion)

4. **Connect MPU6050**:
   - VCC → 3.3V (can come from ESP32)
   - GND → Common GND
   - SDA → GPIO 21
   - SCL → GPIO 22
   - Verify I2C address with terminal tool

5. **Connect Servos**:
   - For each servo:
     - Power (Red) → 5V rail
     - Ground (Brown/Black) → GND rail
     - Signal (Yellow/Orange) → Assigned GPIO (12, 13, 14, or 15)

6. **Double-check all connections** before powering on:
   - ✓ All ground connections present
   - ✓ Servo power from dedicated 5V supply (not ESP32)
   - ✓ Common ground between ESP32 and servo supply
   - ✓ I2C pull-ups (if needed)
   - ✓ All signal lines from correct GPIOs

7. **Power on in order**:
   - First: 5V servo supply (without USB)
   - Then: Connect USB to ESP32
   - Monitor serial output for "Setup complete!"

---

## Testing Individual Components

### Test I2C Connection
```bash
# If you have i2c-tools installed:
i2cdetect -y 1

# Should show device at 0x68
```

### Test Servo Response
- In the web interface, move sliders
- Each servo should move smoothly
- Try tilting the device with the MPU6050 attached
- Observe suspension movements

### Test GPIO Output
- Use a multimeter to measure voltage on GPIO pins
- Should see 0-3.3V PWM signal
- Frequency should be 50Hz

---

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "MPU6050 connection failed" | I2C wiring wrong | Verify SDA/SCL on correct pins (21/22) |
| Servos twitch randomly | Electrical noise | Add 100μF capacitors across servo power |
| Servo movement erratic | Weak power supply | Upgrade to higher current supply (2A+) |
| Servo won't move | Signal pin wrong | Check GPIO assignment in Config.h |
| I2C conflicts | Multiple devices at same address | Change AD0 jumper or use different bus |
| ESP32 resets on servo move | Power supply sag | Add larger capacitors or separate supply |
| WiFi disconnects | Electrical noise from servos | Shield servo power wires, add ferrite beads |

---

## Safety Considerations

⚠️ **IMPORTANT SAFETY NOTES**:

1. **Never** connect servo power directly to ESP32 3.3V
2. **Always** use a separate 5V power supply for servos
3. **Always** connect common ground between supplies
4. **Always** disconnect USB before power cycling to avoid confusion
5. **Ensure** 5V power supply is properly rated for servo current draw
6. **Do not** connect higher voltages (>5V) to GPIO pins
7. **Protect** all signal wires from mechanical stress
8. **Use** strain relief on connectors to prevent wire damage

---

## Optional: PCA9685 PWM Driver (for more servos)

If you need to control more than 4 servos, you can use a PCA9685 16-channel PWM driver:

- PCA9685 SCL → GPIO 22 (shares I2C bus with MPU6050)
- PCA9685 SDA → GPIO 21
- PCA9685 GND → Common GND
- PCA9685 VCC → 5V
- PCA9685 outputs → Servo signal pins

(Requires code modification to SuspensionSimulator.h to support more corners)

---

Next step: See [QUICKSTART.md](QUICKSTART.md) for software setup instructions.
