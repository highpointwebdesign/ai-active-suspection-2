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

// Health check
export const getHealth = async () => {
  const response = await fetch(apiUrl('/api/health'));
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
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
    body: JSON.stringify({ param, value })
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

// WebSocket for live data
export class SuspensionWebSocket {
  constructor(onMessage) {
    this.ws = null;
    this.onMessage = onMessage;
    this.reconnectInterval = null;
  }

  connect() {
    const wsUrl = `ws://${getEsp32Ip()}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Auto-reconnect after 5 seconds
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
          console.log('Attempting to reconnect...');
          this.connect();
        }, 5000);
      }
    };
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
