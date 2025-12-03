import React, { useRef } from 'react';
import { useBox, useCylinder, useTrimesh } from '@react-three/cannon';
import { COLORS } from '../constants';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Material for the track to make it look neon/glassy
const TrackMaterial = () => (
  <meshStandardMaterial 
    color={COLORS.trackBase} 
    roughness={0.4} 
    metalness={0.8}
    emissive={COLORS.neonBlue}
    emissiveIntensity={0.1}
  />
);

const Ramp = ({ position, rotation, args }: any) => {
  const [ref] = useBox(() => ({ type: 'Static', args, position, rotation, friction: 0.1 }));
  return (
    <mesh ref={ref as any} receiveShadow castShadow>
      <boxGeometry args={args} />
      <TrackMaterial />
    </mesh>
  );
};

const Pin = ({ position }: { position: [number, number, number] }) => {
  const [ref] = useCylinder(() => ({
    mass: 0,
    type: 'Static',
    position,
    args: [0.5, 0.5, 2, 8],
    material: { restitution: 1.5 } // Bouncy
  }));

  return (
    <mesh ref={ref as any} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
      <meshStandardMaterial color={COLORS.neonPurple} emissive={COLORS.neonPurple} emissiveIntensity={0.8} />
    </mesh>
  );
};

const WobblePlatform = ({ position }: { position: [number, number, number] }) => {
  const [ref, api] = useBox(() => ({
    type: 'Kinematic',
    position,
    args: [10, 1, 10]
  }));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Rotate platform to wobble
    api.rotation.set(Math.sin(t) * 0.3, 0, Math.cos(t * 0.8) * 0.3);
  });

  return (
    <mesh ref={ref as any} receiveShadow>
      <boxGeometry args={[10, 1, 10]} />
      <meshStandardMaterial color={COLORS.neonBlue} wireframe />
    </mesh>
  );
};

const FinishLine = ({ position, onFinish }: { position: [number, number, number], onFinish: (id: string) => void }) => {
    // Sensor to detect marbles
    const [ref] = useBox(() => ({
        isTrigger: true,
        position,
        args: [20, 5, 1],
        onCollide: (e) => {
            if (e.body.name) {
                onFinish(e.body.name);
            }
        }
    }));

    return (
        <group position={position}>
            <mesh position={[6, 2, 0]}>
                <boxGeometry args={[1, 8, 1]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
            </mesh>
            <mesh position={[-6, 2, 0]}>
                <boxGeometry args={[1, 8, 1]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
            </mesh>
            {/* Visual Checkered Flag Effect (Simplified) */}
             <mesh position={[0, 5, 0]}>
                <boxGeometry args={[12, 2, 0.5]} />
                <meshBasicMaterial color="black" />
            </mesh>
            <mesh ref={ref as any} visible={false}>
                <boxGeometry args={[20, 5, 1]} />
            </mesh>
        </group>
    )
}

export const Track = ({ onFinish }: { onFinish: (id: string) => void }) => {
  return (
    <group>
      {/* 1. Start Ramp */}
      <Ramp position={[0, 15, 0]} rotation={[0.5, 0, 0]} args={[10, 1, 20]} />
      
      {/* 2. Flat Section */}
      <Ramp position={[0, 10, 15]} rotation={[0, 0, 0]} args={[10, 1, 10]} />

      {/* 3. Pinball Area - Falling slope with pins */}
      <Ramp position={[0, 5, 35]} rotation={[0.4, 0, 0]} args={[15, 1, 30]} />
      <Pin position={[-3, 7, 25]} />
      <Pin position={[3, 7, 25]} />
      <Pin position={[0, 6, 30]} />
      <Pin position={[-4, 5, 35]} />
      <Pin position={[4, 5, 35]} />

      {/* 4. Wobble Platform */}
      <WobblePlatform position={[0, 0, 55]} />

      {/* 5. Final Ramp to Finish */}
      <Ramp position={[0, -5, 75]} rotation={[-0.2, 0, 0]} args={[10, 1, 20]} />

      {/* 6. Catch Floor (Safety) */}
      <Ramp position={[0, -10, 50]} rotation={[0, 0, 0]} args={[100, 1, 200]} />
      
      {/* Finish Sensor */}
      <FinishLine position={[0, -3, 85]} onFinish={onFinish} />
    </group>
  );
};