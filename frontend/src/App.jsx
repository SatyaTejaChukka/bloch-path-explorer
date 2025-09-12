import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css'; // Global dark theme
import CircuitEditor from './components/CircuitEditor';
import BlochSphere from './components/BlochSphere';
import MetricsPanel from './components/MetricsPanel';
import Controls from './components/Controls';

function App() {
  console.log('App component is rendering');
  const [activeTab, setActiveTab] = useState('Circuit Editor'); // State for active tab
  const [simulationTimeline, setSimulationTimeline] = useState(null); // Stores the full timeline from backend
  const [numQubits, setNumQubits] = useState(0); // Number of qubits from simulation

  // Playback controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [resetTrigger, setResetTrigger] = useState(false);

  // Ref for animation frame to control playback
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  // Derived state for current step's data
  const currentBlochSpheresData = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return [];
    return simulationTimeline[currentStep]?.bloch_spheres || [];
  }, [simulationTimeline, currentStep]);

  const currentMetrics = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return null;
    return simulationTimeline[currentStep]?.metrics || null;
  }, [simulationTimeline, currentStep]);

  const handleSimulationResults = (results) => {
    setSimulationTimeline(results.simulation_timeline);
    setNumQubits(results.num_qubits);
    setActiveTab('Bloch Spheres'); // Switch to Bloch Spheres tab after simulation
    setIsPlaying(false); // Pause animation after new simulation
    setCurrentStep(0); // Reset step
    setResetTrigger(true); // Trigger reset in BlochSphere
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const stepForward = () => {
    if (simulationTimeline && currentStep < simulationTimeline.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    setIsPlaying(false); // Pause after stepping
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setResetTrigger(true); // Trigger reset in BlochSphere
  };

  // Effect to reset resetTrigger after it's been used by BlochSphere
  useEffect(() => {
    if (resetTrigger) {
      const timer = setTimeout(() => setResetTrigger(false), 100); // Small delay to ensure BlochSphere picks it up
      return () => clearTimeout(timer);
    }
  }, [resetTrigger]);

  // Playback animation loop
  useEffect(() => {
    const animate = (time) => {
      if (!isPlaying || !simulationTimeline || simulationTimeline.length === 0) {
        animationFrameRef.current = null;
        return;
      }

      const deltaTime = time - lastUpdateTimeRef.current;
      // Advance step based on playback speed
      // Assuming each step takes 1 second at 1x speed
      const stepDuration = 1000 / playbackSpeed; 

      if (deltaTime >= stepDuration) {
        lastUpdateTimeRef.current = time;
        setCurrentStep((prevStep) => {
          const nextStep = prevStep + 1;
          if (nextStep < simulationTimeline.length) {
            return nextStep;
          } else {
            setIsPlaying(false); // Stop playing at the end
            return prevStep; // Stay at the last step
          }
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now(); // Initialize last update time
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, simulationTimeline, playbackSpeed]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">Bloch Explorer</div>
        <nav className="nav-tabs">
          <button 
            className={activeTab === 'Circuit Editor' ? 'active' : ''} 
            onClick={() => setActiveTab('Circuit Editor')}
          >
            Circuit Editor
          </button>
          <button 
            className={activeTab === 'Bloch Spheres' ? 'active' : ''} 
            onClick={() => setActiveTab('Bloch Spheres')}
          >
            Bloch Spheres
          </button>
          <button 
            className={activeTab === 'Metrics' ? 'active' : ''} 
            onClick={() => setActiveTab('Metrics')}
          >
            Metrics
          </button>
          {/* <button 
            className={activeTab === 'Docs' ? 'active' : ''} 
            onClick={() => setActiveTab('Docs')}
          >
            Docs
          </button> */}
        </nav>
        {/* Theme toggle can go here */}
      </header>

      <main className="app-main-content">
        {activeTab === 'Circuit Editor' && (
          <div className="tab-content">
            <CircuitEditor onSimulate={handleSimulationResults} />
          </div>
        )}
        {activeTab === 'Bloch Spheres' && (
          <div className="tab-content">
            {simulationTimeline && simulationTimeline.length > 0 ? (
              <>
                <Controls 
                  isPlaying={isPlaying}
                  togglePlayPause={togglePlayPause}
                  stepForward={stepForward}
                  resetSimulation={resetSimulation}
                  playbackSpeed={playbackSpeed}
                  setPlaybackSpeed={setPlaybackSpeed}
                  maxStep={simulationTimeline.length - 1}
                  currentStep={currentStep}
                />
                <div className="bloch-spheres-grid">
                  {currentBlochSpheresData.map((state) => (
                    <BlochSphere 
                      key={state.qubit} 
                      qubitState={state}
                      isPlaying={isPlaying}
                      currentStep={currentStep}
                      playbackSpeed={playbackSpeed}
                      resetTrigger={resetTrigger}
                      simulationTimeline={simulationTimeline} // Pass full timeline for trails
                    />
                  ))}
                </div>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>
                No simulation data. Please go to 'Circuit Editor' to run a simulation.
              </p>
            )}
          </div>
        )}
        {activeTab === 'Metrics' && (
          <div className="tab-content">
            {currentMetrics ? (
              <MetricsPanel metrics={currentMetrics} />
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>
                No metrics data. Please run a simulation first.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
