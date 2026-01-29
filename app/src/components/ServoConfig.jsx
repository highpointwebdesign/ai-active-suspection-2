import { useState, useRef, useEffect, memo, useCallback } from 'react';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';
import './ServoConfig.css';
import { updateServoParam, calibrateMPU, getSensorData } from '../api/esp32';
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
    <div className="servo-column">
      <h3>{title}</h3>
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

function ServoConfig({ config, onUpdateConfig }) {
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

      <div className="servo-config-header">
        <h2>Servo Calibration</h2>
        <div className="header-buttons">
          <button 
            className={`set-level-btn ${calibrating ? 'calibrating' : ''}`}
            onClick={handleSetLevel}
            disabled={calibrating || autoLeveling}
          >
            {calibrating ? 'Calibrating...' : 'Set Level'}
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

      <div className="info-box">
        <strong>Calibration Tips:</strong><br />
        • <span style={{color: '#764ba2', fontWeight: 'bold'}}>Purple Handle (MAX)</span> - Maximum servo angle limit (safety constraint)<br />
        • <span style={{color: '#16c79a', fontWeight: 'bold'}}>Teal Handle (TRIM)</span> - Static leveling adjustment per corner<br />
        • <span style={{color: '#4a90e2', fontWeight: 'bold'}}>Blue Handle (MIN)</span> - Minimum servo angle limit (safety constraint)<br />        
        • This page is for ONE-TIME setup and static leveling<br />
        • For dynamic ride height during driving, use Suspension Tuning page<br />
        • Use Auto Level to automatically adjust trims<br />
        • Changes are saved automatically to the ESP32
      </div>
    </div>
  );
}

export default ServoConfig;
