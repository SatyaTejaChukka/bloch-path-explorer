import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Quantum circuit simulation
export const simulateCircuit = async (circuitString) => {
  try {
    const response = await api.post('/simulate', {
      circuit: circuitString,
    });
    return response.data;
  } catch (error) {
    console.error('Error simulating circuit:', error);
    throw error;
  }
};

// Get Bloch sphere coordinates
export const getBlochCoordinates = async (statevector) => {
  try {
    const response = await api.post('/bloch-coordinates', {
      statevector: statevector,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting Bloch coordinates:', error);
    throw error;
  }
};

// Generate path between states
export const generatePath = async (startState, endState, numPoints = 100) => {
  try {
    const response = await api.post('/generate-path', {
      start_state: startState,
      end_state: endState,
      num_points: numPoints,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating path:', error);
    throw error;
  }
};

// Get metrics and analysis
export const getMetrics = async (circuitData) => {
  try {
    const response = await api.post('/metrics', circuitData);
    return response.data;
  } catch (error) {
    console.error('Error getting metrics:', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.message || 'API request failed');
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw new Error('An unexpected error occurred');
    }
  }
);

export default api;
