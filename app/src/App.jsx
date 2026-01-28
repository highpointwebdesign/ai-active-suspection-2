import { useState, useEffect } from 'react';
import { getHealth, getConfig, getBatteryData } from './api/esp32';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState(null);
  const [batteries, setBatteries] = useState([]);

  useEffect(() => {
    // Test connection on mount
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const health = await getHealth();
      setConnected(health.status === 'ok');
      
      // Load initial data
      const configData = await getConfig();
      setConfig(configData);
    } catch (error) {
      setConnected(false);
      console.error('Connection failed:', error);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>🏎️ Suspension Control</h1>
        <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '✓ Connected' : '✗ Disconnected'}
        </div>
      </header>

      <main>
        {connected ? (
          <div className="dashboard">
            <h2>Dashboard</h2>
            <p>ESP32 connected and ready</p>
            {config && (
              <div className="config-preview">
                <h3>Current Configuration</h3>
                <pre>{JSON.stringify(config, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="connection-error">
            <h2>Unable to Connect</h2>
            <p>Make sure you're connected to ESP32-Suspension WiFi network</p>
            <button onClick={checkConnection}>Retry Connection</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
