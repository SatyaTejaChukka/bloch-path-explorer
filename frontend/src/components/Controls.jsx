// frontend/src/components/Controls.jsx
import React from 'react';

function Controls({
  isPlaying,
  togglePlayPause,
  stepForward,
  stepBackward,
  resetSimulation,
  jumpToEnd,
  playbackSpeed,
  setPlaybackSpeed,
  currentStep,
  maxStep = 0,
  currentGateLabel = '',
  loopAnimation,
  toggleLoop
}) {
  const speeds = [0.5, 1, 1.5, 2];

  return (
    <div className="playback-controls-bar">
      {/* Step Info & Scrubber */}
      <div className="scrubber-section">
        <div className="scrubber-header">
          <span className="step-badge">
            Step <strong>{currentStep}</strong> / {maxStep}
          </span>
          <span className="gate-label-badge" title="Gate executed at this step">
            {currentGateLabel || (currentStep === 0 ? 'Initial State |0...0⟩' : `Step ${currentStep}`)}
          </span>
        </div>

        <input
          type="range"
          className="timeline-slider"
          min="0"
          max={maxStep}
          value={currentStep}
          onChange={(e) => {
            const step = parseInt(e.target.value, 10);
            if (resetSimulation && step === 0) {
              resetSimulation();
            } else if (stepForward) {
              // Custom jump if handler available
              window.__jumpToStep && window.__jumpToStep(step);
            }
          }}
        />
      </div>

      {/* Buttons & Speed Controls */}
      <div className="buttons-section">
        <div className="playback-btn-group">
          <button
            className="ctrl-btn icon-btn"
            onClick={resetSimulation}
            title="Reset to initial state (Step 0)"
          >
            ⏮
          </button>
          <button
            className="ctrl-btn icon-btn"
            onClick={stepBackward}
            disabled={currentStep <= 0}
            title="Previous step"
          >
            ◀
          </button>
          <button
            className={`ctrl-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="ctrl-btn icon-btn"
            onClick={stepForward}
            disabled={currentStep >= maxStep}
            title="Next step"
          >
            ▶
          </button>
          <button
            className="ctrl-btn icon-btn"
            onClick={jumpToEnd}
            title="Jump to final quantum state"
          >
            ⏭
          </button>
        </div>

        {/* Speed Controls */}
        <div className="speed-toggle-group">
          <span className="speed-label">Speed:</span>
          {speeds.map((spd) => (
            <button
              key={spd}
              className={`speed-pill ${playbackSpeed === spd ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(spd)}
            >
              {spd}x
            </button>
          ))}
          {toggleLoop && (
            <button
              className={`loop-toggle-btn ${loopAnimation ? 'active' : ''}`}
              onClick={toggleLoop}
              title="Toggle repeat animation loop"
            >
              🔁 Loop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Controls;
