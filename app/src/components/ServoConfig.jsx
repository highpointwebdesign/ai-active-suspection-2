import { useState, useRef, useEffect, memo, useCallback } from 'react';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';
import './ServoConfig.css';
import '../styles.css';
import { updateServoParam, calibrateMPU, getSensorData, updateBatteryParam } from '../api/esp32';
import BubbleLevel from './BubbleLevel';

const ServoColumn = memo(({ title, servoKey, servo, onReverse, onReset }) => {
  const sliderRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Create slider only once on mount
  useEffect(() => {
    if (sliderRef.current && !isInitializedRef.current) {
      const minVal = servo.min - 90;
      const maxVal = servo.max - 90;
      const trimVal = servo.trim;

      noUiSlider.create(sliderRef.current, {
        start: [minVal, trimVal, maxVal],
        orientation: 'vertical',
        direction: 'rtl',
        range: { min: -90, max: 90 },
        step: 1,
        connect: true,
        pips: {
          mode: 'steps',
          stepped: true,
          density: 5,
          filter: (value) => value % 10 === 0 ? 1 : 0
        }
      });

      sliderRef.current.noUiSlider.on('end', async (values) => {
        const min = Math.round(values[0]) + 90; // Convert back to 0-180
        const trim = Math.round(values[1]);
        const max = Math.round(values[2]) + 90;
        
        await updateServoParam(servoKey, 'min', min);
        await updateServoParam(servoKey, 'trim', trim);
        await updateServoParam(servoKey, 'max', max);
      });

      isInitializedRef.current = true;
    }

    return () => {
      if (sliderRef.current?.noUiSlider) {
        sliderRef.current.noUiSlider.destroy();
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Update slider values when servo config changes
  useEffect(() => {
    if (sliderRef.current?.noUiSlider && isInitializedRef.current) {
      const minVal = servo.min - 90;
      const maxVal = servo.max - 90;
      const trimVal = servo.trim;
      
      sliderRef.current.noUiSlider.set([minVal, trimVal, maxVal], false);
    }
  }, [servo.min, servo.max, servo.trim, servoKey]);

  return (
    <div className="dashboard">
      <div className="title-header">
        <h2>Settings</h2>
      </div>
      
      <div className="sliders-container">
        <div className="slider-wrapper-combined">
          <div ref={sliderRef} className="nouislider-combined"></div>
          <div className="slider-value">{servo.trim}°</div>
        </div>
      </div>
      <div className="reverse-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={servo.reversed}
            onChange={() => onReverse(servoKey)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span>Reverse</span>
      </div>
      <button className="btn-reset-servo" onClick={() => onReset(servoKey)}>
        Reset
      </button>
    </div>
  );
});

ServoColumn.displayName = 'ServoColumn';

function ServoConfig({ config, onUpdateConfig, onBatteryConfigChange, batteryConfig: batteryConfigProp }) {
  // Collapsible section state, collapsed by default, persisted in localStorage
  const getSectionState = (key, def) => {
    if (typeof window === 'undefined') return def;
    const v = localStorage.getItem(key);
    return v === null ? def : v === 'true';
  };
  const [showServo, setShowServo] = useState(() => getSectionState('showServo', false));
  const [showBattery, setShowBattery] = useState(() => getSectionState('showBattery', false));
  const [showMPU, setShowMPU] = useState(() => getSectionState('showMPU', false));

  // Persist section state to localStorage
  const toggleSection = (key, setter, value) => {
    setter(value);
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  };
  // Battery config state
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
  const [batteryError, setBatteryError] = useState('');

  // Sync battery config from App
  useEffect(() => {
    if (batteryConfigProp) {
      const normalized = normalizeBatteryConfig(batteryConfigProp);
      setBatteryConfig(normalized);
    }
  }, [batteryConfigProp]);

  // Update handler for battery config
  const updateBatteryParamLocal = (num, param, value) => {
    setBatteryConfig(prev => {
      const safePrev = Array.isArray(prev) ? prev : defaultBatteryConfig;
      const updated = [...safePrev];
      updated[num - 1] = { ...updated[num - 1], [param]: value };
      if (onBatteryConfigChange) onBatteryConfigChange(updated);
      return updated;
    });
    updateBatteryParam(num, param, value).catch(() => setBatteryError('Failed to update battery config'));
  };
  const [servos, setServos] = useState({
    frontLeft: { min: 30, max: 150, trim: 0, reversed: false },
    frontRight: { min: 30, max: 150, trim: 0, reversed: false },
    rearLeft: { min: 30, max: 150, trim: 0, reversed: false },
    rearRight: { min: 30, max: 150, trim: 0, reversed: false }
  });
  const configLoadedRef = useRef(false);

  // Initialize from config when it loads
  useEffect(() => {
    if (config?.servos && !configLoadedRef.current) {
      setServos({
        frontLeft: {
          min: config.servos.frontLeft?.min ?? 30,
          max: config.servos.frontLeft?.max ?? 150,
          trim: config.servos.frontLeft?.trim ?? 0,
          reversed: config.servos.frontLeft?.reversed ?? false
        },
        frontRight: {
          min: config.servos.frontRight?.min ?? 30,
          max: config.servos.frontRight?.max ?? 150,
          trim: config.servos.frontRight?.trim ?? 0,
          reversed: config.servos.frontRight?.reversed ?? false
        },
        rearLeft: {
          min: config.servos.rearLeft?.min ?? 30,
          max: config.servos.rearLeft?.max ?? 150,
          trim: config.servos.rearLeft?.trim ?? 0,
          reversed: config.servos.rearLeft?.reversed ?? false
        },
        rearRight: {
          min: config.servos.rearRight?.min ?? 30,
          max: config.servos.rearRight?.max ?? 150,
          trim: config.servos.rearRight?.trim ?? 0,
          reversed: config.servos.rearRight?.reversed ?? false
        }
      });
      configLoadedRef.current = true;
    }
  }, [config]);

  const handleSliderChange = (servo, type, value) => {
    setServos(prev => ({
      ...prev,
      [servo]: { ...prev[servo], [type]: parseInt(value) }
    }));
  };

  const handleSliderSave = (servo, type, value) => {
    // Save to ESP32
    if (onUpdateConfig) {
      onUpdateConfig(`servo_${servo}_${type}`, parseInt(value));
    }
  };

  const handleReverse = useCallback(async (servo) => {
    setServos(prev => {
      const newReversed = !prev[servo].reversed;
      updateServoParam(servo, 'reversed', newReversed);
      return {
        ...prev,
        [servo]: { ...prev[servo], reversed: newReversed }
      };
    });
  }, []);

  const resetServo = useCallback((servo) => {
    setServos(prev => ({
      ...prev,
      [servo]: { min: 30, max: 150, trim: 0, reversed: false }
    }));
  }, []);

  const resetAll = () => {
    setServos({
      frontLeft: { min: 30, max: 150, trim: 0, reversed: false },
      frontRight: { min: 30, max: 150, trim: 0, reversed: false },
      rearLeft: { min: 30, max: 150, trim: 0, reversed: false },
      rearRight: { min: 30, max: 150, trim: 0, reversed: false }
    });
  };

  // Only individual mode is supported now
  const [calibrating, setCalibrating] = useState(false);
  const [autoLeveling, setAutoLeveling] = useState(false);
  const [levelingStatus, setLevelingStatus] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleSetLevel = async () => {
    setCalibrating(true);
    try {
      await calibrateMPU();
      setTimeout(() => setCalibrating(false), 2000);
    } catch (error) {
      console.error('Calibration failed:', error);
      setCalibrating(false);
    }
  };

  const handleAutoLevel = async () => {
    setAutoLeveling(true);
    setLevelingStatus('Detecting servo directions...');
    
    const MAX_ADJUSTMENT = 20;
    const LEVEL_TOLERANCE = 1.5; // degrees
    const ADJUSTMENT_STEP = 2; // degrees per iteration
    const MAX_ITERATIONS = 15;
    const TEST_MOVEMENT = 10; // degrees for reverse detection
    
    try {
      // Step 1: Auto-detect reverse settings
      const servoTests = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'];
      const detectedReversed = {};
      
      for (const servoKey of servoTests) {
        setLevelingStatus(`Testing ${servoKey}...`);
        
        // Record initial position and orientation
        const initialTrim = servos[servoKey].trim;
        const initialSensor = await getSensorData();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Move servo up (positive direction)
        await updateServoParam(servoKey, 'trim', initialTrim + TEST_MOVEMENT);
        setServos(prev => ({
          ...prev,
          [servoKey]: { ...prev[servoKey], trim: initialTrim + TEST_MOVEMENT }
        }));
        
        // Wait for movement to settle
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Read new orientation
        const testSensor = await getSensorData();
        
        // Calculate which corner should have moved up
        // Positive trim should raise that corner
        let expectedChange = 0;
        let actualChange = 0;
        
        if (servoKey === 'frontLeft') {
          // FL up should: increase roll (left side up), decrease pitch (nose down)
          expectedChange = 1; // Should go positive
          actualChange = (testSensor.roll - initialSensor.roll) - (testSensor.pitch - initialSensor.pitch);
        } else if (servoKey === 'frontRight') {
          // FR up should: decrease roll (right side up), decrease pitch (nose down)
          expectedChange = -1; // Should go negative
          actualChange = -(testSensor.roll - initialSensor.roll) - (testSensor.pitch - initialSensor.pitch);
        } else if (servoKey === 'rearLeft') {
          // RL up should: increase roll (left side up), increase pitch (nose up)
          expectedChange = 1; // Should go positive
          actualChange = (testSensor.roll - initialSensor.roll) + (testSensor.pitch - initialSensor.pitch);
        } else if (servoKey === 'rearRight') {
          // RR up should: decrease roll (right side up), increase pitch (nose up)
          expectedChange = -1; // Should go negative
          actualChange = -(testSensor.roll - initialSensor.roll) + (testSensor.pitch - initialSensor.pitch);
        }
        
        // If actual movement is opposite to expected, servo is reversed
        const isReversed = (expectedChange * actualChange) < -1; // Threshold to account for noise
        detectedReversed[servoKey] = isReversed;
        
        // Return to original position
        await updateServoParam(servoKey, 'trim', initialTrim);
        setServos(prev => ({
          ...prev,
          [servoKey]: { ...prev[servoKey], trim: initialTrim }
        }));
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Apply detected reverse settings
      setLevelingStatus('Applying reverse settings...');
      for (const [servoKey, isReversed] of Object.entries(detectedReversed)) {
        if (servos[servoKey].reversed !== isReversed) {
          await updateServoParam(servoKey, 'reversed', isReversed);
          setServos(prev => ({
            ...prev,
            [servoKey]: { ...prev[servoKey], reversed: isReversed }
          }));
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Proceed with auto-leveling
      setLevelingStatus('Starting auto-level...');
      let iteration = 0;
      
      while (iteration < MAX_ITERATIONS) {
        // Read current orientation
        const sensorData = await getSensorData();
        const roll = sensorData.roll || 0;
        const pitch = sensorData.pitch || 0;
        
        // Check if level
        if (Math.abs(roll) < LEVEL_TOLERANCE && Math.abs(pitch) < LEVEL_TOLERANCE) {
          setLevelingStatus('Level achieved!');
          setTimeout(() => {
            setAutoLeveling(false);
            setLevelingStatus('');
          }, 2000);
          return;
        }
        
        setLevelingStatus(`Adjusting... (${iteration + 1}/${MAX_ITERATIONS})`);
        
        // Calculate adjustments based on tilt
        // Roll: positive = tilting right, need to raise left side
        // Pitch: positive = nose up, need to lower front
        
        const rollAdjustment = Math.min(Math.abs(roll), ADJUSTMENT_STEP) * Math.sign(roll);
        const pitchAdjustment = Math.min(Math.abs(pitch), ADJUSTMENT_STEP) * Math.sign(pitch);
        
        // Apply adjustments to each servo's trim
        const adjustments = {
          frontLeft: rollAdjustment - pitchAdjustment,
          frontRight: -rollAdjustment - pitchAdjustment,
          rearLeft: rollAdjustment + pitchAdjustment,
          rearRight: -rollAdjustment + pitchAdjustment
        };
        
        // Apply adjustments with limits
        for (const [servoKey, adjustment] of Object.entries(adjustments)) {
          const currentTrim = servos[servoKey].trim;
          const newTrim = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, currentTrim + adjustment));
          
          if (newTrim !== currentTrim) {
            await updateServoParam(servoKey, 'trim', Math.round(newTrim));
            
            // Update local state
            setServos(prev => ({
              ...prev,
              [servoKey]: { ...prev[servoKey], trim: Math.round(newTrim) }
            }));
          }
        }
        
        // Wait for servos to move and settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        iteration++;
      }
      
      // Max iterations reached
      setLevelingStatus('Max iterations reached');
      setAlertMessage('Auto level failed - the vehicle is too unlevel for auto level to correct');
      setShowAlert(true);
      setTimeout(() => {
        setAutoLeveling(false);
        setLevelingStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Auto-leveling failed:', error);
      setLevelingStatus('Error occurred');
      setTimeout(() => {
        setAutoLeveling(false);
        setLevelingStatus('');
      }, 2000);
    }
  };

  return (
    <div className="servo-config-page">
      {/* Alert Message */}
      {showAlert && (
        <div className="alert-banner">
          <div className="alert-content">
            {/* <span className="alert-icon">⚠️</span> */}
            <span className="alert-text">{alertMessage}</span>
            <button className="alert-close" onClick={() => setShowAlert(false)}>✕</button>
          </div>
        </div>
      )}

      <div className="title-header">
        <h2>Settings</h2>
        <div className="header-buttons">
          <button 
            className={`set-level-btn ${calibrating ? 'calibrating' : ''}`}
            onClick={handleSetLevel}
            disabled={calibrating || autoLeveling}
          >
            {calibrating ? 'Calibrating...' : 'Set as Level'}
          </button>
          <button 
            className={`auto-level-btn ${autoLeveling ? 'active' : ''}`}
            onClick={handleAutoLevel}
            disabled={calibrating || autoLeveling}
          >
            {autoLeveling ? levelingStatus : 'Auto Level'}
          </button>
        </div>
      </div>

      <div className="dashboard" style={{paddingTop: '0px'}}>
        
        {/* Section Placeholders */}
        <div className="servo-section-placeholder">
          <h3 style={{textAlign:'left', cursor:'pointer', userSelect:'none', display:'flex', alignItems:'center'}} onClick={() => toggleSection('showServo', setShowServo, !showServo)}>
            <span style={{ fontWeight: 600, marginRight: 8 }}>{showServo ? '−' : '+'}</span> Servo Configuration
          </h3>
          {showServo && (
            <div className="section-content">
              {/* Bubble Level Indicator */}
              <BubbleLevel />
              {/* Individual Mode - Four Sliders Only */}
              <div className="servo-grid">
                <ServoColumn key="frontLeft" title="Front Left" servoKey="frontLeft" servo={servos.frontLeft} onReverse={handleReverse} onReset={resetServo} />
                <ServoColumn key="frontRight" title="Front Right" servoKey="frontRight" servo={servos.frontRight} onReverse={handleReverse} onReset={resetServo} />
                <ServoColumn key="rearLeft" title="Rear Left" servoKey="rearLeft" servo={servos.rearLeft} onReverse={handleReverse} onReset={resetServo} />
                <ServoColumn key="rearRight" title="Rear Right" servoKey="rearRight" servo={servos.rearRight} onReverse={handleReverse} onReset={resetServo} />
              </div>
              <button className="btn-reset-all" onClick={resetAll}>
                Reset All Servos to Defaults
              </button>
              <div className="info-box" style={{ marginTop: 16 }}>
                <strong>Servo Tips:</strong><br />
                • <span style={{color: '#764ba2', fontWeight: 'bold'}}>Purple Handle (MAX)</span> - Maximum servo angle limit (safety constraint)<br />
                • <span style={{color: '#16c79a', fontWeight: 'bold'}}>Teal Handle (TRIM)</span> - Static leveling adjustment per corner<br />
                • <span style={{color: '#4a90e2', fontWeight: 'bold'}}>Blue Handle (MIN)</span> - Minimum servo angle limit (safety constraint)<br />        
                • This page is for ONE-TIME setup and static leveling<br />
                • For dynamic ride height during driving, use Suspension Tuning page<br />
                • Use Auto Level to automatically adjust trims<br />
                • Changes are saved automatically to the ESP32
              </div>
            </div>
          )}
        </div>
        <div className="servo-section-placeholder">
          <h3 style={{textAlign:'left', cursor:'pointer', userSelect:'none', display:'flex', alignItems:'center'}} onClick={() => toggleSection('showMPU', setShowMPU, !showMPU)}>
            <span style={{ fontWeight: 600, marginRight: 8 }}>{showMPU ? '−' : '+'}</span> Gyro Orientation
          </h3>
          {showMPU && (
            <>
              <div className="section-content">

                <div style={{   background: 'linear-gradient(135deg, rgba(15, 52, 96, 0.6) 0%, rgba(10, 14, 39, 0.8) 100%)',
  border: '1px solid #4a90e2',  borderRadius: '12px',  padding: '.5rem',  margin:'.5rem .5rem 1rem .5rem' }}>               

                <form onSubmit={e => e.preventDefault()} style={{ textAlign: 'left' }}>
                  <h3 htmlFor="mpuOrientation" style={{ fontWeight: 600, display: 'block'  }}>
                    Physical Mounting
                  </h3>
                  <select
                    id="mpuOrientation"
                    className="orientation-select"
                    value={config?.mpuOrientation ?? 0}
                    onChange={e => onUpdateConfig('mpuOrientation', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #16c79a', backgroundColor: '#0f3460',
    color: '#16c79a' }}
                  >
                    <option value={0}>Arrow Forward, Chip Up (Default)</option>
                    <option value={1}>Arrow Up, Chip Forward</option>
                    <option value={2}>Arrow Backward, Chip Up</option>
                    <option value={3}>Arrow Down, Chip Forward</option>
                    <option value={4}>Arrow Right, Chip Up</option>
                    <option value={5}>Arrow Left, Chip Up</option>
                  </select>
                  {/* <div className="info-box" style={{ marginTop: 16, background: 'rgba(22, 199, 154, 0.07)' }}>
                    <strong>Orientation Guide:</strong><br />
                  </div> */}
                </form>
              <div className="info-box" style={{ marginTop: 16 }}>
                <strong>Calibration Tips:</strong><br />
                • Select how your MPU6050 sensor is physically mounted. The arrow is printed on the chip. Correct orientation is critical for accurate roll/pitch readings. This is a one-time setup based on your installation.
              </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="servo-section-placeholder">
          <h3 style={{cursor:'pointer', userSelect:'none', display:'flex', alignItems:'center'}} onClick={() => toggleSection('showBattery', setShowBattery, !showBattery)}>
            <span style={{ fontWeight: 600, marginRight: 8 }}>{showBattery ? '−' : '+'}</span> Batteries
          </h3>
          {showBattery && (
            <div className="section-content">
              {[1, 2, 3].map((num) => (
                <div key={num} style={{   background: 'linear-gradient(135deg, rgba(15, 52, 96, 0.6) 0%, rgba(10, 14, 39, 0.8) 100%)',
  border: '1px solid #4a90e2',  borderRadius: '12px',   padding: '.5rem',  margin:'.5rem .5rem 1rem .5rem'  }}>
                  <h3 style={{ textAlign: 'left' }}>Battery {num}</h3>  
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, textAlign: 'left' }}>Name</label>
                    <input
                      type="text"
                      placeholder={num === 1 ? 'e.g., Main Drive' : num === 2 ? 'e.g., FPV System' : 'e.g., Lights & Accessories'}
                      style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14,    backgroundColor: '#0f3460',
    color: '#16c79a' }}
                      value={batteryConfig?.[num - 1]?.name || ''}
                      onChange={e => updateBatteryParamLocal(num, 'name', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, textAlign:'left' }}>Cell Count</label>
                      <select
                        className="orientation-select"
                        style={{width: '100%', padding: 8, border: '1px solid rgb(221, 221, 221)', borderRadius: 4, fontSize: 14,     backgroundColor: '#0f3460',
    color: '#16c79a'}}
                        value={batteryConfig?.[num - 1]?.cellCount || 3}
                        onChange={e => updateBatteryParamLocal(num, 'cellCount', parseInt(e.target.value))}
                      >
                        <option value={1}>1S (3.7V)</option>
                        <option value={2}>2S (7.4V)</option>
                        <option value={3}>3S (11.1V)</option>
                        <option value={4}>4S (14.8V)</option>
                        <option value={5}>5S (18.5V)</option>
                        <option value={6}>6S (22.2V)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, textAlign:'left' }}>Cable</label>
                      <select
                        className="orientation-select"
                        style={{width: '100%', padding: 8, border: '1px solid rgb(221, 221, 221)', borderRadius: 4, fontSize: 14,     backgroundColor: '#0f3460',
    color: '#16c79a'}}
                        value={batteryConfig?.[num - 1]?.plugAssignment || 0}
                        onChange={e => updateBatteryParamLocal(num, 'plugAssignment', parseInt(e.target.value))}
                      >
                        <option value={0}>None</option>
                        <option value={1}>Plug A</option>
                        <option value={2}>Plug B</option>
                        <option value={3}>Plug C</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!!batteryConfig?.[num - 1]?.showOnDashboard}
                        onChange={e => updateBatteryParamLocal(num, 'showOnDashboard', e.target.checked ? 1 : 0)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: 14}}>Show on Dashboard</span>
                  </div>
                </div>
              ))}

              <div className="info-box" style={{  padding: '.5rem',  margin:'.5rem .5rem 1rem .5rem'  }}>
                <strong>Battery Info:</strong><br />
                Important:<br />
                • Requires voltage divider circuits on GPIO pins (8:1 ratio recommended)<br />
                • Each plug can only be assigned to one battery<br />
                • Dashboard will only show batteries with "Show on Dashboard" enabled<br />
                • Plug A = GPIO 34, Plug B = GPIO 35, Plug C = GPIO 32 (ADC pins)
              </div>
            </div>
          )}
        </div>

        {/* Calibration Tips info-box moved above */}
      </div>
    </div>
  );
}

export default ServoConfig;
