// Update FPV auto mode
export const setFpvAutoMode = async (autoMode) => {
  const response = await fetchEsp32('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fpvAutoMode: autoMode })
  });
  if (!response.ok) throw new Error('Failed to update FPV auto mode');
  return response.json();
};

// WebSocket Manager
let wsConnection = null;
let wsSubscribers = { telemetry: [], servo: [] };
let wsReconnectTimer = null;

const connectWebSocket = () => {
  if (wsConnection && wsConnection.readyState <= 1) return;
  
  const esp32Ip = getEsp32Ip();
  if (!esp32Ip) return;
  
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const wsUrl = isHttps ? `wss://${window.location.host}/ws?ip=${esp32Ip}` : `ws://${esp32Ip}/ws`;
  
  try {
    wsConnection = new WebSocket(wsUrl);
    
    // Note: Can't set custom headers on browser WebSocket, so we modify the URL on server
    // Server expects X-ESP32-IP header from the upgrade request
    // We'll send it as a query param that server can read
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected');
      if (wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
      }
    };
    
    wsConnection.onmessage = (event) => {
      try {
        // Handle Blob data from WebSocket
        if (event.data instanceof Blob) {
          event.data.text().then(text => {
            try {
              // Skip non-JSON messages (status messages are plain text)
              if (!text.trim().startsWith('{')) {
                return;
              }
              // Replace all variations of NaN/nan with null for valid JSON
              const sanitized = text
                .replace(/:\s*nan\b/gi, ': null')
                .replace(/:\s*NaN\b/g, ': null')
                .replace(/:\s*-?inf\b/gi, ': null');
              const data = JSON.parse(sanitized);
              const type = data.type;
              if (wsSubscribers[type]) {
                wsSubscribers[type].forEach(callback => callback(data));
              }
            } catch (err) {
              console.error('WS Blob parse error:', err);
              console.error('Failed text:', text);
            }
          });
        } else {
          // Skip non-JSON messages (status messages are plain text)
          if (!event.data.trim().startsWith('{')) {
            return;
          }
          // Replace all variations of NaN/nan with null for valid JSON
          const sanitized = event.data
            .replace(/:\s*nan\b/gi, ': null')
            .replace(/:\s*NaN\b/g, ': null')
            .replace(/:\s*-?inf\b/gi, ': null');
          const data = JSON.parse(sanitized);
          const type = data.type;
          if (wsSubscribers[type]) {
            wsSubscribers[type].forEach(callback => callback(data));
          }
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };
    
    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsConnection.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      wsConnection = null;
      wsReconnectTimer = setTimeout(connectWebSocket, 2000);
    };
  } catch (err) {
    console.error('WebSocket connection failed:', err);
    wsReconnectTimer = setTimeout(connectWebSocket, 2000);
  }
};

export const subscribeToTelemetry = (callback) => {
  wsSubscribers.telemetry.push(callback);
  if (!wsConnection) connectWebSocket();
  return () => {
    wsSubscribers.telemetry = wsSubscribers.telemetry.filter(cb => cb !== callback);
  };
};

// Legacy subscriptions for backward compatibility
export const subscribeToSensorData = (callback) => {
  return subscribeToTelemetry((data) => {
    // Extract sensor data from telemetry
    callback({
      type: 'sensor',
      roll: data.roll,
      pitch: data.pitch,
      yaw: data.yaw,
      verticalAccel: data.verticalAccel
    });
  });
};

export const subscribeToBatteryData = (callback) => {
  return subscribeToTelemetry((data) => {
    // Extract battery data from telemetry
    callback({
      type: 'battery',
      voltages: data.voltages
    });
  });
};

export const subscribeToServoData = (callback) => {
  wsSubscribers.servo.push(callback);
  if (!wsConnection) connectWebSocket();
  return () => {
    wsSubscribers.servo = wsSubscribers.servo.filter(cb => cb !== callback);
  };
};

export const getWebSocketStatus = () => {
  return {
    connected: wsConnection?.readyState === WebSocket.OPEN,
    readyState: wsConnection?.readyState
  };
};

// ESP32 API Client
// Default to ESP32 Access Point IP
const DEFAULT_ESP32_IP = '192.168.4.1';

// Allow user to configure ESP32 IP (stored in localStorage)
export const getEsp32Ip = () => {
  return localStorage.getItem('esp32_ip') || DEFAULT_ESP32_IP;
};

export const setEsp32Ip = (ip) => {
  localStorage.setItem('esp32_ip', ip);
};

const shouldProxy = () => {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
};

const apiUrl = (endpoint) => {
  if (shouldProxy()) {
    return endpoint;
  }
  return `http://${getEsp32Ip()}${endpoint}`;
};

const withProxyHeaders = (options = {}) => {
  if (!shouldProxy()) return options;
  
  const esp32Ip = getEsp32Ip();
  if (!esp32Ip) {
    throw new Error('ESP32 IP not configured. Set it in Settings first.');
  }
  
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      'X-ESP32-IP': esp32Ip
    }
  };
};

const fetchEsp32 = (endpoint, options = {}) => {
  return fetch(apiUrl(endpoint), withProxyHeaders(options));
};

// Health check with short timeout for quick disconnect detection
export const getHealth = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
  
  try {
    const response = await fetchEsp32('/api/health', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Get full configuration
export const getConfig = async () => {
  const response = await fetchEsp32('/api/config');
  if (!response.ok) throw new Error('Failed to get config');
  return response.json();
};

// Update configuration parameter
export const updateConfigParam = async (param, value) => {
  const response = await fetchEsp32('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [param]: value })
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
};

// Battery configuration
export const getBatteryConfig = async () => {
  const response = await fetchEsp32('/api/battery-config');
  if (!response.ok) throw new Error('Failed to get battery config');
  return response.json();
};

export const updateBatteryParam = async (battery, param, value) => {
  const response = await fetchEsp32('/api/battery-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ battery, param, value })
  });
  if (!response.ok) throw new Error('Failed to update battery config');
  return response.json();
};

// Servo configuration
export const getServoConfig = async (servo) => {
  const response = await fetchEsp32(`/api/servo-config?servo=${servo}`);
  if (!response.ok) throw new Error('Failed to get servo config');
  return response.json();
};

export const updateServoParam = async (servo, param, value) => {
  const response = await fetchEsp32('/api/servo-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servo, param, value })
  });
  if (!response.ok) throw new Error('Failed to update servo config');
  return response.json();
};

export const calibrateServo = async (servo) => {
  const response = await fetchEsp32('/api/calibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servo })
  });
  if (!response.ok) throw new Error('Failed to calibrate servo');
  return response.json();
};

// Calibrate MPU6050 (Set Level)
export const calibrateMPU = async () => {
  const response = await fetchEsp32('/api/calibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error('Failed to calibrate MPU6050');
  return response.json();
};

// Get live sensor and battery data (HTTP polling)
let sensorCache = null;
let sensorCacheTime = 0;
let sensorInFlight = null;

export const getSensorData = async () => {
  const now = Date.now();
  const minIntervalMs = 300;

  if (sensorCache && now - sensorCacheTime < minIntervalMs) {
    return sensorCache;
  }

  if (sensorInFlight) {
    return sensorInFlight;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

  sensorInFlight = (async () => {
    try {
      const response = await fetchEsp32('/api/sensors', {
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Failed to get sensor data');
      const data = await response.json();
      sensorCache = data;
      sensorCacheTime = Date.now();
      return data;
    } finally {
      clearTimeout(timeoutId);
      sensorInFlight = null;
    }
  })();

  return sensorInFlight;
}
