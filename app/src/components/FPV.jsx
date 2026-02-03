import { useState, useEffect, useRef } from 'react';
import { getSensorData, setFpvAutoMode } from '../api/esp32';
import './FPV.css';

function FPV() {
  const [powerMode, setPowerMode] = useState(false);
  const [autoMode, setAutoMode] = useState(() => {
    // Load auto mode from localStorage on mount
    const saved = localStorage.getItem('fpv_auto_mode');
    return saved === 'true';
  });
  const [resetting, setResetting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  const movementTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Monitor gyro for movement when in auto mode
  useEffect(() => {
    if (!autoMode) {
      // Clear polling when auto mode is off
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (movementTimerRef.current) {
        clearTimeout(movementTimerRef.current);
        movementTimerRef.current = null;
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsMoving(false);
      return;
    }

    // Poll sensor data every 200ms when auto mode is active
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const data = await getSensorData();
        const roll = Math.abs(data.roll || 0);
        const pitch = Math.abs(data.pitch || 0);
        const accel = Math.abs(data.verticalAccel || 0);
        
        // Detect movement: significant roll, pitch, or acceleration
        const movementDetected = roll > 5 || pitch > 5 || accel > 0.2;
        
        if (movementDetected) {
          // Clear idle timer
          if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
          }
          
          // Start movement timer if not already moving
          if (!isMoving && !movementTimerRef.current) {
            movementTimerRef.current = setTimeout(() => {
              // After 1 second of continuous movement, enable power
              setIsMoving(true);
              setPowerMode(true);
              console.log('Auto: Movement detected - enabling full power');
              movementTimerRef.current = null;
            }, 1000);
          }
        } else {
          // Clear movement timer
          if (movementTimerRef.current) {
            clearTimeout(movementTimerRef.current);
            movementTimerRef.current = null;
          }
          
          // Start idle timer if currently moving
          if (isMoving && !idleTimerRef.current) {
            idleTimerRef.current = setTimeout(() => {
              // After 3 seconds of no movement, disable power
              setIsMoving(false);
              setPowerMode(false);
              console.log('Auto: Movement stopped - switching to standby');
              idleTimerRef.current = null;
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Failed to read sensor data:', error);
      }
    }, 200);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (movementTimerRef.current) {
        clearTimeout(movementTimerRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [autoMode, isMoving]);

  const handlePowerToggle = async () => {
    if (autoMode) return; // Prevent manual toggle when auto mode is on
    
    try {
      // TODO: Add API call to toggle FPV power mode
      setPowerMode(!powerMode);
      console.log(`FPV Power Mode: ${!powerMode ? 'ENABLED' : 'DISABLED'}`);
    } catch (error) {
      console.error('Failed to toggle power mode:', error);
    }
  };

  const handleAutoToggle = async () => {
    const newAutoMode = !autoMode;
    setAutoMode(newAutoMode);
    localStorage.setItem('fpv_auto_mode', newAutoMode.toString());
    try {
      await setFpvAutoMode(newAutoMode);
    } catch (error) {
      console.error('Failed to save FPV auto mode to ESP32:', error);
    }
    if (!newAutoMode) {
      setPowerMode(false);
      setIsMoving(false);
    }
  };

  const handleGimbalReset = async () => {
    setResetting(true);
    try {
      // TODO: Add API call to reset gimbal
      console.log('Resetting gimbal...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResetting(false);
    } catch (error) {
      console.error('Gimbal reset failed:', error);
      setResetting(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="title-header">
        <h2>FPV Control</h2>
      </div>
      
      <div className="fpv-section">
        <h3>FPV</h3>
        {/* Info moved to grouped info box below */}
        
        <div className="auto-mode-control">
          <div className="auto-mode-header">
            <span className="auto-mode-label">Auto Mode</span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoMode}
                onChange={handleAutoToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="auto-mode-description">
            {autoMode 
              ? 'Automatically enables full power when movement is detected'
              : 'Manual control of power mode'}
          </p>
        </div>
        
        <div className="power-control">
          <div className="power-status">
            <span className="status-label">Power Mode:</span>
            <span className={`status-value ${powerMode ? 'active' : 'idle'}`}>
              {powerMode ? 'FULL POWER' : 'STANDBY'}
            </span>
          </div>
          <button 
            className={`power-btn ${powerMode ? 'power-on' : 'power-off'}`}
            onClick={handlePowerToggle}
            disabled={autoMode}
          >
            {powerMode ? 'Disable Full Power' : 'Enable Full Power'}
          </button>
        </div>
      </div>

      <div className="fpv-section">
        <h3>Gimbal Control</h3>
        {/* Info moved to grouped info box below */}
        
        <button 
          className={`gimbal-reset-btn ${resetting ? 'resetting' : ''}`}
          onClick={handleGimbalReset}
          disabled={resetting}
        >
          {resetting ? 'Resetting Gimbal...' : 'Reset Gimbal'}
        </button>
      </div>
      <div className="info-box">
        <strong>Info:</strong><br />
        • Full power mode provides maximum video quality but generates more heat. Enable during driving, disable during idle to prevent overheating.<br />
        • Reset gimbal orientation to default position if the camera angle becomes misaligned.<br />
      </div>
    </div>
  );
}

export default FPV;
