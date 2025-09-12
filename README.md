# 🌌 Multi-Qubit Bloch Sphere Explorer

> A next-generation quantum visualization platform that simulates **multi-qubit quantum circuits** and projects each qubit’s reduced density matrix onto **interactive, animated 3D Bloch spheres**.  
Built with **Flask + Qiskit (backend)** and **React + Three.js (frontend)**.

---

## 📖 Project Overview

This project is a **quantum circuit visualization tool** that:  
1. Accepts multi-qubit quantum circuits in text or editor format.  
2. Uses **Qiskit** to simulate the final quantum state.  
3. Applies **partial tracing** to compute each qubit’s reduced density matrix.  
4. Converts density matrices into **Bloch sphere coordinates**.  
5. Renders interactive **3D Bloch spheres** (React + Three.js).  
6. Provides **quantum metrics** (entropy, purity, fidelity, etc.).  

The system is designed to help researchers, students, and engineers **see quantum states evolve in real time**.

---

## ⚡ Core Features

- 🧮 **Circuit Simulation**
  - Gate parsing: H, X, Y, Z, S, T, RX, RY, RZ, CNOT, SWAP
  - Supports π notation (π, π/2, π/4, etc.)
  - Example circuits: Bell state, GHZ state, etc.

- 🔬 **Partial Tracing & Density Matrices**
  - Convert statevector → density matrix → reduced density matrix
  - Von Neumann entropy
  - Fidelity & purity calculations

- 🌐 **3D Visualization**
  - One Bloch sphere per qubit
  - Pure states → glowing surface point
  - Mixed states → particle clouds & opacity regions
  - Animated trails to show time evolution
  - Interactive camera (zoom, rotate, pan)

- 🎛️ **Modern UI**
  - Dark neon theme with smooth transitions
  - Gate buttons + text editor input
  - Metrics panel with live updates
  - Error handling and circuit validation

- 🐳 **Deployment Ready**
  - Full Docker setup
  - Nginx reverse proxy
  - Health-check endpoints

---

## 📂 Repository Structure

```
multi-qubit-bloch-explorer/
├── backend/                # Flask + Qiskit backend
│   ├── app/
│   │   ├── main.py         # Flask API server
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── sim/
│   │       ├── qiskit_sim.py
│   │       ├── partial_trace.py
│   │       └── utils.py
│
└── frontend/               # React + Three.js frontend
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── CircuitEditor.jsx
    │   │   ├── BlochSphere.jsx
    │   │   ├── Controls.jsx
    │   │   └── MetricsPanel.jsx
    │   └── services/api.js
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## 🛠️ Backend API Specification

### Endpoints
- `POST /api/simulate` → Simulate quantum circuit string  
- `POST /api/execute-qiskit` → Run raw Qiskit code  
- `GET /api/health` → Health check  

### Key Functions
- **Density Matrix → Bloch Coordinates**
- **Von Neumann Entropy Calculation**
- **Partial Tracing for Reduced Density Matrices**
- **Circuit String Parser**

---

## 🎨 Frontend Components

- **CircuitEditor.jsx**
  - Circuit builder with gate buttons
  - Text input for custom circuits
  - Example circuit presets

- **BlochSphere.jsx**
  - Renders interactive Bloch spheres
  - Supports pure and mixed states
  - Animated trails for state evolution

- **Controls.jsx**
  - Play, pause, reset animation
  - Step-through navigation
  - Speed control

- **MetricsPanel.jsx**
  - Displays entropy, purity, fidelity, entanglement

---

## 🔧 Installation & Setup

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/multi-qubit-bloch-explorer.git
cd multi-qubit-bloch-explorer
```

### 2. Backend Setup
```bash
cd backend/app
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Runs at: **http://localhost:5000**

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs at: **http://localhost:5173**

### 4. Docker Setup
```bash
docker-compose up --build
```
- Frontend → http://localhost  
- Backend API → http://localhost/api  

---

## 🧪 Testing

### Unit Tests
- Circuit parsing
- Partial tracing
- Density matrix math

### Integration Tests
- End-to-end simulation
- Error handling
- Performance on multi-qubit circuits

### Example Test Cases
```javascript
// Bell state: H0 CNOT(0,1)
// Expect both qubits mixed, entropy > 0

// Single qubit: H0
// Expect qubit 0 pure at (1,0,0)

// Rotation: RY(0,π/2)
// Expect qubit moves from Z axis → Y axis
```

---

## 📊 Example Circuits

| Circuit String  | Description   | Expected Bloch Sphere Result |
|-----------------|--------------|------------------------------|
| `H0`           | Hadamard      | Qubit 0 on X-axis           |
| `H0 CNOT(0,1)` | Bell state    | Both qubits mixed           |
| `RY(0,π/2)`    | Rotation      | Moves from Z → Y axis       |

---

## ✅ Success Criteria

1. Correctly simulate **multi-qubit circuits**
2. Compute **reduced density matrices**
3. Visualize **pure & mixed states** on Bloch spheres
4. Show **metrics**: entropy, fidelity, purity
5. Smooth animations & modern UI
6. Robust error handling
7. Dockerized for deployment

---

## 📜 License
MIT License © 2025 [Your Name]  

---

## 🌟 Acknowledgements
- [Qiskit](https://qiskit.org/)  
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)  
- [Framer Motion](https://www.framer.com/motion/)  
