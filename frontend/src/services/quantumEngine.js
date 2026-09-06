// frontend/src/services/quantumEngine.js
/**
 * In-Browser Quantum Simulation Engine
 * 
 * Supports:
 * - 1 to 5 qubits statevector evolution
 * - Gates: H, X, Y, Z, S, T, RX(θ), RY(θ), RZ(θ), CNOT (any control & target), CZ, SWAP
 * - Exact reduced density matrices via partial trace
 * - Exact Bloch sphere coordinates (x, y, z) and spherical angles (theta, phi)
 * - Von Neumann entropy and state purity (Tr(rho^2))
 * - Global quantum metrics: entanglement detection, fidelity, basis state probabilities
 */

// Complex number utilities
export class Complex {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }

  static fromPolar(r, theta) {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }

  add(c) {
    return new Complex(this.re + c.re, this.im + c.im);
  }

  sub(c) {
    return new Complex(this.re - c.re, this.im - c.im);
  }

  mul(c) {
    if (typeof c === 'number') {
      return new Complex(this.re * c, this.im * c);
    }
    return new Complex(
      this.re * c.re - this.im * c.im,
      this.re * c.im + this.im * c.re
    );
  }

  conj() {
    return new Complex(this.re, -this.im);
  }

  abs2() {
    return this.re * this.re + this.im * this.im;
  }

  abs() {
    return Math.hypot(this.re, this.im);
  }
}

const SQRT1_2 = Math.SQRT1_2;

// Matrix definitions for standard 1-qubit gates
const GATE_MATRICES = {
  H: [
    [new Complex(SQRT1_2, 0), new Complex(SQRT1_2, 0)],
    [new Complex(SQRT1_2, 0), new Complex(-SQRT1_2, 0)]
  ],
  X: [
    [new Complex(0, 0), new Complex(1, 0)],
    [new Complex(1, 0), new Complex(0, 0)]
  ],
  Y: [
    [new Complex(0, 0), new Complex(0, -1)],
    [new Complex(0, 1), new Complex(0, 0)]
  ],
  Z: [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(-1, 0)]
  ],
  S: [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 1)]
  ],
  T: [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]
  ]
};

function getRotationMatrix(gateName, theta) {
  const half = theta / 2;
  const c = Math.cos(half);
  const s = Math.sin(half);

  if (gateName === 'RX') {
    // [ [cos(t/2), -i sin(t/2)], [-i sin(t/2), cos(t/2)] ]
    return [
      [new Complex(c, 0), new Complex(0, -s)],
      [new Complex(0, -s), new Complex(c, 0)]
    ];
  } else if (gateName === 'RY') {
    // [ [cos(t/2), -sin(t/2)], [sin(t/2), cos(t/2)] ]
    return [
      [new Complex(c, 0), new Complex(-s, 0)],
      [new Complex(s, 0), new Complex(c, 0)]
    ];
  } else if (gateName === 'RZ') {
    // [ [e^(-i t/2), 0], [0, e^(i t/2)] ]
    return [
      [new Complex(Math.cos(-half), Math.sin(-half)), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(Math.cos(half), Math.sin(half))]
    ];
  }
  return GATE_MATRICES.H;
}

/**
 * Applies a 1-qubit gate matrix to the system statevector.
 */
function applySingleQubitGate(state, targetQubit, matrix, numQubits) {
  const dim = 1 << numQubits;
  const newState = new Array(dim);
  const bitMask = 1 << targetQubit;

  for (let i = 0; i < dim; i++) {
    if ((i & bitMask) === 0) {
      const i0 = i;
      const i1 = i | bitMask;
      const v0 = state[i0];
      const v1 = state[i1];

      // [ [m00, m01], [m10, m11] ] * [v0, v1]
      newState[i0] = matrix[0][0].mul(v0).add(matrix[0][1].mul(v1));
      newState[i1] = matrix[1][0].mul(v0).add(matrix[1][1].mul(v1));
    }
  }
  return newState;
}

/**
 * Applies a CNOT gate with arbitrary control and target qubits.
 */
