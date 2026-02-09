import { useState, useEffect, useRef } from 'react';
import { getConfig, calibrateMPU, updateConfigParam, subscribeToSensorData, subscribeToBatteryData, getWebSocketStatus } from './api/esp32';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Tuning from './components/Tuning';
import Lights from './components/Lights';
import FPV from './components/FPV';
import ServoConfig from './components/ServoConfig';
import BottomNav from './components/BottomNav';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [batteryData, setBatteryData] = useState([]);
  const defaultBatteryConfig = [
    { name: '', cellCount: 3, plugAssignment: 0, showOnDashboard: 1 },
    { name: '', cellCount: 3, plugAssignment: 0, showOnDashboard: 1 },
    { name: '', cellCount: 3, plugAssignment: 0, showOnDashboard: 1 }
  ];
  const extractBatteryArray = (cfg) => {
    if (Array.isArray(cfg)) return cfg;
    if (cfg && Array.isArray(cfg.batteries)) return cfg.batteries;
    if (cfg && typeof cfg === 'object') {
      return [1, 2, 3].map((i) =>
        cfg[`battery${i}`] ?? cfg[i] ?? cfg[String(i)] ?? cfg[i - 1] ?? null
      );
    }
    return null;
  };
  const normalizeBatteryConfig = (cfg) => {
    const arr = extractBatteryArray(cfg);
    if (!Array.isArray(arr)) return defaultBatteryConfig;
    return arr.map((item, idx) => ({
      ...defaultBatteryConfig[idx],
      ...(item || {}),
      showOnDashboard: item?.showOnDashboard === true || Number(item?.showOnDashboard) === 1 ? 1 : 0
    }));
  };
  const [batteryConfig, setBatteryConfig] = useState(defaultBatteryConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [rolloverDetected, setRolloverDetected] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const configLoadedRef = useRef(false);

  // Monitor WebSocket connection status
  useEffect(() => {
    const checkStatus = () => {
      const status = getWebSocketStatus();
      setConnected(status.connected);
    };
    
    // Check initially
    checkStatus();
    
    // Load config on first connection
    if (!configLoadedRef.current && connected) {
      getConfig().then(configData => {
        setConfig(configData);
        // Extract battery config from the combined config response
        if (configData && configData.batteries) {
          setBatteryConfig(normalizeBatteryConfig(configData.batteries));
        }
        configLoadedRef.current = true;
      }).catch(() => {});
    }
    
    // Check status periodically
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [connected]);

  // Battery config is now loaded as part of the main config, so we can remove the second useEffect
  // The battery config will be updated whenever the main config loads

  // Subscribe to sensor and battery data via WebSocket
  useEffect(() => {
    const unsubscribeSensor = subscribeToSensorData((data) => {
      setSensorData({
        roll: data.roll,
        pitch: data.pitch,
        yaw: data.yaw,
        verticalAccel: data.verticalAccel
      });
      
      // Detect rollover: roll > 90° or pitch > 90° indicates vehicle is upside down or on its side
      const isRollover = Math.abs(data.roll) > 90 || Math.abs(data.pitch) > 90;
      setRolloverDetected(isRollover);
    });
    
    const unsubscribeBattery = subscribeToBatteryData((data) => {
      setBatteryData(data.voltages || []);
    });
    
    return () => {
      unsubscribeSensor();
      unsubscribeBattery();
    };
  }, []);

  const handleReconnect = async () => {
    try {
      // Reload config on reconnect
      const configData = await getConfig();
      setConfig(configData);
    } catch (error) {
      setConnected(false);
      // Silently fail for periodic checks, don't spam console
    }
  };

  const handleIpChange = () => {
    // Config will reload on next connection
    configLoadedRef.current = false;
  };

  const handleCalibrate = async () => {
    await calibrateMPU();
  };

  const handleUpdateConfig = async (param, value) => {
    await updateConfigParam(param, value);
    // Update local config state without reloading from server
    setConfig(prev => ({ ...prev, [param]: value }));
  };

  return (
    <div className="app">
      <header>
        <h1>R/C PerformanceIQ</h1>
        <div className="header-controls">
          <button
            className="network-settings-btn"
            title="Network Settings"
            onClick={() => setShowSettings(true)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <svg
              width="28" height="28" viewBox="0 0 24 24"
              fill="none"
              stroke={connected ? '#16c79a' : '#888'}
              style={{ opacity: connected ? 1 : 0.6, transition: 'stroke 0.3s, opacity 0.3s' }}
              strokeWidth="2"
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <circle cx="12" cy="20" r="1" fill={connected ? '#16c79a' : '#888'} />
              {!connected && (
                <line x1="4" y1="4" x2="20" y2="20" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <main>
        {connected ? (
          <>
            {currentPage === 'dashboard' && (
              <Dashboard 
                sensorData={sensorData}
                batteryData={batteryData}
                batteryConfig={batteryConfig}
                config={config}
                onCalibrate={handleCalibrate}
                rolloverDetected={rolloverDetected}
              />
            )}
            {currentPage === 'tuning' && (
              <Tuning 
                config={config}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
            {currentPage === 'lights' && <Lights />}
            {currentPage === 'fpv' && <FPV />}
            {currentPage === 'servo' && (
              <ServoConfig 
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onBatteryConfigChange={setBatteryConfig}
                batteryConfig={batteryConfig}
              />
            )}
          </>
        ) : (
          <div className="connection-error">
            <h2>Unable to Connect</h2>
            <p>Make sure you're connected to the ESP32 or check the IP address in settings</p>
            <button onClick={handleReconnect}>Retry Connection</button>
            <button onClick={() => setShowSettings(true)}>Open Network Settings</button>
          </div>
        )}
      </main>

      {connected && (
        <BottomNav 
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
          onIpChange={handleIpChange}
        />
      )}
    </div>
  );
}

export default App;
