// frontend/src/components/MetricsPanel.jsx
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

function MetricsPanel({ metrics, blochSpheres = [], currentStep = 0, currentGateLabel = '' }) {
  if (!metrics) {
    return (
      <div className="metrics-empty-container">
        <div className="empty-icon">📊</div>
        <h3>No Quantum Metrics Available</h3>
        <p>Run a simulation in the Circuit Editor to view live quantum statistics and probability distributions.</p>
      </div>
    );
  }

  const isEntangled = metrics.is_entangled;
  const basisProbabilities = metrics.basis_probabilities || [];

  const BAR_COLORS = ['#00F5D4', '#FF4DA6', '#FFD60A', '#7000FF', '#00C2A8', '#FF9E00', '#3B82F6', '#EF4444'];

  return (
    <div className="metrics-dashboard">
      {/* Top Banner: Step & Entanglement Status */}
      <div className="metrics-summary-banner">
        <div className="summary-card status-card">
          <span className="summary-label">Entanglement Status</span>
          <div className="entanglement-badge-wrapper">
            <span className={`entanglement-pill ${isEntangled ? 'entangled' : 'separable'}`}>
              {isEntangled ? '⚡ Quantum Entangled' : '✨ Separable / Product State'}
            </span>
          </div>
          <p className="summary-subtext">
            {isEntangled
              ? 'Qubits cannot be described independently; individual qubits exhibit mixed states.'
              : 'Each qubit possesses an independent statevector on the Bloch sphere surface.'}
          </p>
        </div>

        <div className="summary-card">
          <span className="summary-label">Ground State Fidelity</span>
          <div className="summary-number">
            {metrics.fidelity !== undefined ? (metrics.fidelity * 100).toFixed(1) + '%' : '100%'}
          </div>
          <p className="summary-subtext">Overlap |⟨0...0|ψ⟩|² with initial ground state</p>
        </div>

        <div className="summary-card">
          <span className="summary-label">Average Subsystem Entropy</span>
          <div className="summary-number">
            {metrics.average_subsystem_entropy !== undefined ? metrics.average_subsystem_entropy.toFixed(3) : '0.000'}
          </div>
          <p className="summary-subtext">Von Neumann entropy across all qubits (bits)</p>
        </div>

        <div className="summary-card">
          <span className="summary-label">Current Step Gate</span>
          <div className="summary-gate-text">
            {currentGateLabel || `Step ${currentStep}`}
          </div>
          <p className="summary-subtext">Evolution progress</p>
        </div>
      </div>

      {/* Main Charts & Breakdown */}
      <div className="metrics-content-grid">
        {/* Computational Basis Probabilities Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Computational Basis State Probabilities</h4>
            <span className="chart-hint">P(|k⟩) = |⟨k|ψ⟩|²</span>
          </div>

          <div className="chart-body" style={{ height: 260 }}>
            {basisProbabilities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={basisProbabilities} margin={{ top: 20, right: 20, left: 0, bottom: 25 }}>
                  <XAxis
                    dataKey="state"
                    stroke="#888"
                    tick={{ fill: '#EAEAEA', fontSize: 13, fontFamily: 'Fira Code' }}
                  />
                  <YAxis
                    stroke="#888"
                    domain={[0, 1]}
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    tick={{ fill: '#888', fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="recharts-custom-tooltip">
                            <span className="tooltip-state">{data.state}</span>
                            <span className="tooltip-prob">
                              Probability: <strong>{data.percentage}%</strong>
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                    {basisProbabilities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-subtext">No probability distribution data.</p>
            )}
          </div>
        </div>

        {/* Per-Qubit Metrics Table */}
        <div className="qubit-table-card">
          <div className="chart-header">
            <h4>Reduced Density Matrix & Bloch Summary</h4>
            <span className="chart-hint">Per-Qubit Statistics</span>
          </div>

          <div className="qubit-table-wrapper">
            <table className="styled-metrics-table">
              <thead>
                <tr>
                  <th>Qubit</th>
                  <th>Bloch Vector (X, Y, Z)</th>
                  <th>Radius |r|</th>
                  <th>Purity (Tr(ρ²))</th>
                  <th>Entropy S</th>
                  <th>P(|0⟩)</th>
                  <th>P(|1⟩)</th>
                </tr>
              </thead>
              <tbody>
                {blochSpheres.map((q) => {
                  const coords = q.bloch_coordinates || [0, 0, 1];
                  const r = q.radius !== undefined ? q.radius : Math.hypot(...coords);
                  const isPure = r >= 0.98;

                  return (
                    <tr key={q.qubit}>
                      <td>
                        <span className="table-qubit-tag">q{q.qubit}</span>
                      </td>
                      <td className="font-mono">
                        ({coords[0].toFixed(2)}, {coords[1].toFixed(2)}, {coords[2].toFixed(2)})
                      </td>
                      <td>
                        <span className={`table-r-badge ${isPure ? 'pure' : 'mixed'}`}>
                          {r.toFixed(3)}
                        </span>
                      </td>
                      <td>{(q.purity * 100).toFixed(1)}%</td>
                      <td>{q.entropy.toFixed(3)}</td>
                      <td className="color-zero">{(q.prob0 !== undefined ? q.prob0 * 100 : 50).toFixed(0)}%</td>
                      <td className="color-one">{(q.prob1 !== undefined ? q.prob1 * 100 : 50).toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quantum Principles Knowledge Pill */}
      <div className="quantum-principles-footer">
        <div className="principle-item">
          <strong>Bloch Vector Length (|r| = 1 vs |r| &lt; 1)</strong>:
          Pure single-qubit states sit on the sphere surface (|r| = 1). When qubits become entangled with the environment or other qubits, their local reduced state moves inside the Bloch ball (|r| &lt; 1).
        </div>
        <div className="principle-item">
          <strong>Von Neumann Entropy</strong>:
          Calculated as S = -Tr(ρ log₂ ρ). For an unentangled pure qubit, S = 0. For a maximally entangled qubit (such as in a Bell pair), S = 1.0 bit.
        </div>
      </div>
    </div>
  );
}

export default MetricsPanel;
