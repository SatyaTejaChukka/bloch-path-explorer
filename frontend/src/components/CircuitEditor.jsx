// frontend/src/components/CircuitEditor.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { simulateCircuit } from '../services/api';
import { useDrag, useDrop } from 'react-dnd';

const ItemTypes = {
  GATE: 'gate',
};

export const AVAILABLE_GATES = [
  { name: 'H', category: 'single', desc: 'Hadamard: creates equal superposition |+⟩', color: '#00F5D4' },
  { name: 'X', category: 'single', desc: 'Pauli-X (NOT): flips |0⟩ ↔ |1⟩', color: '#00C2A8' },
  { name: 'Y', category: 'single', desc: 'Pauli-Y: bit and phase flip', color: '#00F5D4' },
  { name: 'Z', category: 'single', desc: 'Pauli-Z: phase flip (|1⟩ → -|1⟩)', color: '#00F5D4' },
  { name: 'S', category: 'single', desc: 'S Phase Gate: π/2 phase shift around Z', color: '#7000FF' },
  { name: 'T', category: 'single', desc: 'T Gate: π/4 phase shift around Z', color: '#7000FF' },
  { name: 'RX', category: 'rot', desc: 'Rotation around X axis by angle θ', color: '#FF4DA6' },
  { name: 'RY', category: 'rot', desc: 'Rotation around Y axis by angle θ', color: '#FF4DA6' },
  { name: 'RZ', category: 'rot', desc: 'Rotation around Z axis by angle θ', color: '#FF4DA6' },
  { name: 'CNOT', category: 'two', desc: 'Controlled-NOT: flips target if control is |1⟩', color: '#FFD60A' },
  { name: 'CZ', category: 'two', desc: 'Controlled-Z: phase flip if both are |1⟩', color: '#FFD60A' },
  { name: 'SWAP', category: 'two', desc: 'SWAP: exchanges states of two qubits', color: '#FF9E00' },
];

