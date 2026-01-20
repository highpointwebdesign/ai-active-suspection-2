#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <MPU6050.h>
#include "Config.h"
#include "SensorFusion.h"
#include "SuspensionSimulator.h"
#include "WebServer.h"
#include "StorageManager.h"
#include "PWMOutputs.h"

// Global instances
MPU6050 mpu;
SensorFusion sensorFusion;
SuspensionSimulator suspensionSimulator;
WebServerManager webServer;
StorageManager storageManager;
PWMOutputs pwmOutputs;

// Timing variables
unsigned long lastMPUReadTime = 0;
unsigned long lastSimulationTime = 0;

// Development mode flag
bool mpuConnected = false;

void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n\nESP32 Active Suspension Simulator - Starting...");
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS Mount Failed");
    return;
  }
  Serial.println("SPIFFS initialized");
  
  // Load configuration from storage
  storageManager.init();
  storageManager.loadConfig();
  SuspensionConfig config = storageManager.getConfig();
  
  // Initialize I2C and MPU6050
  Wire.begin(21, 22); // SDA=21, SCL=22 for most ESP32 boards
  delay(100);
  
  mpuConnected = mpu.testConnection();
  if (!mpuConnected) {
    Serial.println("⚠️  MPU6050 connection failed - using simulated sensor data for testing");
    webServer.init(storageManager);
    webServer.sendStatus("⚠️ Development Mode: MPU6050 not connected (using simulated data)");
  } else {
    Serial.println("MPU6050 initialized successfully");
  }
  
  // Initialize sensor fusion with config
  sensorFusion.init(config.sampleRate);
  
  // Initialize and start WiFi + Web Server (if not already started)
  if (mpuConnected) {
    webServer.init(storageManager);
  }
  
  // Set up recalibration callback for web interface
  webServer.setCalibrationCallback([&]() {
    if (mpuConnected) {
      sensorFusion.calibrate(mpu, [](const String& msg) {
        webServer.sendStatus(msg);
      });
    } else {
      webServer.sendStatus("⚠️ Cannot calibrate - MPU6050 not connected");
    }
  });
  
  // Calibrate to current position as level (sends status to web dashboard)
  if (mpuConnected) {
    sensorFusion.calibrate(mpu, [](const String& msg) {
      webServer.sendStatus(msg);
    });
  }
  
  // Initialize suspension simulator with config
  suspensionSimulator.init(config);
  
  // Initialize PWM outputs
  pwmOutputs.init();
  
  // Send final ready status
  webServer.sendStatus("✓ System ready!");
  
  Serial.println("Setup complete!");
}

// Main loop
void loop() {
  unsigned long currentTime = millis();
  
  // Read MPU6050 sensor data at specified rate
  if (currentTime - lastMPUReadTime >= (1000 / SUSPENSION_SAMPLE_RATE_HZ)) {
    float accelX, accelY, accelZ, gyroX, gyroY, gyroZ;
    
    if (mpuConnected) {
      // Read real sensor data
      int16_t ax, ay, az, gx, gy, gz;
      mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
      
      // Convert raw values to g's and dps
      accelX = ax / 16384.0f;
      accelY = ay / 16384.0f;
      accelZ = az / 16384.0f;
      gyroX = gx / 131.0f;
      gyroY = gy / 131.0f;
      gyroZ = gz / 131.0f;
    } else {
      // Use simulated sensor data for testing
      float t = currentTime / 1000.0f;
      accelX = 0.05f * sin(t * 0.5f);  // Gentle roll motion
      accelY = 0.03f * sin(t * 0.7f);  // Gentle pitch motion
      accelZ = 1.0f + 0.1f * sin(t * 1.2f);  // Gravity + small vertical variation
      gyroX = 2.0f * cos(t * 0.5f);
      gyroY = 1.5f * cos(t * 0.7f);
      gyroZ = 0.5f * sin(t * 0.3f);
    }
    
    // Update sensor fusion
    sensorFusion.update(accelX, accelY, accelZ, gyroX, gyroY, gyroZ);
    
    lastMPUReadTime = currentTime;
  }
  
  // Run suspension simulation
  if (currentTime - lastSimulationTime >= (1000 / SUSPENSION_SAMPLE_RATE_HZ)) {
    // Get current orientation and acceleration from sensor fusion
    float roll = sensorFusion.getRoll();
    float pitch = sensorFusion.getPitch();
    float verticalAccel = sensorFusion.getVerticalAcceleration();
    
    // Update suspension state
    suspensionSimulator.update(roll, pitch, verticalAccel);
    
    // Get suspension outputs (0-180 degrees for servos)
    float fl = suspensionSimulator.getFrontLeftOutput();
    float fr = suspensionSimulator.getFrontRightOutput();
    float rl = suspensionSimulator.getRearLeftOutput();
    float rr = suspensionSimulator.getRearRightOutput();
    
    // Write PWM outputs
    pwmOutputs.setChannel(0, fl);
    pwmOutputs.setChannel(1, fr);
    pwmOutputs.setChannel(2, rl);
    pwmOutputs.setChannel(3, rr);
    
    lastSimulationTime = currentTime;
  }
  
  yield();
}