function applyCNOT(state, controlQubit, targetQubit, numQubits) {
  const dim = 1 << numQubits;
  const newState = [...state];
  const controlMask = 1 << controlQubit;
  const targetMask = 1 << targetQubit;

  for (let i = 0; i < dim; i++) {
    // When control bit is 1 and target bit is 0, swap amplitude with target bit 1
    if ((i & controlMask) !== 0 && (i & targetMask) === 0) {
      const iTarget1 = i | targetMask;
      const temp = newState[i];
      newState[i] = newState[iTarget1];
      newState[iTarget1] = temp;
    }
  }
  return newState;
}

/**
 * Applies a CZ gate with arbitrary control and target qubits.
 */
function applyCZ(state, controlQubit, targetQubit, numQubits) {
  const dim = 1 << numQubits;
  const newState = [...state];
  const mask = (1 << controlQubit) | (1 << targetQubit);

  for (let i = 0; i < dim; i++) {
    if ((i & mask) === mask) {
      newState[i] = newState[i].mul(-1);
    }
  }
  return newState;
}

/**
 * Applies a SWAP gate between qubit1 and qubit2.
 */
function applySWAP(state, q1, q2, numQubits) {
  const dim = 1 << numQubits;
  const newState = [...state];
  const mask1 = 1 << q1;
  const mask2 = 1 << q2;

  for (let i = 0; i < dim; i++) {
    const bit1 = (i & mask1) !== 0;
    const bit2 = (i & mask2) !== 0;
    if (bit1 && !bit2) {
      const swappedIndex = (i ^ mask1) | mask2;
      const temp = newState[i];
      newState[i] = newState[swappedIndex];
      newState[swappedIndex] = temp;
    }
  }
  return newState;
}

/**
 * Computes the reduced density matrix rho_i for a given single qubit i from the global pure statevector.
 * 
 * rho_i = Tr_{all except i}(|psi><psi|)
 * 
 * rho_i = [ [rho00, rho01], [rho10, rho11] ]
 */
function getReducedDensityMatrix(state, qubitIndex, numQubits) {
  const dim = 1 << numQubits;
  const bitMask = 1 << qubitIndex;

  let rho00 = 0;
  let rho11 = 0;
  let rho01Re = 0;
  let rho01Im = 0;

  for (let k = 0; k < dim; k++) {
    if ((k & bitMask) === 0) {
      const k0 = k;
      const k1 = k | bitMask;
      const a0 = state[k0];
      const a1 = state[k1];

      rho00 += a0.abs2();
      rho11 += a1.abs2();

      // a0 * a1* = (re0 + i im0)(re1 - i im1) = (re0*re1 + im0*im1) + i(im0*re1 - re0*im1)
      rho01Re += a0.re * a1.re + a0.im * a1.im;
      rho01Im += a0.im * a1.re - a0.re * a1.im;
    }
  }

  return {
    rho00,
    rho11,
    rho01: new Complex(rho01Re, rho01Im),
    rho10: new Complex(rho01Re, -rho01Im)
  };
}

/**
 * Converts a 2x2 reduced density matrix into Bloch sphere coordinates (x, y, z),
 * purity, and Von Neumann entropy.
 */
function densityMatrixToBloch(rho) {
  // Pauli-X: Tr(rho * sigma_x) = 2 * Re(rho01)
  const x = 2 * rho.rho01.re;

  // Pauli-Y: Tr(rho * sigma_y) = -2 * Im(rho01)
  const y = -2 * rho.rho01.im;

  // Pauli-Z: Tr(rho * sigma_z) = rho00 - rho11
  const z = rho.rho00 - rho.rho11;

  // Bloch vector length r
  const r2 = x * x + y * y + z * z;
  const r = Math.min(1.0, Math.sqrt(Math.max(0, r2)));

  // Purity = Tr(rho^2) = (1 + r^2) / 2
  const purity = (1 + r * r) / 2;
  const isPure = r >= 0.995;

  // Eigenvalues: lambda_1,2 = (1 +/- r) / 2
  const l1 = (1 + r) / 2;
  const l2 = (1 - r) / 2;

  // Von Neumann entropy S = - sum(l_i * log2(l_i))
  let entropy = 0;
  if (l1 > 1e-10 && l1 < 0.9999999) {
    entropy -= l1 * Math.log2(l1);
  }
  if (l2 > 1e-10) {
    entropy -= l2 * Math.log2(l2);
  }
  entropy = Math.max(0, entropy);

  // Spherical angles
  // theta: polar angle from +z axis [0, pi]
  const theta = Math.acos(Math.max(-1, Math.min(1, r > 1e-6 ? z / r : 0)));
  // phi: azimuthal angle in xy plane [0, 2pi]
  let phi = Math.atan2(y, x);
  if (phi < 0) phi += 2 * Math.PI;

  return {
    coordinates: [Number(x.toFixed(5)), Number(y.toFixed(5)), Number(z.toFixed(5))],
    radius: Number(r.toFixed(5)),
    entropy: Number(entropy.toFixed(4)),
    purity: Number(purity.toFixed(4)),
    is_pure: isPure,
    theta: Number(theta.toFixed(4)),
    phi: Number(phi.toFixed(4)),
    prob0: Number(Math.max(0, Math.min(1, rho.rho00)).toFixed(4)),
    prob1: Number(Math.max(0, Math.min(1, rho.rho11)).toFixed(4))
  };
}

