import { useState, useEffect } from 'react';
import { subscribeToSensorData } from '../api/esp32';
import './BubbleLevel.css';

function BubbleLevel() {
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [isLevel, setIsLevel] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSensorData((data) => {
      setRoll(data.roll || 0);
      setPitch(data.pitch || 0);
      
      // Check if level (within ±5 degrees)
      const level = Math.abs(data.roll || 0) < 5 && Math.abs(data.pitch || 0) < 5;
      setIsLevel(level);
    });

    return () => unsubscribe();
  }, []);

  // Calculate bubble position
  // Roll moves bubble left/right, pitch moves bubble up/down
  // Scale factor: 1 degree = 3 pixels of movement
  // Add 8px offset to X to correct centering issue
  // Snap to center when within ±5° threshold (dead zone effect)
  const isWithinThreshold = Math.abs(roll) < 5 && Math.abs(pitch) < 5;
  const bubbleX = isWithinThreshold ? 8 : (roll * 3 + 8);
  const bubbleY = isWithinThreshold ? 0 : (pitch * 3);

  return (
    <div className="bubble-level-container">
      <div className="bubble-level-label">Chassis Level Indicator (±5°)</div>
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
            transform: `translate(calc(-50% + ${bubbleX}px), calc(-50% + ${bubbleY}px))`
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
