# backend/app/sim/partial_trace.py

from qiskit.quantum_info import DensityMatrix, partial_trace
import numpy as np

def get_reduced_density_matrix(density_matrix: DensityMatrix, qubits_to_trace_out: list):
    """Calculates the reduced density matrix by partial tracing out specified qubits."""
    # Use the imported partial_trace function from qiskit.quantum_info
    return partial_trace(density_matrix, qubits_to_trace_out)

def calculate_von_neumann_entropy(density_matrix: DensityMatrix):
    """Calculates the Von Neumann entropy of a density matrix."""
    # Placeholder for entropy calculation
    eigenvalues = np.linalg.eigvalsh(density_matrix.data)
    # Filter out zero or negative eigenvalues to avoid log(0) or log(negative)
    non_zero_eigenvalues = eigenvalues[eigenvalues > 1e-9] 
    if len(non_zero_eigenvalues) == 0:
        return 0.0
    entropy = -np.sum(non_zero_eigenvalues * np.log2(non_zero_eigenvalues))
    return entropy

def calculate_purity(density_matrix: DensityMatrix):
    """Calculates the purity of a density matrix (Tr(rho^2))."""
    # Calculate purity using numpy trace
    rho_squared = density_matrix.data @ density_matrix.data
    return np.trace(rho_squared).real

def convert_density_matrix_to_bloch_coordinates(density_matrix: DensityMatrix):
    """Converts a single-qubit density matrix to Bloch sphere coordinates (x, y, z)."""
    # This function assumes a 2x2 density matrix for a single qubit
    rho = density_matrix.data
    
    # Ensure we have a 2x2 matrix
    if rho.shape != (2, 2):
        raise ValueError(f"Expected 2x2 density matrix for single qubit, got {rho.shape}")
    
    # Pauli matrices
    pauli_x = np.array([[0, 1], [1, 0]], dtype=complex)
    pauli_y = np.array([[0, -1j], [1j, 0]], dtype=complex)
    pauli_z = np.array([[1, 0], [0, -1]], dtype=complex)
    
    x = np.trace(rho @ pauli_x).real  # Pauli X expectation
    y = np.trace(rho @ pauli_y).real  # Pauli Y expectation
    z = np.trace(rho @ pauli_z).real  # Pauli Z expectation
    
    return [x, y, z]