/**
 * Computes basis state probabilities for the full quantum statevector.
 */
function getBasisProbabilities(state, numQubits) {
  const dim = 1 << numQubits;
  const probs = [];
  for (let i = 0; i < dim; i++) {
    const p = state[i].abs2();
    if (p > 0.0001 || dim <= 8) {
      const binary = i.toString(2).padStart(numQubits, '0');
      probs.push({
        state: `|${binary}⟩`,
        probability: Number(p.toFixed(4)),
        percentage: Number((p * 100).toFixed(1))
      });
    }
  }
  return probs;
}

/**
 * Simulates a quantum circuit given a list of gates and returns step-by-step snapshots.
 * 
 * @param {Array} gates - Array of gate objects: { name, qubit, target, time, param }
 * @param {number} numQubits - Number of qubits (1 to 5)
 * @returns {Object} Simulation timeline matching backend API schema
 */
export function simulateCircuitClient(gates, numQubits) {
  const dim = 1 << numQubits;

  // Initial state |0...0>
  let currentState = new Array(dim);
  for (let i = 0; i < dim; i++) {
    currentState[i] = new Complex(i === 0 ? 1 : 0, 0);
  }

  // Sort gates strictly by time step, then by qubit
  const sortedGates = [...gates].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.qubit - b.qubit;
  });

  const timeline = [];

  // Helper to record a snapshot of the current state
  const recordSnapshot = (stepIndex, gateLabel = 'Initial State') => {
    const blochSpheres = [];
    let sumSubsystemEntropy = 0;
    let minPurity = 1.0;

    for (let q = 0; q < numQubits; q++) {
      const rho = getReducedDensityMatrix(currentState, q, numQubits);
      const bloch = densityMatrixToBloch(rho);

      sumSubsystemEntropy += bloch.entropy;
      if (bloch.purity < minPurity) minPurity = bloch.purity;

      blochSpheres.push({
        qubit: q,
        bloch_coordinates: bloch.coordinates,
        radius: bloch.radius,
        entropy: bloch.entropy,
        purity: bloch.purity,
        is_pure: bloch.is_pure,
        theta: bloch.theta,
        phi: bloch.phi,
        prob0: bloch.prob0,
        prob1: bloch.prob1
      });
    }

    // Entanglement criterion for pure states:
    // Any subsystem having non-zero Von Neumann entropy (or purity < 0.99) implies entanglement!
    const isEntangled = numQubits > 1 && (sumSubsystemEntropy > 0.05 || minPurity < 0.95);

    // Fidelity with initial ground state |0...0>
    const groundFidelity = currentState[0].abs2();

    const basisProbabilities = getBasisProbabilities(currentState, numQubits);

    timeline.push({
      step: stepIndex,
      gateLabel,
      bloch_spheres: blochSpheres,
      metrics: {
        full_system_entropy: 0.0, // Pure statevector always has 0 global entropy
        full_system_purity: 1.0,  // Pure statevector has purity 1.0
        fidelity: Number(groundFidelity.toFixed(4)),
        is_entangled: isEntangled,
        average_subsystem_entropy: Number((sumSubsystemEntropy / numQubits).toFixed(4)),
        basis_probabilities: basisProbabilities
      }
    });
  };

  // Step 0: Snapshot before any gates
  recordSnapshot(0, 'Initial State |0...0⟩');

  // Apply each gate in sequence
  sortedGates.forEach((gate, idx) => {
    const name = (gate.name || '').toUpperCase();
    const q = gate.qubit;
    const targetQ = gate.target !== undefined ? gate.target : (q + 1) % numQubits;
    const param = gate.param || Math.PI / 2;

    let gateDescription = `${name} on q${q}`;

    if (name === 'CNOT' || name === 'CX') {
      currentState = applyCNOT(currentState, q, targetQ, numQubits);
      gateDescription = `CNOT (Control: q${q} → Target: q${targetQ})`;
    } else if (name === 'CZ') {
      currentState = applyCZ(currentState, q, targetQ, numQubits);
      gateDescription = `CZ (Control: q${q}, Target: q${targetQ})`;
    } else if (name === 'SWAP') {
      currentState = applySWAP(currentState, q, targetQ, numQubits);
      gateDescription = `SWAP (q${q} ↔ q${targetQ})`;
    } else if (['RX', 'RY', 'RZ'].includes(name)) {
      const mat = getRotationMatrix(name, param);
      currentState = applySingleQubitGate(currentState, q, mat, numQubits);
      gateDescription = `${name}(${(param / Math.PI).toFixed(2)}π) on q${q}`;
    } else if (GATE_MATRICES[name]) {
      const mat = GATE_MATRICES[name];
      currentState = applySingleQubitGate(currentState, q, mat, numQubits);
      gateDescription = `${name} on q${q}`;
    }

    recordSnapshot(idx + 1, gateDescription);
  });

  return {
    simulation_timeline: timeline,
    num_qubits: numQubits,
    engine: 'client-js'
  };
}

