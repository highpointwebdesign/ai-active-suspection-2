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

const apiUrl = (endpoint) => `http://${getEsp32Ip()}${endpoint}`;

// Health check with short timeout for quick disconnect detection
export const getHealth = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
  
  try {
    const response = await fetch(apiUrl('/api/health'), {
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
  const response = await fetch(apiUrl('/api/config'));
  if (!response.ok) throw new Error('Failed to get config');
  return response.json();
};

// Update configuration parameter
export const updateConfigParam = async (param, value) => {
  const response = await fetch(apiUrl('/api/config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [param]: value })
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
};

// Battery configuration
export const getBatteryConfig = async () => {
  const response = await fetch(apiUrl('/api/battery-config'));
  if (!response.ok) throw new Error('Failed to get battery config');
  return response.json();
};

export const updateBatteryParam = async (battery, param, value) => {
  const response = await fetch(apiUrl('/api/battery-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ battery, param, value })
  });
  if (!response.ok) throw new Error('Failed to update battery config');
  return response.json();
};

// Servo configuration
export const getServoConfig = async (servo) => {
  const response = await fetch(apiUrl(`/api/servo-config?servo=${servo}`));
  if (!response.ok) throw new Error('Failed to get servo config');
  return response.json();
};

export const updateServoParam = async (servo, param, value) => {
  const response = await fetch(apiUrl('/api/servo-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servo, param, value })
  });
  if (!response.ok) throw new Error('Failed to update servo config');
  return response.json();
};

export const calibrateServo = async (servo) => {
  const response = await fetch(apiUrl('/api/calibrate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servo })
  });
  if (!response.ok) throw new Error('Failed to calibrate servo');
  return response.json();
};

// Calibrate MPU6050 (Set Level)
export const calibrateMPU = async () => {
  const response = await fetch(apiUrl('/api/calibrate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error('Failed to calibrate MPU6050');
  return response.json();
};

// Get live sensor and battery data (HTTP polling)
export const getSensorData = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout
  
  try {
    const response = await fetch(apiUrl('/api/sensors'), {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Failed to get sensor data');
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
