// frontend/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import CircuitEditor from './components/CircuitEditor';
import BlochSphere from './components/BlochSphere';
import MetricsPanel from './components/MetricsPanel';
import Controls from './components/Controls';
import { simulateCircuitClient } from './services/quantumEngine';
import { getHealth } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('Circuit Editor');
  const [engineMode, setEngineMode] = useState('client'); // 'client' | 'backend'
  const [backendHealth, setBackendHealth] = useState('checking'); // 'online' | 'offline' | 'checking'

  // Default initial simulation (Bell State on 2 qubits) so the 3D visualizer has immediate data
  const initialSimulation = useMemo(() => {
    return simulateCircuitClient([
      { name: 'H', qubit: 0, time: 0 },
      { name: 'CNOT', qubit: 0, target: 1, time: 1 }
    ], 2);
  }, []);

  const [simulationTimeline, setSimulationTimeline] = useState(initialSimulation.simulation_timeline);
  const [numQubits, setNumQubits] = useState(2);

  // Playback controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopAnimation, setLoopAnimation] = useState(false);

  // Animation frame ref
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  // Check remote backend health on mount
  useEffect(() => {
    let isMounted = true;
    getHealth()
      .then((res) => {
        if (isMounted) {
          if (res.status === 'healthy') {
            setBackendHealth('online');
          } else {
            setBackendHealth('offline');
          }
        }
      })
      .catch(() => {
        if (isMounted) setBackendHealth('offline');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Expose step scrubber jumping
  useEffect(() => {
    window.__jumpToStep = (step) => {
      setIsPlaying(false);
      setCurrentStep(Math.max(0, Math.min(step, (simulationTimeline?.length || 1) - 1)));
    };
    return () => {
      delete window.__jumpToStep;
    };
  }, [simulationTimeline]);

  // Derived state for current step
  const currentSnapshot = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return null;
    return simulationTimeline[currentStep] || simulationTimeline[0];
  }, [simulationTimeline, currentStep]);

  const currentBlochSpheresData = useMemo(() => {
    return currentSnapshot?.bloch_spheres || [];
  }, [currentSnapshot]);

  const currentMetrics = useMemo(() => {
    return currentSnapshot?.metrics || null;
  }, [currentSnapshot]);

  const currentGateLabel = useMemo(() => {
    return currentSnapshot?.gateLabel || (currentStep === 0 ? 'Initial State |0...0⟩' : `Step ${currentStep}`);
  }, [currentSnapshot, currentStep]);

  const handleSimulationResults = (results) => {
    if (results.simulation_timeline && results.simulation_timeline.length > 0) {
      setSimulationTimeline(results.simulation_timeline);
      setNumQubits(results.num_qubits || 2);
      setCurrentStep(0);
      setIsPlaying(true); // Auto-play the evolution
      setActiveTab('Bloch Spheres');
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const stepForward = () => {
    if (simulationTimeline && currentStep < simulationTimeline.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    setIsPlaying(false);
  };

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
    setIsPlaying(false);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const jumpToEnd = () => {
    setIsPlaying(false);
    if (simulationTimeline) {
      setCurrentStep(simulationTimeline.length - 1);
    }
  };

  // Playback animation loop
  useEffect(() => {
    const animate = (time) => {
      if (!isPlaying || !simulationTimeline || simulationTimeline.length === 0) {
        animationFrameRef.current = null;
        return;
      }

      const deltaTime = time - lastUpdateTimeRef.current;
      const stepDuration = 1200 / playbackSpeed;

      if (deltaTime >= stepDuration) {
        lastUpdateTimeRef.current = time;
        setCurrentStep((prevStep) => {
          const nextStep = prevStep + 1;
          if (nextStep < simulationTimeline.length) {
            return nextStep;
          } else {
            if (loopAnimation) {
              return 0; // Loop back to start
            } else {
              setIsPlaying(false);
              return prevStep;
            }
          }
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, simulationTimeline, playbackSpeed, loopAnimation]);

  const toggleEngine = () => {
    setEngineMode((prev) => (prev === 'client' ? 'backend' : 'client'));
  };

  return (
    <div className="app-container">
      {/* Top Cyber Navigation Bar */}
      <header className="app-header">
        <div className="logo-group">
          <div className="logo-symbol">⚛</div>
          <div>
            <h1 className="logo-title">Bloch Path Explorer</h1>
            <span className="logo-subtitle">Interactive 3D Multi-Qubit Visualizer</span>
          </div>
        </div>

        {/* Navigation Tabs */}
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
            3D Bloch Spheres
            <span className="tab-qubit-badge">{numQubits}Q</span>
          </button>
          <button
            className={activeTab === 'Metrics' ? 'active' : ''}
            onClick={() => setActiveTab('Metrics')}
          >
            Quantum Metrics
          </button>
        </nav>

        {/* Engine Mode Status Switch */}
        <div className="header-status-area">
          <button
            className={`engine-badge-btn ${engineMode}`}
            onClick={toggleEngine}
            title={
              engineMode === 'client'
                ? 'Running with zero latency in browser engine. Click to switch to remote Qiskit API.'
                : 'Calling remote Qiskit backend. Click to switch to browser engine.'
            }
          >
            <span className={`status-dot ${engineMode === 'client' ? 'green' : (backendHealth === 'online' ? 'blue' : 'yellow')}`} />
            <span className="engine-text">
              {engineMode === 'client' ? 'Browser Engine' : `Qiskit API (${backendHealth})`}
            </span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="app-main-content">
        {activeTab === 'Circuit Editor' && (
          <div className="tab-pane">
            <CircuitEditor
              onSimulate={handleSimulationResults}
              engineMode={engineMode}
              onToggleEngine={toggleEngine}
            />
          </div>
        )}

        {activeTab === 'Bloch Spheres' && (
          <div className="tab-pane">
            {simulationTimeline && simulationTimeline.length > 0 ? (
              <>
                <Controls
                  isPlaying={isPlaying}
                  togglePlayPause={togglePlayPause}
                  stepForward={stepForward}
                  stepBackward={stepBackward}
                  resetSimulation={resetSimulation}
                  jumpToEnd={jumpToEnd}
                  playbackSpeed={playbackSpeed}
                  setPlaybackSpeed={setPlaybackSpeed}
                  maxStep={simulationTimeline.length - 1}
                  currentStep={currentStep}
                  currentGateLabel={currentGateLabel}
                  loopAnimation={loopAnimation}
                  toggleLoop={() => setLoopAnimation((prev) => !prev)}
                />

                <div className="bloch-spheres-grid">
                  {currentBlochSpheresData.map((state) => (
                    <BlochSphere
                      key={state.qubit}
                      qubitState={state}
                      currentStep={currentStep}
                      simulationTimeline={simulationTimeline}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state-notice">
                <p>No simulation data. Open the Circuit Editor to build and simulate a circuit.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Metrics' && (
          <div className="tab-pane">
            <MetricsPanel
              metrics={currentMetrics}
              blochSpheres={currentBlochSpheresData}
              currentStep={currentStep}
              currentGateLabel={currentGateLabel}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>Bloch Path Explorer • Quantum Statevector & Density Matrix Visualizer</span>
        <span className="footer-links">
          Powered by React 19, Three.js & Qiskit • 100% Free Web Deployment Ready
        </span>
      </footer>
    </div>
  );
}

export default App;
