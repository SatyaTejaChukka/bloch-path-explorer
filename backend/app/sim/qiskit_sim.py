# backend/app/sim/qiskit_sim.py

from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.quantum_info import DensityMatrix, Statevector
from qiskit_aer.primitives import Sampler
from qiskit.exceptions import QiskitError

def simulate_circuit(qasm_code: str):
    """Simulates a quantum circuit from QASM code and returns a list of DensityMatrix objects for each step."""
    try:
        qc = QuantumCircuit.from_qasm_str(qasm_code)
        
        # Remove measurement operations for statevector simulation
        # Create a copy without measurements
        qc_no_measurements = QuantumCircuit(qc.num_qubits)
        
        # Filter out measurement instructions
        for instruction, qargs, cargs in qc.data:
            if instruction.name != 'measure':
                qc_no_measurements.append(instruction, qargs)
        
        # Use Aer simulator to get the state after each instruction
        simulator = Aer.get_backend('statevector_simulator')
        
        # Initialize with the |0...0> state
        current_state = Statevector.from_int(0, 2**qc_no_measurements.num_qubits)
        
        # List to store snapshots of the density matrix at each step
        state_snapshots = [DensityMatrix(current_state)]

        # Iterate through instructions and get the state after each
        for instruction, qargs, cargs in qc_no_measurements.data:
            # Create a temporary circuit for the current instruction
            temp_qc = QuantumCircuit(qc_no_measurements.num_qubits)
            temp_qc.append(instruction, qargs)
            
            # Apply the instruction to the current state
            current_state = current_state.evolve(temp_qc)
            
            # Append the density matrix of the new state to snapshots
            state_snapshots.append(DensityMatrix(current_state))
            
        return state_snapshots
    except QiskitError as e:
        raise ValueError(f"Qiskit simulation error: {e}") # Re-raise as ValueError for main.py to catch
    except Exception as e:
        raise ValueError(f"An unexpected error occurred during simulation: {e}")

def execute_qiskit_code(raw_qiskit_code: str):
    """Executes raw Qiskit code and returns the result."""
    # Placeholder for raw Qiskit code execution
    # This is risky and needs careful sandboxing in a real application
    try:
        # Create a dictionary to act as the execution environment
        exec_env = {'QuantumCircuit': QuantumCircuit, 'Aer': Aer, 'transpile': transpile, 'DensityMatrix': DensityMatrix, 'Statevector': Statevector}
        exec(raw_qiskit_code, exec_env)
        # Assuming the raw_qiskit_code defines a 'result' variable or similar
        return {"status": "success", "result": str(exec_env.get('result', 'No explicit result variable found.'))}
    except Exception as e:
        return {"status": "error", "message": str(e)}
