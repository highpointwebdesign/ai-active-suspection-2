#ifndef CONFIG_H
#define CONFIG_H

// Sensor configuration
#define SUSPENSION_SAMPLE_RATE_HZ 50  // 50 Hz update rate
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22

// PWM Output configuration (using PCA9685 or direct GPIO)
#define PWM_FREQ 50  // 50 Hz for servo control
// Note: PWM_RESOLUTION is defined in PWMOutputs.h

// GPIO assignments for PWM outputs (if using direct GPIO instead of PCA9685)
#define PWM_FL_PIN 12  // Front Left
#define PWM_FR_PIN 13  // Front Right
#define PWM_RL_PIN 14  // Rear Left
#define PWM_RR_PIN 15  // Rear Right

// Default suspension parameters
#define DEFAULT_REACTION_SPEED 1.0f
#define DEFAULT_RIDE_HEIGHT 90.0f
#define DEFAULT_RANGE_LIMIT 60.0f
#define DEFAULT_DAMPING 0.8f
#define DEFAULT_FRONT_REAR_BALANCE 0.5f
#define DEFAULT_STIFFNESS 1.0f

// WiFi configuration - Home network (STA mode)
#define HOME_WIFI_SSID "YOUR_HOME_WIFI_NAME"  // Change this to your WiFi name
#define HOME_WIFI_PASSWORD "YOUR_HOME_WIFI_PASSWORD"  // Change this to your WiFi password
#define WIFI_CONNECT_TIMEOUT 30000  // 30 seconds timeout

// WiFi configuration - Access Point mode (fallback)
#define WIFI_AP_SSID "ESP32-Suspension"
#define WIFI_AP_PASSWORD "12345678"
#define WIFI_AP_IP 192, 168, 4, 1
#define WIFI_AP_GATEWAY 192, 168, 4, 1
#define WIFI_AP_SUBNET 255, 255, 255, 0

// Storage configuration
#define CONFIG_SPIFFS_PATH "/config.json"

// Data structures
struct SuspensionConfig {
  float reactionSpeed;
  float rideHeightOffset;
  float rangeLimit;
  float damping;
  float frontRearBalance;  // 0.0 = all rear, 1.0 = all front
  float stiffness;
  uint16_t sampleRate;
};

#endif
