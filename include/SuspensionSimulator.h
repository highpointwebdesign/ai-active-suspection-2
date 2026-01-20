#ifndef SUSPENSION_SIMULATOR_H
#define SUSPENSION_SIMULATOR_H

#include "Config.h"
#include <cmath>

class SuspensionSimulator {
private:
  SuspensionConfig config;
  
  // Suspension state for each corner
  struct CornerState {
    float position = 0.0f;  // 0-180 servo position
    float velocity = 0.0f;
    float target = 0.0f;
  };
  
  CornerState frontLeft;
  CornerState frontRight;
  CornerState rearLeft;
  CornerState rearRight;
  
  float lastRoll = 0.0f;
  float lastPitch = 0.0f;
  float lastVerticalAccel = 0.0f;

public:
  void init(const SuspensionConfig& cfg) {
    config = cfg;
    
    // Initialize all corners to center position
    float centerPos = config.rideHeightOffset;
    frontLeft.position = centerPos;
    frontRight.position = centerPos;
    rearLeft.position = centerPos;
    rearRight.position = centerPos;
  }
  
  void update(float roll, float pitch, float verticalAccel) {
    // Roll effect on suspension (negative roll = left drops, right rises)
    float rollEffect = roll * config.stiffness;
    
    // Pitch effect (negative pitch = front drops, rear rises)
    float pitchEffect = pitch * config.stiffness;
    
    // Vertical acceleration effect (compressed under acceleration)
    float verticalEffect = -verticalAccel * config.damping;
    
    // Front/Rear balance distribution
    float frontPitchFactor = config.frontRearBalance;
    float rearPitchFactor = 1.0f - config.frontRearBalance;
    
    // Calculate target positions for each corner
    // Front Left = center + pitch effect (front) + roll effect (left) + vertical
    frontLeft.target = config.rideHeightOffset 
                      + (pitchEffect * frontPitchFactor)
                      + (rollEffect)
                      + verticalEffect;
    
    // Front Right = center + pitch effect (front) - roll effect (right) + vertical
    frontRight.target = config.rideHeightOffset 
                       + (pitchEffect * frontPitchFactor)
                       - (rollEffect)
                       + verticalEffect;
    
    // Rear Left = center - pitch effect (rear) + roll effect (left) + vertical
    rearLeft.target = config.rideHeightOffset 
                     - (pitchEffect * rearPitchFactor)
                     + (rollEffect)
                     + verticalEffect;
    
    // Rear Right = center - pitch effect (rear) - roll effect (right) + vertical
    rearRight.target = config.rideHeightOffset 
                      - (pitchEffect * rearPitchFactor)
                      - (rollEffect)
                      + verticalEffect;
    
    // Apply range limits
    clampPosition(frontLeft);
    clampPosition(frontRight);
    clampPosition(rearLeft);
    clampPosition(rearRight);
    
    // Smooth movement with damping (reaction speed)
    float smoothing = 1.0f / (1.0f + (5.0f / config.reactionSpeed));
    
    frontLeft.position = frontLeft.position * (1.0f - smoothing) + frontLeft.target * smoothing;
    frontRight.position = frontRight.position * (1.0f - smoothing) + frontRight.target * smoothing;
    rearLeft.position = rearLeft.position * (1.0f - smoothing) + rearLeft.target * smoothing;
    rearRight.position = rearRight.position * (1.0f - smoothing) + rearRight.target * smoothing;
  }
  
  float getFrontLeftOutput() const { return constrain(frontLeft.position, 0.0f, 180.0f); }
  float getFrontRightOutput() const { return constrain(frontRight.position, 0.0f, 180.0f); }
  float getRearLeftOutput() const { return constrain(rearLeft.position, 0.0f, 180.0f); }
  float getRearRightOutput() const { return constrain(rearRight.position, 0.0f, 180.0f); }

private:
  void clampPosition(CornerState& corner) {
    float minPos = config.rideHeightOffset - config.rangeLimit;
    float maxPos = config.rideHeightOffset + config.rangeLimit;
    corner.target = constrain(corner.target, minPos, maxPos);
  }
};

#endif
