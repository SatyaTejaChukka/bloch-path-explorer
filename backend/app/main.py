from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit.quantum_info import DensityMatrix, partial_trace
from qiskit.exceptions import QiskitError # Import QiskitError

from sim.qiskit_sim import simulate_circuit, execute_qiskit_code
from sim.partial_trace import get_reduced_density_matrix, calculate_von_neumann_entropy, calculate_purity, convert_density_matrix_to_bloch_coordinates

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    qasm_code = data.get('qasm_code')
    num_qubits = data.get('num_qubits')

    if not qasm_code or num_qubits is None:
        return jsonify({"error": "Missing qasm_code or num_qubits"}), 400

    try:
        # Simulate the circuit and get state snapshots
        state_snapshots = simulate_circuit(qasm_code)
        
        # Build response data
        simulation_timeline = []

        for step_index, density_matrix in enumerate(state_snapshots):
            bloch_spheres_data = []
            
            # Calculate per-qubit data for this step
            for i in range(num_qubits):
                # Trace out all other qubits to get the reduced density matrix for qubit i
                trace_out_for_qubit_i = [q for q in range(num_qubits) if q != i]
                
                # If we only have one qubit, no partial trace needed
                if len(trace_out_for_qubit_i) == 0:
                    reduced_dm_for_qubit_i = density_matrix
                else:
                    reduced_dm_for_qubit_i = partial_trace(density_matrix, trace_out_for_qubit_i)
                
                bloch_coords = convert_density_matrix_to_bloch_coordinates(reduced_dm_for_qubit_i)
                entropy = calculate_von_neumann_entropy(reduced_dm_for_qubit_i)
                purity = calculate_purity(reduced_dm_for_qubit_i)

                bloch_spheres_data.append({
                    "qubit": int(i),
                    "bloch_coordinates": [float(x) for x in bloch_coords],  # Convert to Python floats
                    "entropy": float(entropy),
                    "purity": float(purity),
                    "is_pure": bool(purity > 0.999)  # Convert to Python bool
                })
            
            # Calculate overall metrics for this step
            # Dummy fidelity for now
            dummy_fidelity = 1.0 - (step_index / len(state_snapshots) * 0.5) # Decreases over time
            
            # Very basic heuristic for entanglement: if purity is low and entropy is high
            # This is NOT a rigorous measure of entanglement.
            is_entangled = False
            if num_qubits > 1 and calculate_purity(density_matrix) < 0.6 and calculate_von_neumann_entropy(density_matrix) > 0.5:
                is_entangled = True

            metrics = {
                'full_system_entropy': float(calculate_von_neumann_entropy(density_matrix)),
                'full_system_purity': float(calculate_purity(density_matrix)),
                'fidelity': float(dummy_fidelity),
                'is_entangled': bool(is_entangled)
            }

            simulation_timeline.append({
                "step": int(step_index),
                "bloch_spheres": bloch_spheres_data,
                "metrics": metrics
                # Removing density_matrix from response to avoid complex number serialization issues
                # "density_matrix": density_matrix.data.tolist() # Include full density matrix for debugging/future use
            })

        return jsonify({
            "simulation_timeline": simulation_timeline,
            "num_qubits": num_qubits # Return num_qubits for frontend convenience
        })
    except ValueError as e: # Catch ValueError re-raised from qiskit_sim.py
        print(f"ValueError occurred: {e}")
        return jsonify({"error": str(e)}), 400 # Bad request for Qiskit errors
    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500

@app.route('/api/execute-qiskit', methods=['POST'])
def execute_qiskit():
    data = request.get_json()
    raw_qiskit_code = data.get('raw_qiskit_code')

    if not raw_qiskit_code:
        return jsonify({"error": "Missing raw_qiskit_code"}), 400

    result = execute_qiskit_code(raw_qiskit_code)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)