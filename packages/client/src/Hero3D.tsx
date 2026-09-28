import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PresentationControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function GlassPawn() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const material = new THREE.MeshPhysicalMaterial({
    color: '#10b981', // Emerald tint
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.9, // Glass effect
    ior: 1.5,
    thickness: 2,
    envMapIntensity: 1.5,
  });

  return (
    <group ref={group} position={[0, -1.5, 0]}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} material={material}>
        <cylinderGeometry args={[1.2, 1.5, 0.4, 32]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={material}>
        <cylinderGeometry args={[1, 1.1, 0.2, 32]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.8, 0]} material={material}>
        <cylinderGeometry args={[0.5, 0.9, 2.5, 32]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 3.2, 0]} material={material}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 4.2, 0]} material={material}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div style={{ width: '100%', height: '500px', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Environment preset="city" />
        
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <GlassPawn />
          </Float>
        </PresentationControls>

        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>
    </div>
  );
}
