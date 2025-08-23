# Qiskit simulation for Bloch Path Explorer

from qiskit import QuantumCircuit
from qiskit_aer import Aer
from qiskit.quantum_info import Statevector
import numpy as np

def simulate_quantum_circuit(circuit: QuantumCircuit):
    """
    Simulate a quantum circuit and return the statevector
    """
    simulator = Aer.get_backend('statevector_simulator')
    result = simulator.run(circuit).result()
    statevector = result.get_statevector()
    return statevector

def get_bloch_coordinates(statevector):
    """
    Convert statevector to Bloch sphere coordinates
    """
    # Extract alpha and beta from statevector
    alpha = statevector[0]
    beta = statevector[1]
    
    # Calculate Bloch coordinates
    x = 2 * np.real(np.conj(alpha) * beta)
    y = 2 * np.imag(np.conj(alpha) * beta)
    z = np.abs(alpha)**2 - np.abs(beta)**2
    
    return x, y, z
