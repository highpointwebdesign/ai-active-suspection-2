#ifndef SENSOR_FUSION_H
#define SENSOR_FUSION_H

#include <Arduino.h>
#include <cmath>

class SensorFusion {
private:
  // Complementary filter coefficients
  static constexpr float ALPHA = 0.95f;  // Accel weight: 5%, Gyro weight: 95%
  
  // Euler angles
  float roll = 0.0f;
  float pitch = 0.0f;
  float yaw = 0.0f;
  
  // Calibration offsets
  float rollOffset = 0.0f;
  float pitchOffset = 0.0f;
  
  // Filtered acceleration
  float verticalAccel = 0.0f;
  float filteredVerticalAccel = 0.0f;
  
  // Last update time
  unsigned long lastUpdateTime = 0;
  float dt = 0.02f;  // Default 50 Hz
  
  // Gravity reference
  static constexpr float GRAVITY = 9.81f;

public:
  void init(uint16_t sampleRate) {
    dt = 1.0f / sampleRate;
    lastUpdateTime = millis();
  }
  
  void update(float ax, float ay, float az, float gx, float gy, float gz) {
    // Calculate time delta
    unsigned long currentTime = millis();
    dt = (currentTime - lastUpdateTime) / 1000.0f;
    lastUpdateTime = currentTime;
    
    if (dt > 0.1f) dt = 0.02f;  // Clamp to prevent jumps
    
    // Accelerometer angles
    float accelRoll = atan2f(ay, az) * 57.2957795f;  // rad to deg
    float accelPitch = asinf(-ax / GRAVITY) * 57.2957795f;
    
    // Complementary filter for roll and pitch
    roll = ALPHA * (roll + gx * dt) + (1.0f - ALPHA) * accelRoll;
    pitch = ALPHA * (pitch + gy * dt) + (1.0f - ALPHA) * accelPitch;
    yaw += gz * dt;
    
    // Calculate vertical acceleration in world frame
    // Remove gravity component
    verticalAccel = az - 1.0f;  // Assume gravity is in Z axis when level
    
    // Low-pass filter vertical acceleration
    filteredVerticalAccel = 0.9f * filteredVerticalAccel + 0.1f * verticalAccel;
  }
  
  template<typename StatusCallback>
  void calibrate(MPU6050& mpu, StatusCallback statusFn, uint16_t samples = 100) {
    statusFn("🔄 Calibrating IMU... Keep vehicle still!");
    Serial.println("Calibrating IMU... Keep vehicle still!");
    
    float rollSum = 0.0f;
    float pitchSum = 0.0f;
    
    for (uint16_t i = 0; i < samples; i++) {
      int16_t ax, ay, az, gx, gy, gz;
      mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
      
      // Convert to g's
      float accelX = ax / 16384.0f;
      float accelY = ay / 16384.0f;
      float accelZ = az / 16384.0f;
      
      // Calculate angles from accelerometer
      float accelRoll = atan2f(accelY, accelZ) * 57.2957795f;
      float accelPitch = asinf(-accelX / GRAVITY) * 57.2957795f;
      
      rollSum += accelRoll;
      pitchSum += accelPitch;
      
      delay(10);  // 10ms between samples
    }
    
    rollOffset = rollSum / samples;
    pitchOffset = pitchSum / samples;
    
    String completeMsg = "✓ Calibration complete! Roll: " + String(rollOffset, 1) + "°, Pitch: " + String(pitchOffset, 1) + "°";
    statusFn(completeMsg);
    
    Serial.print("Calibration complete! Roll offset: ");
    Serial.print(rollOffset);
    Serial.print("°, Pitch offset: ");
    Serial.print(pitchOffset);
    Serial.println("°");
  }
  
  float getRoll() const { return roll - rollOffset; }
  float getPitch() const { return pitch - pitchOffset; }
  float getYaw() const { return yaw; }
  float getVerticalAcceleration() const { return filteredVerticalAccel; }
};

#endif
