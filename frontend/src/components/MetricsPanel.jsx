import React, { useEffect, useState } from 'react';

const MetricsPanel = ({ simulationResult }) => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (simulationResult) {
      // Extract metrics from the simulation result
      const { bloch_coordinates, statevector, gates_applied } = simulationResult;
      setMetrics({
        fidelity: 1.0, // Placeholder, calculate based on statevector
        distance: Math.sqrt(bloch_coordinates.x ** 2 + bloch_coordinates.y ** 2 + bloch_coordinates.z ** 2),
        duration: 150, // Placeholder for duration
        gatesApplied: gates_applied,
        qubitCount: 1, // Assuming single qubit for now
        errorRate: 0.02 // Placeholder for error rate
      });
    }
  }, [simulationResult]);

  const getFidelityColor = (fidelity) => {
    if (fidelity >= 0.9) return '#4caf50';
    if (fidelity >= 0.7) return '#ff9800';
    return '#f44336';
  };

  const getErrorRateColor = (errorRate) => {
    if (errorRate <= 0.01) return '#4caf50';
    if (errorRate <= 0.05) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="metrics-panel">
      <h3>Performance Metrics</h3>
      
      {metrics ? (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value" style={{ color: getFidelityColor(metrics.fidelity) }}>
              {(metrics.fidelity * 100).toFixed(1)}%
            </div>
            <div className="metric-label">Fidelity</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {metrics.distance.toFixed(2)}
            </div>
            <div className="metric-label">Path Distance</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {metrics.duration}ms
            </div>
            <div className="metric-label">Duration</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {metrics.gatesApplied}
            </div>
            <div className="metric-label">Gates Applied</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {metrics.qubitCount}
            </div>
            <div className="metric-label">Qubits</div>
          </div>

          <div className="metric-card">
            <div className="metric-value" style={{ color: getErrorRateColor(metrics.errorRate) }}>
              {(metrics.errorRate * 100).toFixed(1)}%
            </div>
            <div className="metric-label">Error Rate</div>
          </div>
        </div>
      ) : (
        <p>No metrics available. Please run a simulation.</p>
      )}

      <div className="metrics-details">
        <h4>Detailed Analysis</h4>
        <ul>
          <li>Initial State: |0⟩</li>
          <li>Final State: |+⟩</li>
          <li>Path Type: Geodesic</li>
          <li>Simulation Method: Statevector</li>
          <li>Backend: Qiskit Aer Simulator</li>
        </ul>
      </div>

      <div className="export-controls">
        <button className="export-button">
          Export Metrics (CSV)
        </button>
        <button className="export-button">
          Save Visualization
        </button>
      </div>
    </div>
  );
};

export default MetricsPanel;
