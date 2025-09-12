import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function BlochSphereVisual({ qubitState, currentStep, simulationTimeline }) {
  // Get current qubit state data
  const currentQubitData = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) {
      return null;
    }
    const snapshot = simulationTimeline[currentStep];
    if (!snapshot) {
      return null;
    }
    const qubitData = snapshot.bloch_spheres.find(s => s.qubit === qubitState.qubit);
    return qubitData;
  }, [simulationTimeline, currentStep, qubitState.qubit]);

  // Calculate state position on Bloch sphere
  const statePosition = useMemo(() => {
    if (!currentQubitData || !currentQubitData.bloch_coordinates) {
      return [0, 0, 1]; // Default to |0⟩ state
    }
    const [x, y, z] = currentQubitData.bloch_coordinates;
    return [x, y, z];
  }, [currentQubitData]);

  // Generate trail for pure states
  const trail = useMemo(() => {
    if (!simulationTimeline || !currentQubitData?.is_pure) return [];
    
    const trailPoints = [];
    for (let i = 0; i <= currentStep; i++) {
      const snapshot = simulationTimeline[i];
      if (snapshot) {
        const qState = snapshot.bloch_spheres.find(s => s.qubit === qubitState.qubit);
        if (qState && qState.bloch_coordinates) {
          trailPoints.push(qState.bloch_coordinates);
        }
      }
    }
    return trailPoints;
  }, [simulationTimeline, currentStep, qubitState.qubit, currentQubitData?.is_pure]);

  // Define colors based on qubit index
  const getQubitColor = (qIndex) => {
    switch (qIndex) {
      case 0: return "#00F5D4"; // Primary accent (cyan)
      case 1: return "#FF4DA6"; // Secondary accent (magenta)
      case 2: return "#FFD60A"; // Highlight (yellow)
      default: return "#FFFFFF"; // White for others
    }
  };
  const qubitColor = getQubitColor(qubitState.qubit);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Bloch Sphere - simplified materials */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#333333" 
          transparent={true}
          opacity={0.2}
        />
      </Sphere>
      
      {/* Wireframe outline */}
      <Sphere args={[1, 16, 16]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#00F5D4" 
          wireframe={true}
        />
      </Sphere>
      
      {/* Coordinate axes */}
      <Line points={[[-1.2, 0, 0], [1.2, 0, 0]]} color="red" lineWidth={3} />
      <Line points={[[0, -1.2, 0], [0, 1.2, 0]]} color="green" lineWidth={3} />
      <Line points={[[0, 0, -1.2], [0, 0, 1.2]]} color="blue" lineWidth={3} />
      
      {/* Axis labels (small spheres) */}
      <Sphere position={[1.3, 0, 0]} args={[0.05, 8, 8]}>
        <meshBasicMaterial color="red" />
      </Sphere>
      <Sphere position={[0, 1.3, 0]} args={[0.05, 8, 8]}>
        <meshBasicMaterial color="green" />
      </Sphere>
      <Sphere position={[0, 0, 1.3]} args={[0.05, 8, 8]}>
        <meshBasicMaterial color="blue" />
      </Sphere>
      
      {/* Quantum state point - simplified */}
      <Sphere position={statePosition} args={[0.15, 16, 16]}>
        <meshBasicMaterial 
          color={qubitColor}
        />
      </Sphere>
      
      {/* Debug: Always show a test point at a known location */}
      <Sphere position={[0, 0, 1]} args={[0.1, 16, 16]}>
        <meshBasicMaterial color="white" />
      </Sphere>
      
      {/* State vector (line from center to state point) */}
      <Line 
        points={[[0, 0, 0], statePosition]} 
        color={qubitColor} 
        lineWidth={3}
      />
      
      {/* Trail for pure states - simplified */}
      {currentQubitData?.is_pure && trail.length > 1 && (
        <Line 
          points={trail} 
          color={qubitColor} 
          lineWidth={2}
        />
      )}
      
      <OrbitControls enableZoom enablePan enableRotate />
    </>
  );
}

function BlochSphere({ qubitState, currentStep, simulationTimeline }) {
  // Get current state data for display
  const currentQubitData = useMemo(() => {
    if (!simulationTimeline || simulationTimeline.length === 0) return null;
    const snapshot = simulationTimeline[currentStep];
    if (!snapshot) return null;
    return snapshot.bloch_spheres.find(s => s.qubit === qubitState.qubit);
  }, [simulationTimeline, currentStep, qubitState.qubit]);

  return (
    <div className="bloch-sphere-container" style={{ 
      width: '300px', 
      height: '300px', 
      background: '#1a1a1a', 
      border: '1px solid #333', 
      borderRadius: '8px',
      position: 'relative'
    }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 75 }}>
        <BlochSphereVisual 
          qubitState={qubitState}
          currentStep={currentStep}
          simulationTimeline={simulationTimeline}
        />
      </Canvas>
      <div style={{ 
        color: 'white', 
        textAlign: 'center', 
        marginTop: '10px',
        fontSize: '12px'
      }}>
        <div>Qubit {qubitState?.qubit || 0} - {currentQubitData?.is_pure ? 'Pure' : 'Mixed'} State</div>
        {currentQubitData && (
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
            Purity: {currentQubitData.purity?.toFixed(3)} | 
            Entropy: {currentQubitData.entropy?.toFixed(3)}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlochSphere;
