#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <WiFi.h>
#include <functional>
#include "StorageManager.h"

class WebServerManager {
private:
  AsyncWebServer server{80};
  AsyncWebSocket ws{"/ws"};
  StorageManager* storageManager = nullptr;
  std::function<void()> calibrationCallback = nullptr;
  
public:
  void init(StorageManager& storage) {
    storageManager = &storage;
    
    // Start WiFi in AP mode
    startWiFiAP();
    
    // Setup WebSocket
    ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
      if (type == WS_EVT_CONNECT) {
        Serial.printf("WebSocket client #%u connected\n", client->id());
      } else if (type == WS_EVT_DISCONNECT) {
        Serial.printf("WebSocket client #%u disconnected\n", client->id());
      }
    });
    server.addHandler(&ws);
    
    // Setup web server routes
    setupRoutes();
    
    // Start server
    server.begin();
    Serial.println("Web server started on http://192.168.4.1");
  }
  
  // Public method to send status messages to all connected clients
  void sendStatus(const String& message) {
    ws.textAll(message);
  }
  
  // Set calibration callback for MPU6050 recalibration
  void setCalibrationCallback(std::function<void()> callback) {
    calibrationCallback = callback;
  }
  
private:
  void startWiFiAP() {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(WIFI_SSID, WIFI_PASSWORD);
    
    IPAddress ip(WIFI_AP_IP);
    IPAddress gateway(WIFI_AP_GATEWAY);
    IPAddress subnet(WIFI_AP_SUBNET);
    
    WiFi.softAPConfig(ip, gateway, subnet);
    
    Serial.print("WiFi AP started: ");
    Serial.println(WIFI_SSID);
    Serial.print("IP address: ");
    Serial.println(WiFi.softAPIP());
  }
  
  void setupRoutes() {
    // Serve main HTML page
    server.on("/", HTTP_GET, [this](AsyncWebServerRequest *request) {
      request->send(200, "text/html", getHTMLPage());
    });
    
    // API endpoint to get current config
    server.on("/api/config", HTTP_GET, [this](AsyncWebServerRequest *request) {
      String configJson = storageManager->getConfigJSON();
      request->send(200, "application/json", configJson);
    });
    
    // API endpoint to update config
    server.on("/api/config", HTTP_POST, [this](AsyncWebServerRequest *request) {}, nullptr, 
      [this](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, data);
        
        if (!error) {
          if (doc.containsKey("reactionSpeed")) {
            storageManager->updateParameter("reactionSpeed", doc["reactionSpeed"]);
          }
          if (doc.containsKey("rideHeightOffset")) {
            storageManager->updateParameter("rideHeightOffset", doc["rideHeightOffset"]);
          }
          if (doc.containsKey("rangeLimit")) {
            storageManager->updateParameter("rangeLimit", doc["rangeLimit"]);
          }
          if (doc.containsKey("damping")) {
            storageManager->updateParameter("damping", doc["damping"]);
          }
          if (doc.containsKey("frontRearBalance")) {
            storageManager->updateParameter("frontRearBalance", doc["frontRearBalance"]);
          }
          if (doc.containsKey("stiffness")) {
            storageManager->updateParameter("stiffness", doc["stiffness"]);
          }
          
          request->send(200, "application/json", "{\"status\":\"success\"}");
        } else {
          request->send(400, "application/json", "{\"status\":\"error\"}");
        }
      });
    
    // API endpoint to reset config to defaults
    server.on("/api/reset", HTTP_POST, [this](AsyncWebServerRequest *request) {
      storageManager->resetToDefaults();
      sendStatus("⚙️ Settings reset to factory defaults");
      request->send(200, "application/json", "{\"status\":\"success\"}");
    });
    
    // API endpoint to recalibrate MPU6050
    server.on("/api/calibrate", HTTP_POST, [this](AsyncWebServerRequest *request) {
      if (calibrationCallback) {
        sendStatus("🔄 Starting recalibration...");
        calibrationCallback();
        request->send(200, "application/json", "{\"status\":\"success\"}");
      } else {
        request->send(500, "application/json", "{\"status\":\"error\",\"message\":\"Calibration not available\"}");
      }
    });
    
    // Catch all - redirect to root
    server.onNotFound([this](AsyncWebServerRequest *request) {
      request->redirect("/");
    });
  }
  
  String getHTMLPage() {
    return R"===(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESP32 Active Suspension Control</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            padding: 20px;
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 24px;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-bottom: 20px;
        }
        
        .control-group {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .slider-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        input[type="range"] {
            flex: 1;
            height: 6px;
            border-radius: 3px;
            background: #ddd;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(102, 126, 234, 0.4);
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 5px rgba(102, 126, 234, 0.4);
        }
        
        .value-display {
            min-width: 60px;
            text-align: right;
            font-weight: 600;
            color: #667eea;
            font-size: 14px;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-save {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-save:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-save:active {
            transform: translateY(0);
        }
        
        .btn-reset {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .btn-reset:hover {
            background: #e0e0e0;
        }
        
        .status-message {
            text-align: center;
            padding: 10px;
            margin-top: 15px;
            border-radius: 6px;
            font-size: 12px;
            display: none;
        }
        
        .status-message.show {
            display: block;
        }
        
        .status-message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .info-box {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 12px;
            border-radius: 4px;
            font-size: 12px;
            color: #0c5aa0;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        .help-icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            line-height: 16px;
            text-align: center;
            background: #667eea;
            color: white;
            border-radius: 50%;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            margin-left: 5px;
            user-select: none;
        }
        
        .help-icon:hover {
            background: #764ba2;
        }
        
        .help-text {
            display: none;
            margin-top: 8px;
            padding: 8px;
            background: #e8eaf6;
            border-radius: 4px;
            font-size: 11px;
            color: #555;
            line-height: 1.4;
        }
        
        .help-text.show {
            display: block;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 15px;
            }
            
            h1 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Suspension Control</h1>
        <p class="subtitle">ESP32 Active Suspension Manager</p>
        
        <div class="control-group">
            <label for="reactionSpeed">Reaction Speed <span class="help-icon" onclick="toggleHelp('reactionSpeed')">?</span></label>
            <div class="slider-container">
                <input type="range" id="reactionSpeed" min="0.1" max="5" step="0.1" value="1.0">
                <span class="value-display" id="reactionSpeedValue">1.0</span>
            </div>
            <div class="help-text" id="reactionSpeedHelp">Controls how quickly the suspension responds to changes. Higher = faster response, but may cause oscillations.</div>
        </div>
        
        <div class="control-group">
            <label for="rideHeightOffset">Ride Height <span class="help-icon" onclick="toggleHelp('rideHeightOffset')">?</span></label>
            <div class="slider-container">
                <input type="range" id="rideHeightOffset" min="30" max="150" step="1" value="90">
                <span class="value-display" id="rideHeightOffsetValue">90</span>
            </div>
            <div class="help-text" id="rideHeightOffsetHelp">Sets the neutral servo position (90° = center). Adjust to change overall vehicle height.</div>
        </div>
        
        <div class="control-group">
            <label for="rangeLimit">Travel Range <span class="help-icon" onclick="toggleHelp('rangeLimit')">?</span></label>
            <div class="slider-container">
                <input type="range" id="rangeLimit" min="10" max="90" step="1" value="60">
                <span class="value-display" id="rangeLimitValue">60</span>
            </div>
            <div class="help-text" id="rangeLimitHelp">Maximum suspension travel in degrees (±). Limits how far servos can move from center position.</div>
        </div>
        
        <div class="control-group">
            <label for="damping">Damping <span class="help-icon" onclick="toggleHelp('damping')">?</span></label>
            <div class="slider-container">
                <input type="range" id="damping" min="0.1" max="2" step="0.1" value="0.8">
                <span class="value-display" id="dampingValue">0.8</span>
            </div>
            <div class="help-text" id="dampingHelp">Reduces oscillations and smooths suspension motion. Higher = more damping, softer response.</div>
        </div>
        
        <div class="control-group">
            <label for="frontRearBalance">Front/Rear Balance <span class="help-icon" onclick="toggleHelp('frontRearBalance')">?</span></label>
            <div class="slider-container">
                <input type="range" id="frontRearBalance" min="0" max="1" step="0.05" value="0.5">
                <span class="value-display" id="frontRearBalanceValue">0.5</span>
            </div>
            <div class="help-text" id="frontRearBalanceHelp">Distributes correction force between front and rear. 0=rear-biased, 1=front-biased, 0.5=balanced.</div>
        </div>
        
        <div class="control-group">
            <label for="stiffness">Stiffness <span class="help-icon" onclick="toggleHelp('stiffness')">?</span></label>
            <div class="slider-container">
                <input type="range" id="stiffness" min="0.5" max="3" step="0.1" value="1.0">
                <span class="value-display" id="stiffnessValue">1.0</span>
            </div>
            <div class="help-text" id="stiffnessHelp">Overall suspension firmness. Higher = stiffer, more responsive. Lower = softer, more forgiving.</div>
        </div>
        
        <div class="button-group">
            <button class="btn-reset" onclick="resetConfig()">Reset to Defaults</button>
        </div>
        
        <div class="button-group">
            <button class="btn-reset" onclick="recalibrateIMU()" style="width: 100%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none;">Recalibrate IMU</button>
        </div>
        
        <div class="status-message" id="statusMessage"></div>
        
        <div class="info-box" id="systemStatus" style="background: #fff3cd; border-left-color: #ffc107; color: #856404;">
            <strong>System Status:</strong><br>
            <span id="statusText">Connecting...</span>
        </div>
        
        <div class="info-box">
            <strong>Info:</strong><br>
            &bull; Adjustments save automatically when slider is released<br>
            &bull; Changes apply in real-time to suspension<br>
            &bull; Click ? icons for parameter help
        </div>
    </div>
    
    <script>
        // WebSocket connection
        let ws;
        let reconnectInterval;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://' + window.location.hostname + '/ws');
            
            ws.onopen = function() {
                console.log('WebSocket connected');
                document.getElementById('statusText').innerHTML = '✓ Connected';
                document.getElementById('systemStatus').style.background = '#d4edda';
                document.getElementById('systemStatus').style.borderLeftColor = '#28a745';
                document.getElementById('systemStatus').style.color = '#155724';
                clearInterval(reconnectInterval);
            };
            
            ws.onmessage = function(event) {
                console.log('Status update:', event.data);
                document.getElementById('statusText').innerHTML = event.data;
            };
            
            ws.onclose = function() {
                console.log('WebSocket disconnected');
                document.getElementById('statusText').innerHTML = '✗ Disconnected - Reconnecting...';
                document.getElementById('systemStatus').style.background = '#f8d7da';
                document.getElementById('systemStatus').style.borderLeftColor = '#dc3545';
                document.getElementById('systemStatus').style.color = '#721c24';
                
                // Try to reconnect every 3 seconds
                reconnectInterval = setInterval(connectWebSocket, 3000);
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                ws.close();
            };
        }
        
        // Connect on page load
        connectWebSocket();
        
        const controls = {
            reactionSpeed: document.getElementById('reactionSpeed'),
            rideHeightOffset: document.getElementById('rideHeightOffset'),
            rangeLimit: document.getElementById('rangeLimit'),
            damping: document.getElementById('damping'),
            frontRearBalance: document.getElementById('frontRearBalance'),
            stiffness: document.getElementById('stiffness')
        };
        
        const valueDisplays = {
            reactionSpeed: document.getElementById('reactionSpeedValue'),
            rideHeightOffset: document.getElementById('rideHeightOffsetValue'),
            rangeLimit: document.getElementById('rangeLimitValue'),
            damping: document.getElementById('dampingValue'),
            frontRearBalance: document.getElementById('frontRearBalanceValue'),
            stiffness: document.getElementById('stiffnessValue')
        };
        
        // Load config on page load
        window.addEventListener('load', loadConfig);
        
        // Update value displays and auto-save on input
        Object.keys(controls).forEach(key => {
            controls[key].addEventListener('input', (e) => {
                valueDisplays[key].textContent = parseFloat(e.target.value).toFixed(
                    key === 'reactionSpeed' || key === 'damping' || key === 'frontRearBalance' || key === 'stiffness' ? 2 : 0
                );
            });
            
            // Auto-save on change (when slider is released)
            controls[key].addEventListener('change', async (e) => {
                const config = {};
                config[key] = parseFloat(e.target.value);
                
                try {
                    await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(config)
                    });
                    showStatus('✓ ' + key + ' saved', 'success');
                } catch (error) {
                    showStatus('Failed to save ' + key, 'error');
                }
            });
        });
        
        function toggleHelp(paramName) {
            const helpEl = document.getElementById(paramName + 'Help');
            helpEl.classList.toggle('show');
        }
        
        async function loadConfig() {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                
                Object.keys(controls).forEach(key => {
                    if (config.hasOwnProperty(key)) {
                        controls[key].value = config[key];
                        valueDisplays[key].textContent = parseFloat(config[key]).toFixed(
                            key === 'reactionSpeed' || key === 'damping' || key === 'frontRearBalance' || key === 'stiffness' ? 2 : 0
                        );
                    }
                });
            } catch (error) {
                console.error('Failed to load config:', error);
                showStatus('Failed to load configuration', 'error');
            }
        }
        
        async function saveConfig() {
            const config = {};
            Object.keys(controls).forEach(key => {
                config[key] = parseFloat(controls[key].value);
            });
            
            try {
                const response = await fetch('/api/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                });
                
                if (response.ok) {
                    showStatus('✓ Configuration saved successfully!', 'success');
                } else {
                    showStatus('Failed to save configuration', 'error');
                }
            } catch (error) {
                console.error('Failed to save config:', error);
                showStatus('Failed to save configuration', 'error');
            }
        }
        
        async function resetConfig() {
            if (confirm('Reset all settings to factory defaults?')) {
                try {
                    const response = await fetch('/api/reset', {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        // Reload the new default values from server
                        await loadConfig();
                        showStatus('✓ Settings reset to factory defaults!', 'success');
                    } else {
                        showStatus('Failed to reset settings', 'error');
                    }
                } catch (error) {
                    console.error('Failed to reset config:', error);
                    showStatus('Failed to reset settings', 'error');
                }
            }
        }
        
        async function recalibrateIMU() {
            if (confirm('Recalibrate IMU? Keep vehicle still during calibration.')) {
                try {
                    const response = await fetch('/api/calibrate', {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        showStatus('✓ IMU recalibration started', 'success');
                    } else {
                        showStatus('Failed to recalibrate IMU', 'error');
                    }
                } catch (error) {
                    console.error('Failed to recalibrate:', error);
                    showStatus('Failed to recalibrate IMU', 'error');
                }
            }
        }
        
        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = 'status-message show ' + type;
            
            setTimeout(() => {
                statusEl.classList.remove('show');
            }, 3000);
        }
    </script>
</body>
</html>
    )===";
  }
};

#endif
