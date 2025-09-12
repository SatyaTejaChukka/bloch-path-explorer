import React from 'react';

function Controls({ isPlaying, togglePlayPause, stepForward, resetSimulation, playbackSpeed, setPlaybackSpeed }) {
  return (
    <div className="controls-panel-container">
      <h3>Animation Controls</h3>
      <div className="playback-controls">
        <button className="control-button" onClick={togglePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="control-button" onClick={stepForward}>Step</button>
        <button className="control-button" onClick={resetSimulation}>Reset</button>
      </div>
      <div className="speed-control">
        <label htmlFor="playback-speed">Playback Speed:</label>
        <input 
          type="range" 
          id="playback-speed" 
          name="playback-speed" 
          min="0.1" 
          max="2" 
          step="0.1" 
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
        />
        <span>{playbackSpeed.toFixed(1)}x</span>
      </div>
    </div>
  );
}

export default Controls;
