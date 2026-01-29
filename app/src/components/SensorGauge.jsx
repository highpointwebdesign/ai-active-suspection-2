import { useMemo } from 'react';
import './SensorGauge.css';

function SensorGauge({ label, value, unit, min, max, warningThreshold, showWarning = true }) {
  const percentage = useMemo(() => {
    const range = max - min;
    const normalized = ((value - min) / range) * 100;
    return Math.max(0, Math.min(100, normalized));
  }, [value, min, max]);

  const isWarning = showWarning && warningThreshold && Math.abs(value) > warningThreshold;

  return (
    <div className={`sensor-gauge ${isWarning ? 'warning' : ''}`}>
      <div className="gauge-label">{label}</div>
      <div className="gauge-display">
        <div className="gauge-value">
          {value.toFixed(1)}
          <span className="gauge-unit">{unit}</span>
        </div>
        <div className="gauge-bar-container">
          <div className="gauge-bar-track">
            <div className="gauge-bar-center-line"></div>
            <div 
              className="gauge-bar-fill"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <div className="gauge-range">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

export default SensorGauge;
