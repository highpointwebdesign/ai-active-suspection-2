import { useState, useEffect } from 'react';
import './Tuning.css';

function Tuning({ config, onUpdateConfig }) {
  const [values, setValues] = useState({
    reactionSpeed: 1.0,
    rideHeightOffset: 90,
    rangeLimit: 60,
    damping: 0.8,
    frontRearBalance: 0.5,
    stiffness: 1.0
  });

  const [helpVisible, setHelpVisible] = useState({});

  useEffect(() => {
    if (config) {
      setValues(prev => ({
        reactionSpeed: config.reactionSpeed ?? prev.reactionSpeed,
        rideHeightOffset: config.rideHeightOffset ?? prev.rideHeightOffset,
        rangeLimit: config.rangeLimit ?? prev.rangeLimit,
        damping: config.damping ?? prev.damping,
        frontRearBalance: config.frontRearBalance ?? prev.frontRearBalance,
        stiffness: config.stiffness ?? prev.stiffness
      }));
    }
  }, [config]);

  const handleChange = (param, value) => {
    const numValue = parseFloat(value);
    setValues(prev => ({ ...prev, [param]: numValue }));
    
    // Auto-save on change
    if (onUpdateConfig) {
      onUpdateConfig(param, numValue);
    }
  };

  const toggleHelp = (param) => {
    setHelpVisible(prev => ({ ...prev, [param]: !prev[param] }));
  };

  const handleReset = async () => {
    if (window.confirm('Reset all settings to factory defaults?')) {
      const defaults = {
        reactionSpeed: 1.0,
        rideHeightOffset: 90,
        rangeLimit: 60,
        damping: 0.8,
        frontRearBalance: 0.5,
        stiffness: 1.0
      };
      setValues(defaults);
      
      if (onUpdateConfig) {
        Object.entries(defaults).forEach(([param, value]) => {
          onUpdateConfig(param, value);
        });
      }
    }
  };

  const formatValue = (param, value) => {
    const decimalParams = ['reactionSpeed', 'damping', 'frontRearBalance', 'stiffness'];
    return decimalParams.includes(param) ? value.toFixed(2) : value.toFixed(0);
  };

  const parameters = [
    {
      key: 'reactionSpeed',
      label: 'Reaction Speed',
      min: 0.1,
      max: 5,
      step: 0.1,
      help: 'Controls how quickly the suspension responds to changes. Higher = faster response, but may cause oscillations.'
    },
    {
      key: 'rideHeightOffset',
      label: 'Ride Height',
      min: 30,
      max: 150,
      step: 1,
      help: 'Sets the neutral servo position (90° = center). Adjust to change overall vehicle height.'
    },
    {
      key: 'rangeLimit',
      label: 'Travel Range',
      min: 10,
      max: 90,
      step: 1,
      help: 'Maximum suspension travel in degrees (±). Limits how far servos can move from center position.'
    },
    {
      key: 'damping',
      label: 'Damping',
      min: 0.1,
      max: 2,
      step: 0.1,
      help: 'Reduces oscillations and smooths suspension motion. Higher = more damping, softer response.'
    },
    {
      key: 'frontRearBalance',
      label: 'Front/Rear Balance',
      min: 0,
      max: 1,
      step: 0.05,
      help: 'Distributes correction force between front and rear. 0=rear-biased, 1=front-biased, 0.5=balanced.'
    },
    {
      key: 'stiffness',
      label: 'Stiffness',
      min: 0.5,
      max: 3,
      step: 0.1,
      help: 'Overall suspension firmness. Higher = stiffer, more responsive. Lower = softer, more forgiving.'
    }
  ];

  return (
    <div className="tuning-page">
      <h2>🔧 Suspension Tuning</h2>
      
      <div className="tuning-controls">
        {parameters.map(param => (
          <div key={param.key} className="tuning-slider">
            <label>
              {param.label}
              <span className="help-icon" onClick={() => toggleHelp(param.key)}>?</span>
            </label>
            <div className="slider-container">
              <input 
                type="range" 
                min={param.min}
                max={param.max}
                step={param.step}
                value={values[param.key]}
                onInput={(e) => setValues(prev => ({ ...prev, [param.key]: parseFloat(e.target.value) }))}
                onMouseUp={(e) => handleChange(param.key, e.target.value)}
                onTouchEnd={(e) => handleChange(param.key, e.target.value)}
              />
              <span className="slider-value">{formatValue(param.key, values[param.key])}</span>
            </div>
            {helpVisible[param.key] && (
              <div className="help-text">{param.help}</div>
            )}
          </div>
        ))}
      </div>

      <button className="btn-reset" onClick={handleReset}>
        Reset to Defaults
      </button>

      <div className="info-box">
        <strong>Info:</strong><br />
        • Adjustments save automatically when slider is released<br />
        • Changes apply in real-time to suspension<br />
        • Click ? icons for parameter help
      </div>
    </div>
  );
}

export default Tuning;
