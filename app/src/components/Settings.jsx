import { useState, useEffect } from 'react';
import { getEsp32Ip, setEsp32Ip, getWebSocketStatus } from '../api/esp32';
import './Settings.css';

function Settings({ onClose, onIpChange }) {
  const [ip, setIp] = useState(getEsp32Ip());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [wsStatus, setWsStatus] = useState(getWebSocketStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setWsStatus(getWebSocketStatus());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    setEsp32Ip(ip);
    if (onIpChange) onIpChange(ip);
    onClose();
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    // Save IP temporarily to test WebSocket connection
    const oldIp = getEsp32Ip();
    setEsp32Ip(ip);
    
    try {
      // Wait for WebSocket to connect with new IP
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        const checkInterval = setInterval(() => {
          const status = getWebSocketStatus();
          if (status.connected) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }
        }, 200);
      });
      
      setTestResult({ success: true, message: 'WebSocket connected!' });
    } catch (error) {
      setEsp32Ip(oldIp); // Restore old IP on failure
      setTestResult({ success: false, message: `Error: ${error.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg> Network Settings</h2>
        
        <div className="setting-group">
          <label>ESP32 IP Address</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.4.1"
          />
          <div className="setting-help">
            <strong>AP Mode:</strong> 192.168.4.1<br/>
            <strong>Home Network:</strong> Check serial monitor for IP<br/>
            <strong>WebSocket:</strong> <span style={{color: wsStatus.connected ? '#16c79a' : '#888'}}>{wsStatus.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <button 
          onClick={testConnection} 
          disabled={testing}
          className="test-button"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.message}
          </div>
        )}

        <div className="settings-actions">
          <button onClick={handleSave} className="primary">Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
