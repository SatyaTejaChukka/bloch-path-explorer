from flask import Flask, jsonify, request
from sim.qiskit_sim import simulate_quantum_circuit, get_bloch_coordinates
from flask_cors import CORS
from qiskit import QuantumCircuit
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def parse_circuit_string(circuit_string):
    """Parse a circuit string like 'H X' into a QuantumCircuit"""
    qc = QuantumCircuit(1)
    
    gates = circuit_string.strip().split()
    for gate in gates:
        gate = gate.upper()
        if gate == 'H':
            qc.h(0)
        elif gate == 'X':
            qc.x(0)
        elif gate == 'Y':
            qc.y(0)
        elif gate == 'Z':
            qc.z(0)
        elif gate == 'S':
            qc.s(0)
        elif gate == 'T':
            qc.t(0)
        elif gate.startswith('RX'):
            # Extract angle from RX(angle)
            match = re.search(r'RX\(([^)]+)\)', gate)
            if match:
                angle = float(match.group(1))
                qc.rx(angle, 0)
        elif gate.startswith('RY'):
            # Extract angle from RY(angle)
            match = re.search(r'RY\(([^)]+)\)', gate)
            if match:
                angle = float(match.group(1))
                qc.ry(angle, 0)
        elif gate.startswith('RZ'):
            # Extract angle from RZ(angle)
            match = re.search(r'RZ\(([^)]+)\)', gate)
            if match:
                angle = float(match.group(1))
                qc.rz(angle, 0)
    
    return qc

@app.route('/api/simulate', methods=['POST'])
def simulate():
    try:
        data = request.get_json()
        circuit_string = data.get('circuit', '')
        
        if not circuit_string:
            # Default to H gate if no circuit provided
            qc = QuantumCircuit(1)
            qc.h(0)
        else:
            qc = parse_circuit_string(circuit_string)
        
        result = simulate_quantum_circuit(qc)
        coords = get_bloch_coordinates(result)
        
        return jsonify({
            'statevector': str(result),
            'bloch_coordinates': {
                'x': float(coords[0]),
                'y': float(coords[1]),
                'z': float(coords[2])
            },
            'circuit': circuit_string or 'H',
            'gates_applied': len(qc.data),
            'success': True
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 400

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Bloch Path Explorer API is running'})

if __name__ == "__main__":
    app.run(debug=True)
