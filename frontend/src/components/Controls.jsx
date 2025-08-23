import React, { useState, useEffect } from 'react';

const Controls = ({ 
  isPlaying, 
  onPlayPause, 
  onReset, 
  onStepChange, 
  currentStep, 
  totalSteps,
  simulationResult 
}) => {
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  const handleSpeedChange = (event) => {
    setAnimationSpeed(parseFloat(event.target.value));
  };

  const handleAxesToggle = () => {
    setShowAxes(!showAxes);
  };

  const handleGridToggle = () => {
    setShowGrid(!showGrid);
  };

  const handlePlayPause = () => {
    onPlayPause();
  };

  const handleReset = () => {
    onReset();
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepForward = () => {
    if (currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    }
  };

  const handleSliderChange = (event) => {
    const step = parseInt(event.target.value);
    onStepChange(step);
  };

  // Get current state information
  const getCurrentState = () => {
    if (!simulationResult || currentStep === 0) return '|0⟩';
    
    const { x, y, z } = simulationResult.bloch_coordinates;
    if (z > 0.9) return '|0⟩';
    if (z < -0.9) return '|1⟩';
    if (x > 0.9) return '|+⟩';
    if (x < -0.9) return '|-⟩';
    if (y > 0.9) return '|i⟩';
    if (y < -0.9) return '|-i⟩';
    
    return 'Mixed State';
  };

  return (
    <div className="controls">
      <h3>Animation Controls</h3>
      
      <div className="control-group">
        <label>
          Animation Speed:
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={animationSpeed}
            onChange={handleSpeedChange}
            className="speed-slider"
          />
          <span>{animationSpeed}x</span>
        </label>
      </div>

      <div className="control-group">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showAxes}
            onChange={handleAxesToggle}
          />
          Show Axes
        </label>
        
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={handleGridToggle}
          />
          Show Grid
        </label>
      </div>

      <div className="button-group">
        <button 
          onClick={handlePlayPause} 
          className={`control-button ${isPlaying ? 'pause-button' : 'play-button'}`}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={handleReset} className="control-button reset-button">
          ↺ Reset
        </button>
      </div>

      {totalSteps > 0 && (
        <div className="step-controls">
          <div className="step-buttons">
            <button onClick={handleStepBack} disabled={currentStep === 0}>
              ◀
            </button>
            <span>Step {currentStep}/{totalSteps}</span>
            <button onClick={handleStepForward} disabled={currentStep === totalSteps}>
              ▶
            </button>
          </div>
          
          <input
            type="range"
            min="0"
            max={totalSteps}
            value={currentStep}
            onChange={handleSliderChange}
            className="step-slider"
          />
        </div>
      )}

      <div className="status-info">
        <p>Current State: {getCurrentState()}</p>
        <p>Step: {currentStep}/{totalSteps}</p>
        {simulationResult && (
          <p>Fidelity: {simulationResult.success ? '1.0' : '0.0'}</p>
        )}
      </div>
    </div>
  );
};

export default Controls;
