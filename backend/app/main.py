from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import traceback

from qiskit.quantum_info import partial_trace

from sim.qiskit_sim import simulate_circuit, execute_qiskit_code
from sim.partial_trace import (
    calculate_von_neumann_entropy,
    calculate_purity,
    convert_density_matrix_to_bloch_coordinates,
)

app = FastAPI(
    title="Bloch Path Explorer API",
    description="FastAPI backend for multi-qubit circuit simulation and Bloch sphere projection with Qiskit",
    version="2.0.0",
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulateRequest(BaseModel):
    qasm_code: str = Field(..., description="OpenQASM 2.0 circuit string")
    num_qubits: int = Field(..., ge=1, le=10, description="Number of qubits in the circuit")
    qubits_to_trace_out: Optional[List[int]] = Field(default=[], description="Optional list of qubits to trace out")

class ExecuteQiskitRequest(BaseModel):
    raw_qiskit_code: str = Field(..., description="Raw Qiskit Python script")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI + Qiskit backend is running!"}

@app.post("/api/simulate")
async def simulate(payload: SimulateRequest):
    qasm_code = payload.qasm_code
    num_qubits = payload.num_qubits

    try:
        # Simulate circuit and retrieve step-by-step state snapshots
        state_snapshots = simulate_circuit(qasm_code)
        simulation_timeline = []

        for step_index, density_matrix in enumerate(state_snapshots):
            bloch_spheres_data = []

            for i in range(num_qubits):
                # Trace out all other qubits to calculate reduced density matrix for qubit i
                trace_out_for_qubit_i = [q for q in range(num_qubits) if q != i]

                if len(trace_out_for_qubit_i) == 0:
                    reduced_dm_for_qubit_i = density_matrix
                else:
                    reduced_dm_for_qubit_i = partial_trace(density_matrix, trace_out_for_qubit_i)

                bloch_coords = convert_density_matrix_to_bloch_coordinates(reduced_dm_for_qubit_i)
                entropy = calculate_von_neumann_entropy(reduced_dm_for_qubit_i)
                purity = calculate_purity(reduced_dm_for_qubit_i)

                bloch_spheres_data.append({
                    "qubit": int(i),
                    "bloch_coordinates": [float(x) for x in bloch_coords],
                    "entropy": float(entropy),
                    "purity": float(purity),
                    "is_pure": bool(purity > 0.999),
                })

            full_entropy = calculate_von_neumann_entropy(density_matrix)
            full_purity = calculate_purity(density_matrix)

            # Entanglement heuristic: mixed reduced subsystem when full state is pure
            is_entangled = False
            if num_qubits > 1:
                # If any individual qubit has non-zero entropy or purity < 0.99
                avg_entropy = sum(s["entropy"] for s in bloch_spheres_data) / num_qubits
                if avg_entropy > 0.05:
                    is_entangled = True

            dummy_fidelity = 1.0 - (step_index / max(1, len(state_snapshots)) * 0.5)

            metrics = {
                "full_system_entropy": float(full_entropy),
                "full_system_purity": float(full_purity),
                "fidelity": float(dummy_fidelity),
                "is_entangled": bool(is_entangled),
            }

            simulation_timeline.append({
                "step": int(step_index),
                "bloch_spheres": bloch_spheres_data,
                "metrics": metrics,
            })

        return {
            "simulation_timeline": simulation_timeline,
            "num_qubits": num_qubits,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}",
        )

@app.post("/api/execute-qiskit")
async def execute_qiskit(payload: ExecuteQiskitRequest):
    result = execute_qiskit_code(payload.raw_qiskit_code)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)