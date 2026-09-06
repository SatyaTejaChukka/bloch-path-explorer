// frontend/src/components/BlochSphere.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

// 3D Arrow component from origin to state vector
function StateVectorArrow({ target, color, radius }) {
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);
  const length = targetVec.length();

  return (
    <group>
      {/* Shaft */}
      <Line
        points={[[0, 0, 0], target]}
        color={color}
        lineWidth={3.5}
      />
      {/* State Point with glow */}
      <mesh position={target}>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function BlochSphereVisual({ qubitState, currentStep, simulationTimeline }) {
  // Get current qubit state data from timeline
  const currentQubitData = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) {
      return qubitState || null;
    }
    const snapshot = simulationTimeline[currentStep];
    if (!snapshot) return qubitState || null;
    return snapshot.bloch_spheres.find((s) => s.qubit === qubitState.qubit) || qubitState;
  }, [simulationTimeline, currentStep, qubitState]);

  // Coordinates [x, y, z]
  const statePosition = useMemo(() => {
    if (!currentQubitData || !currentQubitData.bloch_coordinates) {
      return [0, 0, 1]; // Default to ground state |0>
    }
    return currentQubitData.bloch_coordinates;
  }, [currentQubitData]);

  // Radius of Bloch vector
  const radius = useMemo(() => {
    if (currentQubitData?.radius !== undefined) return currentQubitData.radius;
    const [x, y, z] = statePosition;
    return Math.sqrt(x * x + y * y + z * z);
  }, [currentQubitData, statePosition]);

  const isPure = radius >= 0.98;

  // History trail of coordinates up to current step
  const trail = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length <= 1) return [];

    const points = [];
    for (let i = 0; i <= currentStep; i++) {
      const snapshot = simulationTimeline[i];
      if (snapshot) {
        const qData = snapshot.bloch_spheres.find((s) => s.qubit === qubitState.qubit);
        if (qData && qData.bloch_coordinates) {
          points.push(qData.bloch_coordinates);
        }
      }
    }
    return points;
  }, [simulationTimeline, currentStep, qubitState.qubit]);

  // Color palette based on qubit index & purity
  const baseColor = useMemo(() => {
    const qIndex = qubitState?.qubit || 0;
    if (!isPure) return '#B5179E'; // Mixed state purple
    switch (qIndex % 4) {
      case 0: return '#00F5D4'; // Cyan
      case 1: return '#FF4DA6'; // Magenta
      case 2: return '#FFD60A'; // Yellow
      default: return '#7209B7';
    }
  }, [qubitState?.qubit, isPure]);

  // Great circle rings (XY equator, XZ meridian, YZ meridian)
  const equatorCircle = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(angle), Math.sin(angle), 0]);
    }
    return pts;
  }, []);

  const xzCircle = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(angle), 0, Math.sin(angle)]);
    }
    return pts;
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 4]} intensity={1.2} />
      <pointLight position={[-4, -3, -4]} intensity={0.5} color="#00F5D4" />

      {/* Main Glass Bloch Sphere */}
      <Sphere args={[1, 36, 36]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#0D1117"
          transparent
          opacity={0.25}
          roughness={0.1}
          metalness={0.1}
          transmission={0.8}
          ior={1.2}
          reflectivity={0.5}
        />
      </Sphere>

      {/* Wireframe outline */}
      <Sphere args={[1, 18, 18]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#1F3A4B"
          wireframe
          transparent
          opacity={0.35}
        />
      </Sphere>

      {/* Interior Mixed-State Radius Ball (visible when state is mixed / r < 0.95) */}
      {!isPure && radius > 0.05 && (
        <Sphere args={[radius, 24, 24]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#7209B7"
            transparent
            opacity={0.3}
            roughness={0.5}
            emissive="#B5179E"
            emissiveIntensity={0.2}
          />
        </Sphere>
      )}

      {/* Coordinate Great Circles */}
      <Line points={equatorCircle} color="#00F5D4" lineWidth={1} transparent opacity={0.3} />
      <Line points={xzCircle} color="#7000FF" lineWidth={1} transparent opacity={0.25} />

      {/* 3D Coordinate Axes */}
      {/* X-axis (Red) */}
      <Line points={[[-1.25, 0, 0], [1.25, 0, 0]]} color="#EF4444" lineWidth={2} />
      {/* Y-axis (Green) */}
      <Line points={[[0, -1.25, 0], [0, 1.25, 0]]} color="#10B981" lineWidth={2} />
      {/* Z-axis (Blue / Standard Quantum Pole) */}
      <Line points={[[0, 0, -1.25], [0, 0, 1.25]]} color="#3B82F6" lineWidth={2.5} />

      {/* Quantum Pole Labels */}
      {/* North Pole |0⟩ at +Z */}
      <Html position={[0, 0, 1.35]} center distanceFactor={6}>
        <div className="bloch-label pole-z0">|0⟩</div>
      </Html>
      {/* South Pole |1⟩ at -Z */}
      <Html position={[0, 0, -1.35]} center distanceFactor={6}>
        <div className="bloch-label pole-z1">|1⟩</div>
      </Html>
      {/* +X Pole |+⟩ */}
      <Html position={[1.35, 0, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-x">|+⟩</div>
      </Html>
      {/* -X Pole |-⟩ */}
      <Html position={[-1.35, 0, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-x">|-⟩</div>
      </Html>
      {/* +Y Pole |+i⟩ */}
      <Html position={[0, 1.35, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-y">|+i⟩</div>
      </Html>
      {/* -Y Pole |-i⟩ */}
      <Html position={[0, -1.35, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-y">|-i⟩</div>
      </Html>

      {/* State Vector Arrow */}
      <StateVectorArrow
        target={statePosition}
        color={baseColor}
        radius={radius}
      />

      {/* Trajectory Trail */}
      {trail.length > 1 && (
        <Line
          points={trail}
          color={baseColor}
          lineWidth={2.5}
          dashed={false}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={1.8}
        maxDistance={5.0}
      />
    </>
  );
}

function BlochSphere({
  qubitState,
  currentStep = 0,
  simulationTimeline,
}) {
  const controlsRef = useRef(null);

  // Get current state data
  const currentQubitData = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return qubitState;
    const snapshot = simulationTimeline[currentStep];
    if (!snapshot) return qubitState;
    return snapshot.bloch_spheres?.find((s) => s.qubit === qubitState?.qubit) || qubitState;
  }, [simulationTimeline, currentStep, qubitState]);

  const coords = currentQubitData?.bloch_coordinates || [0, 0, 1];
  const radius = currentQubitData?.radius !== undefined
    ? currentQubitData.radius
    : Math.sqrt(coords[0] * coords[0] + coords[1] * coords[1] + coords[2] * coords[2]);

  const purity = currentQubitData?.purity !== undefined
    ? currentQubitData.purity
    : (1 + radius * radius) / 2;

  const entropy = currentQubitData?.entropy !== undefined ? currentQubitData.entropy : 0;
  const isPure = radius >= 0.98;

  // Quantum measurement probabilities
  const prob0 = currentQubitData?.prob0 !== undefined ? currentQubitData.prob0 : Math.max(0, (1 + coords[2]) / 2);
  const prob1 = currentQubitData?.prob1 !== undefined ? currentQubitData.prob1 : Math.max(0, (1 - coords[2]) / 2);

  return (
    <div className="bloch-card">
      <div className="bloch-card-header">
        <div className="qubit-title-group">
          <span className="qubit-pill">Qubit q{qubitState?.qubit ?? 0}</span>
          <span className={`state-tag ${isPure ? 'pure' : 'mixed'}`}>
            {isPure ? '● Pure State' : '◐ Mixed / Entangled'}
          </span>
        </div>
        <div className="purity-badge" title="Purity = Tr(ρ²)">
          Purity: <strong>{(purity * 100).toFixed(1)}%</strong>
        </div>
      </div>

      <div className="bloch-canvas-container">
        <Canvas camera={{ position: [2.2, 1.8, 2.2], fov: 50 }}>
          <BlochSphereVisual
            qubitState={qubitState}
            currentStep={currentStep}
            simulationTimeline={simulationTimeline}
          />
        </Canvas>
        <div className="canvas-instruction-hint">Drag to rotate • Scroll to zoom</div>
      </div>

      <div className="bloch-card-metrics">
        <div className="bloch-coord-row">
          <span className="coord-chip x-chip">X: {coords[0]?.toFixed(3)}</span>
          <span className="coord-chip y-chip">Y: {coords[1]?.toFixed(3)}</span>
          <span className="coord-chip z-chip">Z: {coords[2]?.toFixed(3)}</span>
          <span className="coord-chip r-chip">|r|: {radius?.toFixed(3)}</span>
        </div>

        <div className="bloch-probs-row">
          <div className="prob-item">
            <span className="prob-label">P(|0⟩):</span>
            <div className="prob-bar-track">
              <div className="prob-bar-fill zero-fill" style={{ width: `${(prob0 * 100).toFixed(1)}%` }} />
            </div>
            <span className="prob-val">{(prob0 * 100).toFixed(0)}%</span>
          </div>

          <div className="prob-item">
            <span className="prob-label">P(|1⟩):</span>
            <div className="prob-bar-track">
              <div className="prob-bar-fill one-fill" style={{ width: `${(prob1 * 100).toFixed(1)}%` }} />
            </div>
            <span className="prob-val">{(prob1 * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="bloch-footer-stats">
          <span>Entropy: <strong>{entropy?.toFixed(3)} bits</strong></span>
          <span>{isPure ? 'On Sphere Surface (r = 1)' : 'Inside Bloch Ball (r < 1)'}</span>
        </div>
      </div>
    </div>
  );
}

export default BlochSphere;
