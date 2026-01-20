#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include "Config.h"
#include <ArduinoJson.h>
#include <SPIFFS.h>

class StorageManager {
private:
  SuspensionConfig config;
  
public:
  void init() {
    loadDefaults();
  }
  
  void loadDefaults() {
    config.reactionSpeed = DEFAULT_REACTION_SPEED;
    config.rideHeightOffset = DEFAULT_RIDE_HEIGHT;
    config.rangeLimit = DEFAULT_RANGE_LIMIT;
    config.damping = DEFAULT_DAMPING;
    config.frontRearBalance = DEFAULT_FRONT_REAR_BALANCE;
    config.stiffness = DEFAULT_STIFFNESS;
    config.sampleRate = SUSPENSION_SAMPLE_RATE_HZ;
  }
  
  void loadConfig() {
    if (!SPIFFS.exists(CONFIG_SPIFFS_PATH)) {
      Serial.println("Config file not found, using defaults");
      return;
    }
    
    File file = SPIFFS.open(CONFIG_SPIFFS_PATH, "r");
    if (!file) {
      Serial.println("Failed to open config file");
      return;
    }
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, file);
    file.close();
    
    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      return;
    }
    
    config.reactionSpeed = doc["reactionSpeed"] | DEFAULT_REACTION_SPEED;
    config.rideHeightOffset = doc["rideHeightOffset"] | DEFAULT_RIDE_HEIGHT;
    config.rangeLimit = doc["rangeLimit"] | DEFAULT_RANGE_LIMIT;
    config.damping = doc["damping"] | DEFAULT_DAMPING;
    config.frontRearBalance = doc["frontRearBalance"] | DEFAULT_FRONT_REAR_BALANCE;
    config.stiffness = doc["stiffness"] | DEFAULT_STIFFNESS;
    config.sampleRate = doc["sampleRate"] | SUSPENSION_SAMPLE_RATE_HZ;
    
    Serial.println("Config loaded from SPIFFS");
  }
  
  void saveConfig() {
    DynamicJsonDocument doc(1024);
    
    doc["reactionSpeed"] = config.reactionSpeed;
    doc["rideHeightOffset"] = config.rideHeightOffset;
    doc["rangeLimit"] = config.rangeLimit;
    doc["damping"] = config.damping;
    doc["frontRearBalance"] = config.frontRearBalance;
    doc["stiffness"] = config.stiffness;
    doc["sampleRate"] = config.sampleRate;
    
    File file = SPIFFS.open(CONFIG_SPIFFS_PATH, "w");
    if (!file) {
      Serial.println("Failed to create config file");
      return;
    }
    
    serializeJson(doc, file);
    file.close();
    
    Serial.println("Config saved to SPIFFS");
  }
  
  SuspensionConfig getConfig() const {
    return config;
  }
  
  void setConfig(const SuspensionConfig& newConfig) {
    config = newConfig;
    saveConfig();
  }
  
  void updateParameter(const String& key, float value) {
    if (key == "reactionSpeed") config.reactionSpeed = value;
    else if (key == "rideHeightOffset") config.rideHeightOffset = value;
    else if (key == "rangeLimit") config.rangeLimit = value;
    else if (key == "damping") config.damping = value;
    else if (key == "frontRearBalance") config.frontRearBalance = value;
    else if (key == "stiffness") config.stiffness = value;
    
    saveConfig();
  }
  
  void resetToDefaults() {
    loadDefaults();
    saveConfig();
    Serial.println("Config reset to defaults");
  }
  
  String getConfigJSON() {
    DynamicJsonDocument doc(1024);
    
    doc["reactionSpeed"] = config.reactionSpeed;
    doc["rideHeightOffset"] = config.rideHeightOffset;
    doc["rangeLimit"] = config.rangeLimit;
    doc["damping"] = config.damping;
    doc["frontRearBalance"] = config.frontRearBalance;
    doc["stiffness"] = config.stiffness;
    doc["sampleRate"] = config.sampleRate;
    
    String output;
    serializeJson(doc, output);
    return output;
  }
};

#endif