function DraggableGate({ gate, selectedGate, onSelectGate }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.GATE,
    item: { name: gate.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const isSelected = selectedGate?.name === gate.name;

  return (
    <div
      ref={drag}
      className={`gate-palette-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelectGate(gate)}
      title={`${gate.desc} (Click to select or drag to cell)`}
      style={{
        opacity: isDragging ? 0.4 : 1,
        borderColor: gate.color,
      }}
    >
      <span className="gate-palette-name" style={{ color: gate.color }}>
        {gate.name}
      </span>
      <span className="gate-palette-desc">{gate.category}</span>
    </div>
  );
}

function CircuitCell({
  qubitIndex,
  timeIndex,
  onDropGate,
  onCellClick,
  placedGate,
  onRemoveGate,
  onUpdateGateTarget,
  numQubits
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.GATE,
    drop: (item) => onDropGate(item.name, qubitIndex, timeIndex),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const isTwoQubit = placedGate && ['CNOT', 'CZ', 'SWAP'].includes(placedGate.name);

  return (
    <div
      ref={drop}
      className={`circuit-cell ${isOver ? 'cell-over' : ''} ${placedGate ? 'has-gate' : ''}`}
      onClick={() => onCellClick(qubitIndex, timeIndex)}
    >
      <div className="wire-line" />
      {placedGate && (
        <div
          className="placed-gate-badge"
          style={{
            borderColor: isTwoQubit ? '#FFD60A' : '#00F5D4',
            boxShadow: `0 0 12px ${isTwoQubit ? 'rgba(255, 214, 10, 0.4)' : 'rgba(0, 245, 212, 0.4)'}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="gate-header">
            <span className="gate-name">{placedGate.name}</span>
            <button
              className="remove-gate-btn"
              title="Remove gate"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveGate(qubitIndex, timeIndex);
              }}
            >
              ✕
            </button>
          </div>

          {isTwoQubit && (
            <div className="two-qubit-target">
              <label>→ q</label>
              <select
                value={placedGate.target !== undefined ? placedGate.target : (qubitIndex + 1) % numQubits}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateGateTarget(qubitIndex, timeIndex, parseInt(e.target.value, 10));
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {Array.from({ length: numQubits }).map((_, qIdx) => {
                  if (qIdx === qubitIndex) return null;
                  return (
                    <option key={qIdx} value={qIdx}>
                      {qIdx}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {['RX', 'RY', 'RZ'].includes(placedGate.name) && (
            <span className="rot-angle-label">π/2</span>
          )}
        </div>
      )}
    </div>
  );
}

function CircuitEditor({ onSimulate, engineMode = 'client', onToggleEngine }) {
  const [numQubits, setNumQubits] = useState(2);
  const [numTimeSteps, setNumTimeSteps] = useState(6);
  const [circuitGates, setCircuitGates] = useState([
    { name: 'H', qubit: 0, time: 0 },
    { name: 'CNOT', qubit: 0, target: 1, time: 1 }
  ]);
  const [selectedPaletteGate, setSelectedPaletteGate] = useState(null);
  const [activeEditorTab, setActiveEditorTab] = useState('visual'); // 'visual' | 'qasm'
  const [customQasm, setCustomQasm] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);

  // Auto-generate OpenQASM 2.0 representation from visual gates
  const generatedQASM = useMemo(() => {
    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[${numQubits}];\ncreg c[${numQubits}];\n\n`;

    const gatesByTime = {};
    circuitGates.forEach((gate) => {
      if (!gatesByTime[gate.time]) gatesByTime[gate.time] = [];
      gatesByTime[gate.time].push(gate);
    });

    Object.keys(gatesByTime)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((time) => {
        gatesByTime[time].forEach((gate) => {
          const name = gate.name.toUpperCase();
          const target = gate.target !== undefined ? gate.target : (gate.qubit + 1) % numQubits;

          if (name === 'CNOT' || name === 'CX') {
            qasm += `cx q[${gate.qubit}], q[${target}];\n`;
          } else if (name === 'CZ') {
            qasm += `cz q[${gate.qubit}], q[${target}];\n`;
          } else if (name === 'SWAP') {
            qasm += `swap q[${gate.qubit}], q[${target}];\n`;
          } else if (['RX', 'RY', 'RZ'].includes(name)) {
            qasm += `${name.toLowerCase()}(pi/2) q[${gate.qubit}];\n`;
          } else {
            qasm += `${name.toLowerCase()} q[${gate.qubit}];\n`;
          }
        });
      });

    return qasm;
  }, [circuitGates, numQubits]);

  const handleDropGate = useCallback((gateName, qubit, time) => {
    setCircuitGates((prev) => {
      const filtered = prev.filter((g) => !(g.qubit === qubit && g.time === time));
      const target = (qubit + 1) % numQubits;
      return [...filtered, { name: gateName, qubit, target, time }];
    });
  }, [numQubits]);

  const handleCellClick = (qubit, time) => {
    if (selectedPaletteGate) {
      handleDropGate(selectedPaletteGate.name, qubit, time);
    }
  };

  const handleRemoveGate = (qubit, time) => {
    setCircuitGates((prev) => prev.filter((g) => !(g.qubit === qubit && g.time === time)));
  };

  const handleUpdateGateTarget = (qubit, time, newTarget) => {
    setCircuitGates((prev) =>
      prev.map((g) => {
        if (g.qubit === qubit && g.time === time) {
          return { ...g, target: newTarget };
        }
        return g;
      })
    );
  };

  const handleClearCircuit = () => {
    setCircuitGates([]);
    setSimulationError(null);
    setNoticeMessage(null);
  };

  const handleApplyPreset = (presetName) => {
    setSimulationError(null);
    setNoticeMessage(null);

    if (presetName === 'bell') {
      setNumQubits(2);
      setCircuitGates([
        { name: 'H', qubit: 0, time: 0 },
        { name: 'CNOT', qubit: 0, target: 1, time: 1 }
      ]);
    } else if (presetName === 'ghz') {
      setNumQubits(3);
      setCircuitGates([
        { name: 'H', qubit: 0, time: 0 },
        { name: 'CNOT', qubit: 0, target: 1, time: 1 },
        { name: 'CNOT', qubit: 1, target: 2, time: 2 }
      ]);
    } else if (presetName === 'superdense') {
      setNumQubits(2);
      setCircuitGates([
        { name: 'H', qubit: 0, time: 0 },
        { name: 'CNOT', qubit: 0, target: 1, time: 1 },
        { name: 'X', qubit: 0, time: 2 },
        { name: 'CNOT', qubit: 0, target: 1, time: 3 },
        { name: 'H', qubit: 0, time: 4 }
      ]);
    } else if (presetName === 'rotation') {
      setNumQubits(1);
      setCircuitGates([
        { name: 'RY', qubit: 0, time: 0 },
        { name: 'RZ', qubit: 0, time: 1 },
        { name: 'RX', qubit: 0, time: 2 }
      ]);
    } else if (presetName === 'teleport') {
      setNumQubits(3);
      setCircuitGates([
        { name: 'RY', qubit: 0, time: 0 },
        { name: 'H', qubit: 1, time: 0 },
        { name: 'CNOT', qubit: 1, target: 2, time: 1 },
        { name: 'CNOT', qubit: 0, target: 1, time: 2 },
        { name: 'H', qubit: 0, time: 3 }
      ]);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationError(null);
    setNoticeMessage(null);

    try {
      let result;
      const isBackendMode = engineMode === 'backend';

      if (activeEditorTab === 'qasm' && customQasm.trim()) {
        result = await simulateCircuit({
          qasmCode: customQasm,
          numQubits,
          useBackend: isBackendMode
        });
      } else {
        result = await simulateCircuit({
          gates: circuitGates,
          qasmCode: generatedQASM,
          numQubits,
          useBackend: isBackendMode
        });
      }

      if (result.error) {
        setSimulationError(result.error);
      } else {
        if (result.fallbackNotice) {
          setNoticeMessage(result.fallbackNotice);
        }
        onSimulate(result);
      }
    } catch (err) {
      setSimulationError(err.message || 'Simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="circuit-editor-container">
      {/* Sidebar: Gate Palette & Preset Circuits */}
      <div className="gate-palette-sidebar">
        <div className="sidebar-section">
          <div className="palette-header">
            <h4>Gate Palette</h4>
            <span className="palette-hint">Drag or Click to Select</span>
          </div>

          <div className="gates-grid-styled">
            {AVAILABLE_GATES.map((gate) => (
              <DraggableGate
                key={gate.name}
                gate={gate}
                selectedGate={selectedPaletteGate}
                onSelectGate={(g) =>
                  setSelectedPaletteGate(selectedPaletteGate?.name === g.name ? null : g)
                }
              />
            ))}
          </div>

          {selectedPaletteGate && (
            <div className="selected-gate-helper">
              Selected: <strong>{selectedPaletteGate.name}</strong>. Click any cell to place it!
            </div>
          )}
        </div>

        <div className="sidebar-section presets-section">
          <h4>Circuit Presets</h4>
          <div className="preset-buttons-grid">
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset('bell')}
              title="2-qubit Bell State: Maximum entanglement"
            >
              Bell State (|Φ⁺⟩)
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset('ghz')}
              title="3-qubit GHZ State: Tripartite entanglement"
            >
              3-Qubit GHZ State
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset('rotation')}
              title="Single-qubit RY/RZ/RX rotations"
            >
              Bloch Rotations
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset('superdense')}
              title="Superdense Coding protocol"
            >
              Superdense Coding
            </button>
            <button
              className="preset-btn"
              onClick={() => handleApplyPreset('teleport')}
              title="Quantum Teleportation state prep"
            >
              Teleportation Prep
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="circuit-canvas-area">
        <div className="canvas-top-bar">
          <div className="canvas-title-group">
            <h3>Quantum Circuit Designer</h3>
            <div className="tab-pill-toggle">
              <button
                className={`tab-pill ${activeEditorTab === 'visual' ? 'active' : ''}`}
                onClick={() => setActiveEditorTab('visual')}
              >
                Visual Grid
              </button>
              <button
                className={`tab-pill ${activeEditorTab === 'qasm' ? 'active' : ''}`}
                onClick={() => {
                  setActiveEditorTab('qasm');
                  if (!customQasm) setCustomQasm(generatedQASM);
                }}
              >
                OpenQASM 2.0
              </button>
            </div>
          </div>

          <div className="canvas-controls-group">
            <div className="qubit-counter">
              <label>Qubits (1–5):</label>
              <div className="counter-stepper">
                <button
                  disabled={numQubits <= 1}
                  onClick={() => {
                    const next = Math.max(1, numQubits - 1);
                    setNumQubits(next);
                    setCircuitGates((prev) => prev.filter((g) => g.qubit < next && (g.target === undefined || g.target < next)));
                  }}
                >
                  -
                </button>
                <span>{numQubits}</span>
                <button
                  disabled={numQubits >= 5}
                  onClick={() => setNumQubits(Math.min(5, numQubits + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <button className="clear-btn" onClick={handleClearCircuit} title="Clear all gates">
              Clear All
            </button>
          </div>
        </div>

        {/* Visual Circuit Grid */}
        {activeEditorTab === 'visual' ? (
          <div className="circuit-grid-wrapper">
            <div className="circuit-grid-table">
              {Array.from({ length: numQubits }).map((_, qubitIndex) => (
                <div key={qubitIndex} className="circuit-qubit-row">
                  <div className="qubit-badge">
                    <span className="qubit-name">q{qubitIndex}</span>
                    <span className="qubit-init">|0⟩</span>
                  </div>

                  <div className="cells-timeline">
                    {Array.from({ length: numTimeSteps }).map((_, timeIndex) => {
                      const placedGate = circuitGates.find(
                        (g) => g.qubit === qubitIndex && g.time === timeIndex
                      );
                      return (
                        <CircuitCell
                          key={`${qubitIndex}-${timeIndex}`}
                          qubitIndex={qubitIndex}
                          timeIndex={timeIndex}
                          onDropGate={handleDropGate}
                          onCellClick={handleCellClick}
                          placedGate={placedGate}
                          onRemoveGate={handleRemoveGate}
                          onUpdateGateTarget={handleUpdateGateTarget}
                          numQubits={numQubits}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid-footer-actions">
              <button
                className="step-adjust-btn"
                onClick={() => setNumTimeSteps((prev) => Math.max(4, prev - 1))}
                disabled={numTimeSteps <= 4}
              >
                - Fewer Steps
              </button>
              <span className="step-counter-text">{numTimeSteps} Time Steps</span>
              <button
                className="step-adjust-btn"
                onClick={() => setNumTimeSteps((prev) => Math.min(10, prev + 1))}
                disabled={numTimeSteps >= 10}
              >
                + More Steps
              </button>
            </div>
          </div>
        ) : (
          /* OpenQASM Code Editor */
          <div className="qasm-editor-container">
            <div className="qasm-toolbar">
              <span>OpenQASM 2.0 Code</span>
              <button
                className="copy-qasm-btn"
                onClick={() => {
                  navigator.clipboard.writeText(customQasm || generatedQASM);
                  alert('Copied QASM to clipboard!');
                }}
              >
                Copy QASM
              </button>
            </div>
            <textarea
              className="qasm-textarea"
              value={customQasm || generatedQASM}
              onChange={(e) => setCustomQasm(e.target.value)}
              placeholder="Paste or write your OpenQASM 2.0 code here..."
              rows={12}
            />
          </div>
        )}

        {/* Notice Message */}
        {noticeMessage && (
          <div className="notice-banner">
            <span>ℹ️ {noticeMessage}</span>
          </div>
        )}

        {/* Simulation Error */}
        {simulationError && (
          <div className="simulation-error-message">
            <p>Error: {simulationError}</p>
            <button className="clear-error-button" onClick={() => setSimulationError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Action Run Bar */}
        <div className="simulate-action-bar">
          <div className="engine-status-pill">
            <span className={`status-dot ${engineMode === 'client' ? 'green' : 'blue'}`} />
            <span>
              Engine: <strong>{engineMode === 'client' ? 'Browser (Instant & Free)' : 'Remote Qiskit API'}</strong>
            </span>
            {onToggleEngine && (
              <button className="engine-toggle-link" onClick={onToggleEngine}>
                Switch to {engineMode === 'client' ? 'Remote Qiskit' : 'Browser Engine'}
              </button>
            )}
          </div>

          <button
            className={`simulate-primary-btn ${isSimulating ? 'loading' : ''}`}
            onClick={handleSimulate}
            disabled={isSimulating}
          >
            {isSimulating ? 'Simulating Quantum State...' : 'Simulate Circuit & View Bloch Spheres →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CircuitEditor;