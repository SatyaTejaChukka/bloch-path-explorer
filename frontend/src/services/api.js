const API_BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMessage = errorData.error;
            } else {
                errorMessage = `Server error: ${response.statusText}`;
            }
        } catch (e) {
            // If response is not JSON, use status text
            errorMessage = `Server error: ${response.statusText || response.status}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const simulateCircuit = async (qasmCode, numQubits, qubitsToTraceOut = []) => {
    try {
        const response = await fetch(`${API_BASE_URL}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qasm_code: qasmCode, num_qubits: numQubits, qubits_to_trace_out: qubitsToTraceOut }),
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error simulating circuit:", error);
        throw error;
    }
};

export const executeQiskit = async (rawQiskitCode) => {
    try {
        const response = await fetch(`${API_BASE_URL}/execute-qiskit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw_qiskit_code: rawQiskitCode }),
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error executing Qiskit code:", error);
        throw error;
    }
};

export const getHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return handleResponse(response);
    } catch (error) {
        console.error("Error getting health status:", error);
        throw error;
    }
};