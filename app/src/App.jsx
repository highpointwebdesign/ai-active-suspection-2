import { useState, useEffect, useRef } from 'react';
import { getHealth, getConfig, calibrateMPU, updateConfigParam, getSensorData } from './api/esp32';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Tuning from './components/Tuning';
import Lights from './components/Lights';
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
        <h1>🏎️ Suspension Control</h1>
        <div className="header-controls">
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
          </div>
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
