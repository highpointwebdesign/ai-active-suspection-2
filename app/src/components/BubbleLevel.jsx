import { useState, useEffect } from 'react';
import { getSensorData } from '../api/esp32';
import './BubbleLevel.css';

function BubbleLevel() {
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [isLevel, setIsLevel] = useState(false);

  useEffect(() => {
    let intervalId;

    const fetchSensorData = async () => {
      try {
        const data = await getSensorData();
        setRoll(data.roll || 0);
        setPitch(data.pitch || 0);
        
        // Check if level (within ±2 degrees)
        const level = Math.abs(data.roll || 0) < 2 && Math.abs(data.pitch || 0) < 2;
        setIsLevel(level);
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
      }
    };

    // Initial fetch
    fetchSensorData();

    // Poll every 500ms for smoother updates and reduced backend load
    intervalId = setInterval(fetchSensorData, 500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Calculate bubble position
  // Roll moves bubble left/right, pitch moves bubble up/down
  // Scale factor: 1 degree = 3 pixels of movement
  const bubbleX = roll * 3;
  const bubbleY = pitch * 3;

  return (
    <div className="bubble-level-container">
      <div className="bubble-level-label">Chassis Level Indicator</div>
      <div className={`bubble-level ${isLevel ? 'level' : ''}`}>
        {/* Crosshairs */}
        <div className="crosshair horizontal"></div>
        <div className="crosshair vertical"></div>
        {/* Center circle (target zone) */}
        <div className="center-circle"></div>
        {/* The bubble */}
        <div 
          className="bubble"
          style={{
            transform: `translate(${bubbleX}px, ${bubbleY}px)`
          }}
        ></div>
      </div>
      {isLevel && (
        <div className="level-indicator">✓ LEVEL</div>
      )}
    </div>
  );
}

export default BubbleLevel;
