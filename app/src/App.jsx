import { useState, useEffect, useRef } from 'react';
import { getHealth, getConfig, calibrateMPU, updateConfigParam, getSensorData } from './api/esp32';
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
  const [showSettings, setShowSettings] = useState(false);
  const [rolloverDetected, setRolloverDetected] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const pollingIntervalRef = useRef(null);
  const configLoadedRef = useRef(false);

  useEffect(() => {
    // Test connection on mount
    checkConnection();
    
    // Periodic health check every 3 seconds
    const healthCheckInterval = setInterval(() => {
      checkConnection();
    }, 3000);
    
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, []);

  // Sensor data polling only on dashboard page
  useEffect(() => {
    if (currentPage !== 'dashboard') {
      return;
    }
    
    // Start polling for sensor data every 500ms
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const data = await getSensorData();
        setSensorData({
          roll: data.roll,
          pitch: data.pitch,
          yaw: data.yaw,
          verticalAccel: data.verticalAccel
        });
        setBatteryData(data.batteries);
        
        // Detect rollover: roll > 90° or pitch > 90° indicates vehicle is upside down or on its side
        const isRollover = Math.abs(data.roll) > 90 || Math.abs(data.pitch) > 90;
        setRolloverDetected(isRollover);
      } catch (error) {
        // Silently fail - connection indicator handles this
      }
    }, 500); // Poll every 500ms (2 updates/second)
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentPage]);

  const checkConnection = async () => {
    try {
      const health = await getHealth();
      setConnected(health.status === 'ok');
      
      // Load config only once
      if (!configLoadedRef.current) {
        const configData = await getConfig();
        setConfig(configData);
        configLoadedRef.current = true;
      }
    } catch (error) {
      setConnected(false);
      // Silently fail for periodic checks, don't spam console
    }
  };

  const handleIpChange = () => {
    // Reconnect with new IP
    checkConnection();
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
              />
            )}
          </>
        ) : (
          <div className="connection-error">
            <h2>Unable to Connect</h2>
            <p>Make sure you're connected to the ESP32 or check the IP address in settings</p>
            <button onClick={checkConnection}>Retry Connection</button>
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
