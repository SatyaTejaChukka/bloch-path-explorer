import React, { useState, useCallback } from 'react';
import { simulateCircuit } from '../services/api';
import { useDrag, useDrop } from 'react-dnd';

const ItemTypes = {
  GATE: 'gate',
};

const gates = [
  { name: 'H', tooltip: 'Hadamard Gate' },
  { name: 'X', tooltip: 'Pauli-X Gate (NOT)' },
  { name: 'Y', tooltip: 'Pauli-Y Gate' },
  { name: 'Z', tooltip: 'Pauli-Z Gate' },
  { name: 'RX', tooltip: 'Rotation X Gate' },
  { name: 'RY', tooltip: 'Rotation Y Gate' },
  { name: 'RZ', tooltip: 'Rotation Z Gate' },
  { name: 'CNOT', tooltip: 'Controlled-NOT Gate' },
  { name: 'SWAP', tooltip: 'SWAP Gate' },
];

function DraggableGate({ gate }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.GATE,
    item: { name: gate.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className="gate-button"
      title={gate.tooltip}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {gate.name}
    </div>
  );
}

// Component for a single cell in the circuit grid
function CircuitCell({ qubitIndex, timeIndex, onDropGate, placedGate }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.GATE,
    drop: (item) => onDropGate(item.name, qubitIndex, timeIndex),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className="circuit-cell"
      style={{ backgroundColor: isOver ? '#2a2a2a' : 'transparent' }}
    >
      {placedGate && <div className="placed-gate">{placedGate.name}</div>}
    </div>
  );
}

function CircuitEditor({ onSimulate }) {
  const [numQubits, setNumQubits] = useState(2);
  const [numTimeSteps, setNumTimeSteps] = useState(5); // Fixed number of columns for now
  const [circuitGates, setCircuitGates] = useState([]); // Stores { name, qubit, time }
  const [simulationError, setSimulationError] = useState(null);

  const handleDropGate = useCallback((gateName, qubit, time) => {
    setCircuitGates((prevGates) => {
      // Check if a gate already exists at this position
      const existingGateIndex = prevGates.findIndex(
        (g) => g.qubit === qubit && g.time === time
      );

      if (existingGateIndex > -1) {
        // Replace existing gate
        const newGates = [...prevGates];
        newGates[existingGateIndex] = { name: gateName, qubit, time };
        return newGates;
      } else {
        // Add new gate
        return [...prevGates, { name: gateName, qubit, time }];
      }
    });
  }, []);

  // Function to generate QASM from circuitGates
  const generateQASM = useCallback(() => {
    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\n`;
    qasm += `qreg q[${numQubits}];\n`;
    // No classical register needed for statevector simulation
    // qasm += `creg c[${numQubits}];\n`;

    // Group gates by time step
    const gatesByTime = {};
    circuitGates.forEach(gate => {
      if (!gatesByTime[gate.time]) {
        gatesByTime[gate.time] = [];
      }
      gatesByTime[gate.time].push(gate);
    });

    // Sort time steps and then gates within each time step by qubit
    Object.keys(gatesByTime).sort((a, b) => a - b).forEach(time => {
      gatesByTime[time].sort((a, b) => a.qubit - b.qubit).forEach(gate => {
        // Basic QASM generation (needs to be expanded for multi-qubit gates and parameters)
        if (gate.name === 'CNOT') {
          // CNOT needs two qubits. For simplicity, assume control is qubit and target is qubit+1
          // This needs proper UI for selecting control/target
          qasm += `cx q[${gate.qubit}],q[${gate.qubit + 1}];\n`;
        } else if (gate.name === 'SWAP') {
          // SWAP needs two qubits. Assume qubit and qubit+1
          qasm += `swap q[${gate.qubit}],q[${gate.qubit + 1}];\n`;
        } else if (['RX', 'RY', 'RZ'].includes(gate.name)) {
          // Parameterized gates need a parameter. For simplicity, use pi/2
          qasm += `${gate.name.toLowerCase()}(pi/2) q[${gate.qubit}];\n`;
        } else {
          qasm += `${gate.name.toLowerCase()} q[${gate.qubit}];\n`;
        }
      });
    });

    // Don't add measurements for Bloch sphere visualization
    // We want to preserve the quantum state, not collapse it
    // for (let i = 0; i < numQubits; i++) {
    //   qasm += `measure q[${i}] -> c[${i}];\n`;
    // }

    return qasm;
  }, [circuitGates, numQubits]);

  const handleSimulate = async () => {
    setSimulationError(null);
    try {
      const generatedQASM = generateQASM();
      console.log("Generated QASM:", generatedQASM);
      const result = await simulateCircuit(generatedQASM, numQubits);
      if (result.error) {
        setSimulationError(result.error);
      } else {
        onSimulate(result);
      }
    } catch (error) {
      setSimulationError(error.message);
    }
  };

  return (
    <div className="circuit-editor-container">
      <div className="gate-palette">
        <h4>Gate Palette</h4>
        <div className="gates-grid">
          {gates.map((gate) => (
            <DraggableGate key={gate.name} gate={gate} />
          ))}
        </div>
        <div className="example-circuits">
          <h4>Example Circuits</h4>
          <button className="example-button" onClick={() => {
            // Clear circuit and create Bell state: H on q0, CNOT q0->q1
            setCircuitGates([
              { id: 'bell_h', name: 'H', qubit: 0, timeStep: 0 },
              { id: 'bell_cnot', name: 'CNOT', qubit: 0, timeStep: 1 }
            ]);
            setNumQubits(2);
          }}>Bell State</button>
          <button className="example-button" onClick={() => {
            // Clear circuit and create GHZ state: H on q0, CNOT q0->q1, CNOT q1->q2
            setCircuitGates([
              { id: 'ghz_h', name: 'H', qubit: 0, timeStep: 0 },
              { id: 'ghz_cnot1', name: 'CNOT', qubit: 0, timeStep: 1 },
              { id: 'ghz_cnot2', name: 'CNOT', qubit: 1, timeStep: 2 }
            ]);
            setNumQubits(3);
          }}>GHZ State</button>
        </div>
      </div>
      <div className="circuit-canvas">
        <h4>Circuit Canvas</h4>
        <div className="qubit-selector">
          <label htmlFor="num-qubits">Number of Qubits:</label>
          <input 
            type="number" 
            id="num-qubits" 
            value={numQubits}
            onChange={(e) => setNumQubits(parseInt(e.target.value))}
            min="1"
          />
        </div>
        <div className="circuit-grid">
          {Array.from({ length: numQubits }).map((_, qubitIndex) => (
            <React.Fragment key={qubitIndex}>
              <div className="qubit-label">q{qubitIndex}:</div>
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
                    placedGate={placedGate}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <button onClick={handleSimulate}>Simulate Circuit</button>
        {simulationError && <p style={{ color: 'red' }}>Error: {simulationError}</p>}
      </div>
    </div>
  );
}

export default CircuitEditor;