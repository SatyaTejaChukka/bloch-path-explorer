# Bloch Path Explorer

A quantum computing visualization tool that explores and animates paths on the Bloch sphere. This project provides an interactive interface for simulating quantum circuits and visualizing their effects on qubit states.

## Project Structure

```
bloch-path-explorer/
├── backend/
│   └── app/
│       ├── main.py              # Main Flask application
│       ├── requirements.txt     # Python dependencies
│       ├── Dockerfile          # Backend container configuration
│       ├── README.md           # Backend documentation
│       └── sim/
│           ├── qiskit_sim.py   # Qiskit simulation functions
│           └── utils.py        # Utility functions
│
├── frontend/
│   ├── package.json            # Node.js dependencies
│   ├── vite.config.js         # Vite configuration
│   └── src/
│       ├── main.jsx           # React entry point
│       ├── App.jsx            # Main application component
│       ├── components/
│       │   ├── BlochSphere.jsx    # 3D Bloch sphere visualization
│       │   ├── CircuitEditor.jsx  # Quantum circuit editor
│       │   ├── Controls.jsx       # Animation controls
│       │   └── MetricsPanel.jsx   # Performance metrics display
│       └── services/
│           └── api.js         # API client for backend communication
│
├── infra/
│   ├── docker-compose.yml     # Multi-container setup
│   └── nginx/
│       └── default.conf       # Nginx configuration
│
└── README.md                  # This file
```

## Features

- **3D Bloch Sphere Visualization**: Interactive 3D rendering of qubit states using Three.js
- **Quantum Circuit Editor**: Build quantum circuits with common gates (H, X, Y, Z, CNOT, etc.)
- **Real-time Simulation**: Connect to Qiskit backend for accurate quantum simulations
- **Path Animation**: Visualize the evolution of qubit states through quantum operations
- **Performance Metrics**: Track fidelity, distance, duration, and error rates
- **Dockerized Deployment**: Easy setup with Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.9+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bloch-path-explorer
   ```

2. Start the application:
   ```bash
   docker-compose -f infra/docker-compose.yml up --build
   ```

3. Open your browser and navigate to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Local Development

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend/app
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```bash
   python main.py
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/simulate` - Simulate a quantum circuit
- `POST /api/bloch-coordinates` - Convert statevector to Bloch coordinates
- `POST /api/generate-path` - Generate path between quantum states
- `POST /api/metrics` - Get performance metrics
- `GET /api/health` - Health check endpoint

## Technologies Used

### Backend
- **Flask**: Python web framework
- **Qiskit**: Quantum computing framework
- **NumPy**: Numerical computing

### Frontend
- **React**: UI framework
- **Three.js**: 3D graphics library
- **React Three Fiber**: React renderer for Three.js
- **Vite**: Build tool and dev server

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and static file serving

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Qiskit community for quantum computing tools
- Three.js community for 3D visualization
- React community for the excellent framework
