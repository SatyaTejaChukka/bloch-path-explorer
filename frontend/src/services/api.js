// frontend/src/services/api.js
import { simulateCircuitClient, simulateQasmClient } from './quantumEngine';

// Environment variable or default backend URL with auto-normalization
const getBaseUrl = () => {
  // Supports BACKEND_API, VITE_BACKEND_API, and VITE_API_URL
  const rawUrl =
    (typeof __BACKEND_API__ !== 'undefined' && __BACKEND_API__) ||
    (import.meta.env && (import.meta.env.VITE_BACKEND_API || import.meta.env.BACKEND_API || import.meta.env.VITE_API_URL)) ||
    'http://localhost:5000/api';

  let cleanUrl = rawUrl.trim().replace(/\/+$/, ''); // Strip trailing slashes
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl += '/api';
  }
  return cleanUrl;
};

const API_BASE_URL = getBaseUrl();

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
      errorMessage = `Server error: ${response.statusText || response.status}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

/**
 * Health check for the remote backend.
 */
export const getHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await handleResponse(response);
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
};

/**
 * Simulates a circuit with Hybrid mode support:
 * - If useBackend is true: attempts remote Qiskit backend first. If unreachable or errors, provides clear notification and falls back to client engine.
 * - If useBackend is false (default): runs locally in browser via quantumEngine.js in < 1ms.
 */
export const simulateCircuit = async ({
  gates = [],
  qasmCode = '',
  numQubits = 2,
  useBackend = false
}) => {
  if (!useBackend) {
    // Run instant client-side quantum engine
    if (gates && gates.length > 0) {
      return simulateCircuitClient(gates, numQubits);
    }
    return simulateQasmClient(qasmCode, numQubits);
  }

  // Attempt remote backend
  try {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qasm_code: qasmCode,
        num_qubits: numQubits,
        qubits_to_trace_out: []
      }),
    });
    const result = await handleResponse(response);
    return { ...result, engine: 'remote-qiskit' };
  } catch (error) {
    console.warn("Remote backend failed, falling back to in-browser quantum engine:", error.message);
    const clientResult = gates && gates.length > 0 
      ? simulateCircuitClient(gates, numQubits)
      : simulateQasmClient(qasmCode, numQubits);

    return {
      ...clientResult,
      fallbackNotice: `Remote backend was unreachable (${error.message}). Simulated using the high-precision browser quantum engine.`
    };
  }
};

/**
 * Executes raw Qiskit code on the remote backend (requires backend server).
 */
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

export { API_BASE_URL };