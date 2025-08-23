import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

const BlochSphere = ({ simulationResult, isPlaying, currentStep }) => {
  const sphereRef = useRef();
  const [pathPoints, setPathPoints] = useState([]);
  const [currentPosition, setCurrentPosition] = useState([0, 0, 1]); // Start at |0⟩
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [trailPoints, setTrailPoints] = useState([]);

  useEffect(() => {
    if (simulationResult && simulationResult.bloch_coordinates) {
      const { x, y, z } = simulationResult.bloch_coordinates;
      
      // Generate smooth path using spherical interpolation
      const start = new THREE.Vector3(0, 0, 1); // |0⟩
      const end = new THREE.Vector3(x, y, z);   // Final state
      const numPoints = 50;
      const newPathPoints = [];
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        // Use spherical interpolation for smooth movement on sphere surface
        const point = new THREE.Vector3().lerpVectors(start, end, t).normalize();
        newPathPoints.push([point.x, point.y, point.z]);
      }
      
      setPathPoints(newPathPoints);
      setTrailPoints([]);
    }
  }, [simulationResult]);

  useEffect(() => {
    if (isPlaying && pathPoints.length > 0) {
      let animationFrameId;
      let startTime = null;
      const totalDuration = 3000 / animationSpeed; // 3 seconds total

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        const currentIndex = Math.floor(progress * (pathPoints.length - 1));
        setCurrentPosition(pathPoints[currentIndex]);
        
        // Add to trail
        if (currentIndex > 0 && currentIndex % 2 === 0) {
          setTrailPoints(prev => [...prev.slice(-20), pathPoints[currentIndex]]);
        }

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setCurrentPosition(pathPoints[pathPoints.length - 1]);
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [isPlaying, pathPoints, animationSpeed]);

  useEffect(() => {
    if (pathPoints.length > 0 && currentStep < pathPoints.length) {
      const stepPosition = pathPoints[currentStep];
      setCurrentPosition(stepPosition);
      
      // Update trail for step navigation
      if (currentStep > 0) {
        setTrailPoints(prev => [...prev.slice(-10), stepPosition]);
      }
    }
  }, [currentStep, pathPoints]);

  // Sphere grid lines
  const SphereGrid = () => {
    const segments = 16;
    const points = [];
    
    // Latitude lines
    for (let i = 0; i <= segments; i++) {
      const phi = (i * Math.PI) / segments;
      const circlePoints = [];
      for (let j = 0; j <= 32; j++) {
        const theta = (j * 2 * Math.PI) / 32;
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        circlePoints.push([x, y, z]);
      }
      points.push(circlePoints);
    }
    
    // Longitude lines
    for (let i = 0; i <= 8; i++) {
      const theta = (i * 2 * Math.PI) / 8;
      const circlePoints = [];
      for (let j = 0; j <= segments; j++) {
        const phi = (j * Math.PI) / segments;
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        circlePoints.push([x, y, z]);
      }
      points.push(circlePoints);
    }

    return (
      <>
        {points.map((linePoints, index) => (
          <Line
            key={index}
            points={linePoints}
            color="#666666"
            lineWidth={1}
            opacity={0.2}
            transparent
          />
        ))}
      </>
    );
  };

  return (
    <div className="bloch-sphere-container">
      <Canvas camera={{ position: [3, 3, 3], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Bloch Sphere */}
        <Sphere ref={sphereRef} args={[1, 32, 32]}>
          <meshStandardMaterial 
            color="#4a5568" 
            transparent 
            opacity={0.1} 
            wireframe={false}
            side={THREE.DoubleSide}
          />
        </Sphere>

        {/* Sphere Grid */}
        <SphereGrid />

        {/* Axes with labels */}
        <Line points={[[-1.2, 0, 0], [1.2, 0, 0]]} color="#ef4444" lineWidth={3} />
        <Line points={[[0, -1.2, 0], [0, 1.2, 0]]} color="#22c55e" lineWidth={3} />
        <Line points={[[0, 0, -1.2], [0, 0, 1.2]]} color="#3b82f6" lineWidth={3} />

        {/* Axis labels */}
        <Text position={[1.3, 0, 0]} fontSize={0.1} color="#ef4444">X</Text>
        <Text position={[0, 1.3, 0]} fontSize={0.1} color="#22c55e">Y</Text>
        <Text position={[0, 0, 1.3]} fontSize={0.1} color="#3b82f6">Z</Text>

        {/* Quantum state labels */}
        <Text position={[0, 0, 1.2]} fontSize={0.08} color="#ffffff">|0⟩</Text>
        <Text position={[0, 0, -1.2]} fontSize={0.08} color="#ffffff">|1⟩</Text>

        {/* Current state position with glow effect */}
        <Sphere position={currentPosition} args={[0.1, 16, 16]}>
          <meshStandardMaterial 
            color="#ff6b6b" 
            emissive="#ff6b6b" 
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Trail effect */}
        {trailPoints.map((point, index) => (
          <Sphere 
            key={index} 
            position={point} 
            args={[0.03, 8, 8]}
          >
            <meshStandardMaterial 
              color="#4ecdc4" 
              opacity={0.3 + (index / trailPoints.length) * 0.4} 
              transparent 
            />
          </Sphere>
        ))}

        {/* Path visualization */}
        {pathPoints.length > 0 && (
          <Line
            points={pathPoints}
            color="#4ecdc4"
            lineWidth={2}
            opacity={0.6}
            transparent
            dashed
            dashSize={0.1}
            gapSize={0.05}
          />
        )}

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};

export default BlochSphere;
