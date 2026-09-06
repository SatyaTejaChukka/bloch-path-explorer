# 🌌 Bloch Path Explorer

> An interactive, high-precision quantum visualization platform that simulates **multi-qubit quantum circuits** and projects reduced density matrices onto **animated, interactive 3D Bloch spheres** with live entropy, purity, and entanglement metrics.

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.179-black?logo=three.js)](https://threejs.org/)
[![Qiskit](https://img.shields.io/badge/Qiskit-1.0+-6929C4?logo=qiskit&logoColor=white)](https://qiskit.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📖 Highlights & Capabilities

- ⚛️ **High-Precision Quantum Simulation (Hybrid Engine)**:
  - **In-Browser Engine (Default)**: Instant, zero-server statevector simulation for 1–5 qubits with **0ms latency, zero cold-starts, and 100% offline support**.
  - **Remote Qiskit Backend**: Seamless 1-click toggle to connect to a Python/Qiskit server for advanced hardware-level execution.
- 🌐 **Interactive 3D Bloch Spheres**:
  - Rendered with Three.js & React Three Fiber.
  - Labeled quantum poles: $|0\rangle, |1\rangle, |+\rangle, |-\rangle, |+i\rangle, |-i\rangle$.
  - 3D coordinate axes and Great Circles.
  - **Pure states** sit on the sphere surface ($|\vec{r}| = 1$); **entangled/mixed states** move inside the sphere ($|\vec{r}| < 1$) with dynamic interior density indicators.
  - Trajectory trails trace quantum state evolution over time.
- 🎛️ **Modern Quantum Circuit Designer**:
  - Drag-and-drop & click-to-place gate palette ($H, X, Y, Z, S, T, RX, RY, RZ, CNOT, CZ, SWAP$).
  - Arbitrary control & target selection for multi-qubit gates.
  - Dual-mode: Visual Circuit Canvas + Live **OpenQASM 2.0** Code Editor.
  - 1-click presets: *Bell State ($|\Phi^+\rangle$)*, *3-Qubit GHZ State*, *Bloch Rotations*, *Superdense Coding*, *Teleportation Prep*.
- 📊 **Real-Time Quantum Metrics Dashboard**:
  - Entanglement detection (identifying inseparable states).
  - Computational basis probability distribution histograms ($P(|00\rangle), P(|01\rangle), \dots$).
  - Per-qubit Von Neumann entropy, purity ($\text{Tr}(\rho^2)$), and Bloch coordinate breakdowns.
- ⏯️ **Playback Timeline & Scrubber**:
  - Play, pause, step forward, step backward, scrubber slider, variable speed (0.5x–2x), and auto-looping.

---

## 🚀 Free Deployment Guide

### Option 1: Frontend Static Hosting (100% Free Forever) — *Recommended*

Because the project includes an in-browser quantum engine, the frontend can be deployed completely free without paying for any backend servers!

#### Deploy to Vercel
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Build settings will automatically detect Vite:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click **Deploy**. Your site will be live on a global CDN with free SSL!

#### Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com/) and click **"Add new site" > "Import an existing project"**.
2. Select your GitHub repository.
3. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Click **Deploy**.

#### Deploy to Cloudflare Pages
1. Go to Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages**.
2. Connect your GitHub repository.
3. Set **Framework preset** to `Vite`, root directory to `frontend`, output directory to `dist`.
4. Click **Save and Deploy**.

---

### Option 2: Full-Stack (Backend + Frontend)

If you also wish to deploy the Python FastAPI + Qiskit backend:

#### Deploy Backend to Render (Free Web Service)
1. Go to [Render](https://render.com/) and create a free account.
2. Click **New > Web Service** and connect this repository.
3. Render will auto-detect the root `render.yaml` blueprint, or configure manually:
   - **Root Directory**: `backend/app`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
   - **Plan**: `Free`
4. Once deployed, copy your Render URL (e.g. `https://bloch-explorer-backend.onrender.com`).
5. In your frontend deployment (Vercel/Netlify), add an environment variable:
   ```env
   VITE_API_URL=https://bloch-explorer-backend.onrender.com/api
   ```

#### Deploy Backend to Hugging Face Spaces (Free Tier)
1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/spaces).
2. Choose **Docker** as the SDK.
3. Push the contents of `backend/app/` to the Space.
4. Use the generated Space URL as your `VITE_API_URL`.

---

## 💻 Local Development

### 1. Prerequisites
- Node.js (v18+)
- Python 3.9+ (optional, only needed for local Qiskit backend)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser. The app runs immediately using the built-in browser quantum engine!

### 3. Backend Setup (Optional)
```bash
cd backend/app
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Backend runs at: **http://localhost:5000**

### 4. Docker Compose
To run both backend and frontend together locally:
```bash
docker-compose up --build
```
- Frontend: `http://localhost`
- Backend: `http://localhost/api`

---

## 📐 Mathematical Foundations

### Single Qubit Bloch Representation
Any single-qubit density matrix $\rho$ can be expressed in terms of Pauli matrices $\vec{\sigma} = (\sigma_x, \sigma_y, \sigma_z)$:
$$\rho = \frac{1}{2} \left( I + \vec{r} \cdot \vec{\sigma} \right)$$
Where the Bloch vector components are given by Pauli expectation values:
$$x = \text{Tr}(\rho \sigma_x) = 2 \text{Re}(\rho_{01})$$
$$y = \text{Tr}(\rho \sigma_y) = -2 \text{Im}(\rho_{01})$$
$$z = \text{Tr}(\rho \sigma_z) = \rho_{00} - \rho_{11}$$

### Partial Trace for Multi-Qubit Systems
For an $N$-qubit state $|\psi\rangle$, the reduced density matrix of qubit $A$ is obtained by tracing out all other qubits $B$:
$$\rho_A = \text{Tr}_B(|\psi\rangle\langle\psi|)$$

### Purity & Von Neumann Entropy
- **Purity**: $\gamma = \text{Tr}(\rho_A^2) = \frac{1 + |\vec{r}|^2}{2} \in [0.5, 1.0]$
- **Von Neumann Entropy**: $S(\rho_A) = -\text{Tr}(\rho_A \log_2 \rho_A)$
  - Pure unentangled state: $S = 0$, $|\vec{r}| = 1$
  - Maximally entangled state (e.g. Bell pair): $S = 1.0$, $|\vec{r}| = 0$

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