/**
 * Parses simple QASM string and simulates it using the client engine.
 */
export function simulateQasmClient(qasmString, numQubits) {
  const gates = [];
  const lines = qasmString.split('\n');
  let timeStep = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('OPENQASM') || line.startsWith('include') || line.startsWith('qreg') || line.startsWith('creg')) {
      continue;
    }

    // Match CNOT / CX: cx q[0],q[1]; or cnot q[0], q[1];
    const cxMatch = line.match(/(?:cx|cnot)\s+q\[(\d+)\],\s*q\[(\d+)\]/i);
    if (cxMatch) {
      gates.push({
        name: 'CNOT',
        qubit: parseInt(cxMatch[1], 10),
        target: parseInt(cxMatch[2], 10),
        time: timeStep++
      });
      continue;
    }

    // Match SWAP: swap q[0], q[1];
    const swapMatch = line.match(/swap\s+q\[(\d+)\],\s*q\[(\d+)\]/i);
    if (swapMatch) {
      gates.push({
        name: 'SWAP',
        qubit: parseInt(swapMatch[1], 10),
        target: parseInt(swapMatch[2], 10),
        time: timeStep++
      });
      continue;
    }

    // Match rotation: rx(pi/2) q[0]; or ry(1.57) q[0];
    const rotMatch = line.match(/(rx|ry|rz)\s*\(([^)]+)\)\s+q\[(\d+)\]/i);
    if (rotMatch) {
      const name = rotMatch[1].toUpperCase();
      let paramStr = rotMatch[2].trim().toLowerCase();
      let param = Math.PI / 2;
      try {
        if (paramStr.includes('pi')) {
          paramStr = paramStr.replace(/pi/g, Math.PI.toString());
        }
        // eslint-disable-next-line no-eval
        param = Function(`"use strict"; return (${paramStr})`)();
      } catch (e) {
        param = Math.PI / 2;
      }
      gates.push({
        name,
        qubit: parseInt(rotMatch[3], 10),
        param,
        time: timeStep++
      });
      continue;
    }

    // Match single qubit standard gate: h q[0]; x q[1]; etc.
    const singleMatch = line.match(/([a-z]+)\s+q\[(\d+)\]/i);
    if (singleMatch) {
      const name = singleMatch[1].toUpperCase();
      const qubit = parseInt(singleMatch[2], 10);
      if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(name)) {
        gates.push({
          name,
          qubit,
          time: timeStep++
        });
      }
    }
  }

  return simulateCircuitClient(gates, numQubits);
}
