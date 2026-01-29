import './BatteryDisplay.css';

function BatteryDisplay({ label, voltage }) {
  // Typical LiPo battery: 3.0V (empty) to 4.2V (full)
  const minVoltage = 3.0;
  const maxVoltage = 4.2;
  const warningVoltage = 3.3;
  const criticalVoltage = 3.2;

  const percentage = Math.max(0, Math.min(100, 
    ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100
  ));

  const getStatus = () => {
    if (voltage < criticalVoltage) return 'critical';
    if (voltage < warningVoltage) return 'warning';
    return 'good';
  };

  const status = getStatus();

  return (
    <div className={`battery-display ${status}`}>
      <div className="battery-label">{label}</div>
      <div className="battery-voltage">{voltage.toFixed(2)}V</div>
      <div className="battery-bar-container">
        <div className="battery-bar-track">
          <div 
            className="battery-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      <div className="battery-percentage">{Math.round(percentage)}%</div>
    </div>
  );
}

export default BatteryDisplay;
