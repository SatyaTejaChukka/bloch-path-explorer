// frontend/src/components/BlochSphere.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html, Trail, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const UP_VECTOR = new THREE.Vector3(0, 1, 0);

/**
 * Spherical Linear Interpolation (SLERP) + Radial Lerp with cubic easing.
 * Computes physically continuous, ultra-smooth motion on the Bloch sphere surface or interior.
 */
export function interpolateBlochPosition(p1, p2, rawProgress) {
  if (!p1 || !p2) return p1 ? [...p1] : [0, 0, 1];

  const t = Math.max(0, Math.min(1, rawProgress));
  // Smooth cubic ease (physical acceleration & deceleration)
  const s = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);

  const r1 = v1.length();
  const r2 = v2.length();
  const r = (1 - s) * r1 + s * r2;

  // Direct lerp if passing near origin (e.g. entangled mixed state)
  if (r1 < 0.05 || r2 < 0.05) {
    const direct = v1.clone().lerp(v2, s);
    return [direct.x, direct.y, direct.z];
  }

  const u1 = v1.clone().normalize();
  const u2 = v2.clone().normalize();

  const dot = Math.max(-1, Math.min(1, u1.dot(u2)));
  const omega = Math.acos(dot);

  if (omega < 0.001) {
    const lerped = u1.clone().lerp(u2, s).normalize().multiplyScalar(r);
    return [lerped.x, lerped.y, lerped.z];
  }

  const sinOmega = Math.sin(omega);
  const scale1 = Math.sin((1 - s) * omega) / sinOmega;
  const scale2 = Math.sin(s * omega) / sinOmega;

  const result = u1.multiplyScalar(scale1).add(u2.multiplyScalar(scale2)).normalize().multiplyScalar(r);
  return [result.x, result.y, result.z];
}

/**
 * Precomputes smooth curved geodesic path coordinates across the entire simulation.
 */
function precomputeFullPath(timeline, qubitIndex) {
  if (!timeline || timeline.length <= 1) return [];

  const points = [];
  const SAMPLES_PER_STEP = 16;
  const coordsList = timeline.map((s) => {
    const q = s.bloch_spheres?.find((item) => item.qubit === qubitIndex);
    return q?.bloch_coordinates || [0, 0, 1];
  });

  for (let step = 0; step < coordsList.length - 1; step++) {
    const pA = coordsList[step];
    const pB = coordsList[step + 1];
    for (let i = 0; i <= SAMPLES_PER_STEP; i++) {
      const frac = i / SAMPLES_PER_STEP;
      points.push(interpolateBlochPosition(pA, pB, frac));
    }
  }

  return points;
}

/**
 * High-Performance Smooth 60 FPS Visual Canvas Component.
 * Animates smoothly via GPU render loop without causing React DOM re-renders.
 */
