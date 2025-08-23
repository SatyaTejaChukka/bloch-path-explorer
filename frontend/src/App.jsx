import React, { useState } from 'react';
import BlochSphere from './components/BlochSphere';
import CircuitEditor from './components/CircuitEditor';
import Controls from './components/Controls';
import MetricsPanel from './components/MetricsPanel';
import './App.css';

function App() {
  const [simulationResult, setSimulationResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSimulationResult = (result) => {
    setSimulationResult(result);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSimulationResult(null);
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bloch Path Explorer</h1>
      </header>
      
      <main className="app-main">
        <div className="visualization-section">
          <BlochSphere 
            simulationResult={simulationResult}
            isPlaying={isPlaying}
            currentStep={currentStep}
          />
        </div>
        
        <div className="control-section">
          <CircuitEditor 
            onSimulationResult={handleSimulationResult}
          />
          <Controls 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onStepChange={handleStepChange}
            currentStep={currentStep}
            totalSteps={simulationResult ? simulationResult.gates_applied || 0 : 0}
          />
          <MetricsPanel 
            simulationResult={simulationResult}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
