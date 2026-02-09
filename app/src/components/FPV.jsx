import { useState, useEffect, useRef } from 'react';
import { subscribeToSensorData, setFpvAutoMode } from '../api/esp32';
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
  const [helpVisible, setHelpVisible] = useState({});
  
  const movementTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // Monitor gyro for movement when in auto mode via WebSocket
  useEffect(() => {
    if (!autoMode) {
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

    // Subscribe to WebSocket sensor data
    const unsubscribe = subscribeToSensorData((data) => {
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
    });

    return () => {
      unsubscribe();
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
    // TODO: When I toggle the switch to on/checked, the Power Mode label automatically changes to full power. 
    // That behavior is incorrect. The FULL POWER should only be in effect when the system detects movement 
    // for more than 3 seconds. We will need an API call made to the firmware to check for a flag.
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

  const toggleHelp = (param) => {
    setHelpVisible(prev => ({ ...prev, [param]: !prev[param] }));
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
            <div className="auto-mode-label-wrapper">
              <span className="auto-mode-label">Auto Mode</span>
              <span className="help-icon" onClick={() => toggleHelp('autoMode')}>?</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoMode}
                onChange={handleAutoToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {helpVisible.autoMode && (
            <div className="help-text">Automatically activates full power when movement is detected for optimal video quality. Power returns to low mode after 3 seconds of inactivity to prevent overheating. Not recommended when line-of-sight is obstructed.</div>
          )}
        </div>
        
        <div className="power-control">
          <div className="power-status">
            <span className="status-label">Power Mode:</span>
            <span className={`status-value ${powerMode ? 'active' : 'idle'}`}>
              {powerMode ? 'FULL POWER' : 'LOW POWER'}
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
      {/* <div className="info-box">
        <strong>Info:</strong><br />
        • Full power mode provides maximum video quality but generates more heat. Enable during driving, disable during idle to prevent overheating.<br />
        • Reset gimbal orientation to default position if the camera angle becomes misaligned.<br />
      </div> */}
    </div>
  );
}

export default FPV;
