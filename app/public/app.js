// Configuration
const ESP32_IP = '192.168.87.23';  // Your ESP32 IP
const ESP32_WS_PORT = 80;           // ESP32 WebSocket port
const POLL_INTERVAL = 2000;         // 2 seconds (for display refresh)
const WS_URL = `ws://${ESP32_IP}:${ESP32_WS_PORT}/ws`;  // Direct connection, no protocol upgrade

// State management
let wsConnection = null;
let requestCount = 0;
let failedCount = 0;
let updateTimer = null;
let deferredPrompt = null;
let lastSensorData = null;

// DOM elements
const elements = {
    connectionStatus: document.getElementById('connectionStatus'),
    statusDot: document.querySelector('.status-dot'),
    statusText: document.querySelector('.status-text'),
    apiStatus: document.getElementById('apiStatus'),
    sensorStatus: document.getElementById('sensorStatus'),
    lastUpdate: document.getElementById('lastUpdate'),
    requestCount: document.getElementById('requestCount'),
    failedCount: document.getElementById('failedCount'),
    errorCard: document.getElementById('errorCard'),
    errorMessage: document.getElementById('errorMessage'),
    installBtn: document.getElementById('installBtn')
};

// Initialize the application
function init() {
    console.log('ESP32 Health Monitor initialized');
    registerServiceWorker();
    setupInstallPrompt();
    connectWebSocket();
}

// Service Worker registration
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
}

// PWA install prompt handling
function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        elements.installBtn.style.display = 'block';
    });

    elements.installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Install prompt outcome: ${outcome}`);
        
        deferredPrompt = null;
        elements.installBtn.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        deferredPrompt = null;
        elements.installBtn.style.display = 'none';
    });
}

// Start WebSocket connection
function connectWebSocket() {
    if (wsConnection && wsConnection.readyState <= 1) return;
    
    try {
        wsConnection = new WebSocket(WS_URL);
        
        wsConnection.onopen = () => {
            console.log('WebSocket connected to ESP32');
            updateConnectionStatus('connected', 'Connected');
        };
        
        wsConnection.onmessage = (event) => {
            try {
                // Skip non-JSON messages (status messages are plain text)
                if (event.data.trim && !event.data.trim().startsWith('{')) {
                    return;
                }
                
                // Handle Blob data
                if (event.data instanceof Blob) {
                    event.data.text().then(text => {
                        if (!text.trim().startsWith('{')) return;
                        try {
                            const sanitized = text
                                .replace(/:\s*nan\b/gi, ': null')
                                .replace(/:\s*NaN\b/g, ': null')
                                .replace(/:\s*-?inf\b/gi, ': null');
                            const data = JSON.parse(sanitized);
                            if (data.type === 'telemetry') {
                                lastSensorData = data;
                                handleTelemetryData(data);
                                requestCount++;
                            }
                        } catch (err) {
                            console.error('WS Blob parse error:', err);
                        }
                    });
                    return;
                }
                
                // Parse string data
                const sanitized = event.data
                    .replace(/:\s*nan\b/gi, ': null')
                    .replace(/:\s*NaN\b/g, ': null')
                    .replace(/:\s*-?inf\b/gi, ': null');
                const data = JSON.parse(sanitized);
                
                if (data.type === 'telemetry') {
                    lastSensorData = data;
                    handleTelemetryData(data);
                    requestCount++;
                }
            } catch (err) {
                console.error('WS message parse error:', err);
            }
        };
        
        wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('disconnected', 'Disconnected');
            failedCount++;
        };
        
        wsConnection.onclose = () => {
            console.log('WebSocket closed, reconnecting...');
            updateConnectionStatus('disconnected', 'Disconnected');
            wsConnection = null;
            setTimeout(connectWebSocket, 3000);
        };
    } catch (err) {
        console.error('WebSocket connection failed:', err);
        updateConnectionStatus('disconnected', 'Disconnected');
        failedCount++;
        setTimeout(connectWebSocket, 3000);
    }
}

// Stop WebSocket connection
function disconnectWebSocket() {
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }
}

// Handle telemetry data from WebSocket
function handleTelemetryData(data) {
    // Update connection status
    updateConnectionStatus('connected', 'Connected');

    // Update API status (assume ok if data is flowing)
    elements.apiStatus.textContent = 'ok';
    elements.apiStatus.style.color = 'var(--success-color)';

    // Update sensor status (check if MPU6050 data is valid)
    const sensorActive = data.roll !== null && data.pitch !== null && data.accelZ !== null;
    elements.sensorStatus.textContent = sensorActive ? 'Active' : 'Inactive';
    elements.sensorStatus.className = 'value sensor-status ' + (sensorActive ? 'active' : 'inactive');

    // Update last update time
    updateLastUpdateTime();
    updateRequestCount();
    hideError();
}

// Handle API errors
function handleError(error) {
    console.error('API request failed:', error);
    
    updateConnectionStatus('disconnected', 'Disconnected');
    
    let errorMsg = 'Unknown error';
    if (error.name === 'AbortError') {
        errorMsg = 'Request timeout - ESP32 not responding';
    } else if (error.message.includes('Failed to fetch')) {
        errorMsg = 'Network error - Cannot reach ESP32. Check your connection.';
    } else {
        errorMsg = error.message;
    }
    
    showError(errorMsg);
}

// Update connection status indicator
function updateConnectionStatus(status, text) {
    elements.statusDot.className = 'status-dot ' + status;
    elements.statusText.textContent = text;
}

// Update request counters
function updateRequestCount() {
    elements.requestCount.textContent = requestCount;
    elements.failedCount.textContent = failedCount;
}

// Update last update timestamp
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    elements.lastUpdate.textContent = timeString;
}

// Show error card
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorCard.style.display = 'block';
}

// Hide error card
function hideError() {
    elements.errorCard.style.display = 'none';
}

// Handle page visibility changes (pause WS when hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - disconnecting WebSocket');
        disconnectWebSocket();
    } else {
        console.log('Page visible - reconnecting WebSocket');
        connectWebSocket();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    disconnectWebSocket();
});

// Start the application
init();