function BlochSphereVisual({
  qubitState,
  currentStep = 0,
  playbackSpeed = 1,
  simulationTimeline
}) {
  const maxStep = Math.max(0, (simulationTimeline?.length || 1) - 1);

  // Extract all coordinates for this qubit across the timeline
  const timelineCoords = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return [[0, 0, 1]];
    return simulationTimeline.map((s) => {
      const q = s.bloch_spheres?.find((item) => item.qubit === qubitState?.qubit);
      return q?.bloch_coordinates || [0, 0, 1];
    });
  }, [simulationTimeline, qubitState?.qubit]);

  // Precomputed full geodesic trajectory path
  const fullPathPoints = useMemo(() => {
    return precomputeFullPath(simulationTimeline, qubitState?.qubit ?? 0);
  }, [simulationTimeline, qubitState?.qubit]);

  // Color palette based on qubit index
  const baseColor = useMemo(() => {
    const qIndex = qubitState?.qubit || 0;
    switch (qIndex % 4) {
      case 0: return '#00F5D4'; // Vibrant Cyan
      case 1: return '#FF4DA6'; // Neon Magenta
      case 2: return '#FFD60A'; // Electric Yellow
      default: return '#7209B7';
    }
  }, [qubitState?.qubit]);

  const threeColor = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  // Three.js direct mesh references (animated without React reconciliation)
  const orbGroupRef = useRef(null);
  const coreMatRef = useRef(null);
  const coronaMeshRef = useRef(null);
  const shaftMeshRef = useRef(null);
  const innerMixedBallRef = useRef(null);

  // Continuous physics interpolation state (damped on GPU at 60 FPS)
  const currentProgressRef = useRef(currentStep);
  const prevPosRef = useRef(new THREE.Vector3(...(timelineCoords[currentStep] || [0, 0, 1])));
  const velocityRef = useRef(new THREE.Vector3());
  const speedRef = useRef(0);

  // Main 60-120 FPS WebGL Render Loop
  useFrame((state, delta) => {
    if (!orbGroupRef.current || timelineCoords.length === 0) return;

    // Damping factor scaled by playbackSpeed (silky smooth exponential damping)
    const dampLambda = 4.5 * Math.max(0.6, playbackSpeed);
    currentProgressRef.current = THREE.MathUtils.damp(
      currentProgressRef.current,
      currentStep,
      dampLambda,
      delta
    );

    const prog = currentProgressRef.current;
    let pos;

    if (prog <= 0) {
      pos = timelineCoords[0];
    } else if (prog >= maxStep) {
      pos = timelineCoords[maxStep];
    } else {
      const idx = Math.min(timelineCoords.length - 2, Math.floor(prog));
      const subProg = prog - idx;
      pos = interpolateBlochPosition(timelineCoords[idx], timelineCoords[idx + 1], subProg);
    }

    const currentV = new THREE.Vector3(...pos);
    const radius = currentV.length();

    // 1. Update Orb Position
    orbGroupRef.current.position.copy(currentV);

    // 2. Instantaneous Velocity & Motion Detection
    if (delta > 0 && delta < 0.1) {
      const v = currentV.clone().sub(prevPosRef.current).divideScalar(delta);
      velocityRef.current.copy(v);
      const instantSpeed = v.length();
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, instantSpeed, 0.25);
      prevPosRef.current.copy(currentV);
    }

    const speed = speedRef.current;

    // 3. Corona Flare & Relativistic Velocity Stretch
    if (coronaMeshRef.current) {
      if (speed > 0.12) {
        // Stretch along motion direction
        const vDir = velocityRef.current.clone().normalize();
        coronaMeshRef.current.quaternion.setFromUnitVectors(UP_VECTOR, vDir);
        const stretch = 1 + Math.min(1.5, speed * 0.7);
        const squash = 1 / Math.sqrt(stretch);
        coronaMeshRef.current.scale.set(squash, stretch, squash);
      } else {
        // Idle breathing pulse
        const pulse = 1 + 0.08 * Math.sin(state.clock.elapsedTime * 4.5);
        coronaMeshRef.current.scale.set(pulse, pulse, pulse);
        coronaMeshRef.current.rotation.y += delta * 0.4;
      }
    }

    // 4. Boost core luminescence during movement
    if (coreMatRef.current) {
      const boost = 1.3 + Math.min(2.5, speed * 0.9);
      coreMatRef.current.emissiveIntensity = boost;
    }

    // 5. Update State Vector Laser Shaft (Oriented & Scaled without geometry reallocation)
    if (shaftMeshRef.current) {
      shaftMeshRef.current.position.set(currentV.x / 2, currentV.y / 2, currentV.z / 2);
      shaftMeshRef.current.scale.set(1, Math.max(0.001, radius), 1);
      if (radius > 0.01) {
        const dir = currentV.clone().normalize();
        shaftMeshRef.current.quaternion.setFromUnitVectors(UP_VECTOR, dir);
      }
    }

    // 6. Update Interior Mixed-State Ball Radius
    if (innerMixedBallRef.current) {
      const isMixed = radius < 0.96;
      if (isMixed && radius > 0.04) {
        innerMixedBallRef.current.visible = true;
        innerMixedBallRef.current.scale.set(radius, radius, radius);
      } else {
        innerMixedBallRef.current.visible = false;
      }
    }
  });

  // Great circles for spatial orientation
  const equatorCircle = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(a), Math.sin(a), 0]);
    }
    return pts;
  }, []);

  const xzCircle = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(a), 0, Math.sin(a)]);
    }
    return pts;
  }, []);

  return (
    <>
      {/* Studio Lighting */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 5, 4]} intensity={1.3} />
      <pointLight position={[-4, -3, -4]} intensity={0.6} color="#00F5D4" />
      <pointLight position={[0, 0, 0]} intensity={0.4} color={baseColor} />

      {/* Quantum Vacuum Ambient Stardust */}
      <Sparkles
        count={35}
        scale={2.5}
        size={2.4}
        speed={0.3}
        opacity={0.35}
        color={baseColor}
      />

      {/* Glass Bloch Sphere */}
      <Sphere args={[1, 36, 36]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#0D1117"
          transparent
          opacity={0.22}
          roughness={0.1}
          metalness={0.1}
          transmission={0.8}
          ior={1.2}
          reflectivity={0.6}
        />
      </Sphere>

      {/* Wireframe Shell */}
      <Sphere args={[1, 18, 18]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#1F3A4B"
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Dynamic Interior Mixed-State Ball */}
      <mesh ref={innerMixedBallRef} position={[0, 0, 0]} visible={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#7209B7"
          transparent
          opacity={0.28}
          roughness={0.4}
          emissive="#B5179E"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Great Circle Navigation Rings */}
      <Line points={equatorCircle} color="#00F5D4" lineWidth={1} transparent opacity={0.25} />
      <Line points={xzCircle} color="#7000FF" lineWidth={1} transparent opacity={0.2} />

      {/* 3D Coordinate Axes */}
      <Line points={[[-1.25, 0, 0], [1.25, 0, 0]]} color="#EF4444" lineWidth={2} />
      <Line points={[[0, -1.25, 0], [0, 1.25, 0]]} color="#10B981" lineWidth={2} />
      <Line points={[[0, 0, -1.25], [0, 0, 1.25]]} color="#3B82F6" lineWidth={2.5} />

      {/* Labeled Quantum Poles */}
      <Html position={[0, 0, 1.35]} center distanceFactor={6}>
        <div className="bloch-label pole-z0">|0⟩</div>
      </Html>
      <Html position={[0, 0, -1.35]} center distanceFactor={6}>
        <div className="bloch-label pole-z1">|1⟩</div>
      </Html>
      <Html position={[1.35, 0, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-x">|+⟩</div>
      </Html>
      <Html position={[-1.35, 0, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-x">|-⟩</div>
      </Html>
      <Html position={[0, 1.35, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-y">|+i⟩</div>
      </Html>
      <Html position={[0, -1.35, 0]} center distanceFactor={6}>
        <div className="bloch-label pole-y">|-i⟩</div>
      </Html>

      {/* Precomputed Full Geodesic Trajectory Ribbon Guide */}
      {fullPathPoints.length > 1 && (
        <Line
          points={fullPathPoints}
          color={baseColor}
          lineWidth={2.5}
          transparent
          opacity={0.35}
        />
      )}

      {/* Discrete Milestone Holographic Rings */}
      {timelineCoords.map((milestone, idx) => (
        <group key={idx} position={milestone}>
          <mesh>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.035, 0.055, 16]} />
            <meshBasicMaterial color={baseColor} side={THREE.DoubleSide} transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* State Vector Cylinder Shaft (Matrix-transformed at 60 FPS without buffer rebuild) */}
      <mesh ref={shaftMeshRef}>
        <cylinderGeometry args={[0.012, 0.012, 1, 16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive={baseColor}
          emissiveIntensity={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Moving Quantum Orb with Glowing Trail Ribbon */}
      <Trail
        width={1.6}
        length={9}
        color={threeColor}
        attenuation={(t) => t * t}
      >
        <group ref={orbGroupRef} position={timelineCoords[0]}>
          {/* Luminous Quantum Core */}
          <mesh>
            <sphereGeometry args={[0.075, 24, 24]} />
            <meshStandardMaterial
              ref={coreMatRef}
              color="#FFFFFF"
              emissive={baseColor}
              emissiveIntensity={1.4}
              roughness={0.1}
            />
          </mesh>

          {/* Outer Pulsating Energy Corona Aura */}
          <mesh ref={coronaMeshRef}>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshBasicMaterial
              color={baseColor}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Holographic Equatorial Ring */}
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <ringGeometry args={[0.09, 0.14, 24]} />
            <meshBasicMaterial
              color={baseColor}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Trail>

      {/* Orbit Controls */}
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
  playbackSpeed = 1,
  simulationTimeline
}) {
  const maxStep = Math.max(0, (simulationTimeline?.length || 1) - 1);
  const activeStep = Math.min(maxStep, currentStep);

  // Snapshot data for the active step (for cards and text)
  const currentQubitData = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return qubitState;
    const snapshot = simulationTimeline[activeStep];
    return snapshot?.bloch_spheres?.find((s) => s.qubit === qubitState?.qubit) || qubitState;
  }, [simulationTimeline, activeStep, qubitState]);

  const coords = currentQubitData?.bloch_coordinates || [0, 0, 1];
  const radius = currentQubitData?.radius !== undefined
    ? currentQubitData.radius
    : Math.sqrt(coords[0] ** 2 + coords[1] ** 2 + coords[2] ** 2);

  const purity = currentQubitData?.purity !== undefined
    ? currentQubitData.purity
    : (1 + radius * radius) / 2;

  const entropy = currentQubitData?.entropy !== undefined ? currentQubitData.entropy : 0;
  const isPure = radius >= 0.96;

  const prob0 = currentQubitData?.prob0 !== undefined ? currentQubitData.prob0 : Math.max(0, Math.min(1, (1 + coords[2]) / 2));
  const prob1 = currentQubitData?.prob1 !== undefined ? currentQubitData.prob1 : Math.max(0, Math.min(1, (1 - coords[2]) / 2));

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
            playbackSpeed={playbackSpeed}
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
