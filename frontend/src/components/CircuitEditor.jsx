import React, { useState } from 'react';
import { simulateCircuit } from '../services/api';

const CircuitEditor = ({ onSimulationResult }) => {
    const [circuit, setCircuit] = useState('');
    const [gates, setGates] = useState([]);
    
    const handleCircuitChange = (event) => {
        setCircuit(event.target.value);
    };

    const addGate = (gate) => {
        setGates([...gates, gate]);
        setCircuit(circuit + gate + ' ');
    };

    const clearCircuit = () => {
        setCircuit('');
        setGates([]);
    };

    const handleSimulate = async () => {
        console.log('Circuit to simulate:', circuit); // Log the circuit string
        try {
            const result = await simulateCircuit(circuit);
            console.log('Simulation Result:', result);
            if (onSimulationResult) {
                onSimulationResult(result);
            }
        } catch (error) {
            console.error('Simulation failed:', error);
            alert('Simulation failed. Please check the console for more details.');
        }
    };

    const quantumGates = ['H', 'X', 'Y', 'Z', 'S', 'T', 'RX', 'RY', 'RZ', 'CNOT'];

    return (
        <div className="circuit-editor">
            <h3>Quantum Circuit Editor</h3>
            
            <div className="gate-buttons">
                {quantumGates.map((gate) => (
                    <button
                        key={gate}
                        onClick={() => addGate(gate)}
                        className="gate-button"
                    >
                        {gate}
                    </button>
                ))}
            </div>

            <textarea
                value={circuit}
                onChange={handleCircuitChange}
                placeholder="Enter quantum circuit (e.g., H X CNOT)"
                rows={4}
                className="circuit-textarea"
            />

            <div className="circuit-controls">
                <button onClick={clearCircuit} className="clear-button">
                    Clear Circuit
                </button>
                <button onClick={handleSimulate} className="simulate-button">
                    Simulate
                </button>
            </div>

            {gates.length > 0 && (
                <div className="circuit-preview">
                    <h4>Circuit Preview:</h4>
                    <div className="gate-sequence">
                        {gates.map((gate, index) => (
                            <span key={index} className="gate-tag">
                                {gate}
                            </span>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default CircuitEditor;
