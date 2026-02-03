import { useState } from 'react';
import SensorGauge from './SensorGauge';
import BatteryDisplay from './BatteryDisplay';
import './Dashboard.css';

function Dashboard({ sensorData, batteryData, batteryConfig, config, onCalibrate, rolloverDetected }) {
  const [calibrating, setCalibrating] = useState(false);
  const [resettingGimbal, setResettingGimbal] = useState(false);
  const visibleBatteries = (batteryData || [])
    .map((voltage, index) => ({ voltage, index }))
    .filter(({ index }) => {
      if (!Array.isArray(batteryConfig)) return true;
      return !!batteryConfig[index]?.showOnDashboard;
    });

  const handleSetLevel = async () => {
    setCalibrating(true);
    try {
      await onCalibrate();
      setTimeout(() => setCalibrating(false), 2000);
    } catch (error) {
      console.error('Calibration failed:', error);
      setCalibrating(false);
    }
  };

  const handleGimbalReset = async () => {
    setResettingGimbal(true);
    try {
      // TODO: Add API call to reset gimbal
      console.log('Resetting gimbal...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResettingGimbal(false);
    } catch (error) {
      console.error('Gimbal reset failed:', error);
      setResettingGimbal(false);
    }
  };

  return (
    <div className="dashboard">
      {rolloverDetected && (
        <div className="rollover-alert">
          ⚠️ ROLLOVER DETECTED ⚠️
        </div>
      )}
      <div className="title-header">
        <h2>Dashboard</h2>
        <div className="header-buttons">
          <button 
            className={`set-level-btn ${calibrating ? 'calibrating' : ''}`}
            onClick={handleSetLevel}
            disabled={calibrating}
          >
            {calibrating ? 'Calibrating...' : 'Set as Level'}
          </button>
          <button 
            className={`set-level-btn ${resettingGimbal ? 'calibrating' : ''}`}
            onClick={handleGimbalReset}
            disabled={resettingGimbal}
          >
            {resettingGimbal ? 'Resetting...' : 'Reset Gimbal'}
          </button>
        </div>
      </div>

      <div className="telemetry-section">
        <h3>Telemetry</h3>
        <div className="sensor-grid">
          <SensorGauge
            label="Roll"
            value={sensorData?.roll || 0}
            unit="°"
            min={-90}
            max={90}
            warningThreshold={45}
          />
          <SensorGauge
            label="Pitch"
            value={sensorData?.pitch || 0}
            unit="°"
            min={-90}
            max={90}
            warningThreshold={45}
          />
        </div>
      </div>

      {batteryData && batteryData.length > 0 && visibleBatteries.length > 0 && (
        <div className="battery-section">
          <h3>Battery Status</h3>
          <div className="battery-grid">
            {visibleBatteries.map(({ voltage, index }) => (
                <BatteryDisplay
                  key={index}
                  label={batteryConfig?.[index]?.name || `Battery ${index + 1}`}
                  voltage={voltage}
                />
            ))}
          </div>
        </div>
      )}

      {config && (
        <div className="config-section">
          <h3>Current Settings</h3>
          <div className="config-grid">
            <div className="config-item">
              <span className="config-label">Reaction Speed</span>
              <span className="config-value">{config.reactionSpeed}%</span>
            </div>
            <div className="config-item">
              <span className="config-label">Damping</span>
              <span className="config-value">{config.damping}%</span>
            </div>
            <div className="config-item">
              <span className="config-label">Stiffness</span>
              <span className="config-value">{config.stiffness}%</span>
            </div>
            <div className="config-item">
              <span className="config-label">Front/Rear Balance</span>
              <span className="config-value">{config.frontRearBalance}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
