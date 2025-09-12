import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function MetricsPanel({ metrics }) {
  const purityData = [
    { name: 'Purity', value: metrics ? metrics.full_system_purity : 0 },
    { name: 'Impurity', value: metrics ? (1 - metrics.full_system_purity) : 1 },
  ];

  const COLORS = ['#00F5D4', '#222']; // Primary accent for purity, dark for impurity

  if (!metrics) {
    return (
      <div className="metrics-panel-container">
        <h3>Quantum Metrics Dashboard</h3>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>
          No metrics data available. Please run a simulation first.
        </p>
      </div>
    );
  }

  return (
    <div className="metrics-panel-container">
      <h3>Quantum Metrics Dashboard</h3>
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Von Neumann Entropy (S)</h4>
          <p className="metric-value">{metrics.full_system_entropy.toFixed(3)}</p>
        </div>
        <div className="metric-card">
          <h4>Purity (Tr(ρ²))</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={purityData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                fill="#8884d8"
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {purityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
              {/* <Legend /> */}
            </PieChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--highlight-color)' }}>
            {(metrics.full_system_purity * 100).toFixed(1)}%
          </p>
        </div>
        <div className="metric-card">
          <h4>Fidelity</h4>
          <p className="metric-value">{metrics.fidelity.toFixed(3)}</p>
        </div>
      </div>
      <div className="entanglement-visualization">
        <h4>Entanglement Visualization</h4>
        <p className="metric-value" style={{ fontSize: '1.5rem' }}>
          {metrics.is_entangled ? 'Entangled' : 'Separable'}
        </p>
      </div>
    </div>
  );
}

export default MetricsPanel;
