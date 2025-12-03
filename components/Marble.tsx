import React from 'react';
import { useSphere } from '@react-three/cannon';
import { Html } from '@react-three/drei';
import { Participant } from '../types';
import * as THREE from 'three';

interface MarbleProps {
  data: Participant;
  startPosition: [number, number, number];
  onRegister: (id: string, mesh: THREE.Mesh) => void;
  onUnregister: (id: string) => void;
}

export const Marble = ({ data, startPosition, onRegister, onUnregister }: MarbleProps) => {
  const [ref] = useSphere(() => ({
    mass: 1,
    position: startPosition,
    args: [0.5],
    material: { friction: 0.1, restitution: 0.7 },
    linearDamping: 0.1,
    angularDamping: 0.1,
  }));

  // Attach the name to the physics body so the sensor knows who crossed
  // And register/unregister for camera tracking
  React.useEffect(() => {
     if (ref.current) {
        // @ts-ignore
        ref.current.name = data.id;
        onRegister(data.id, ref.current as unknown as THREE.Mesh);
     }
     return () => {
       onUnregister(data.id);
     }
  }, [ref, data.id, onRegister, onUnregister]);

  return (
    <mesh ref={ref as any} castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={data.color}
        metalness={0.3}
        roughness={0.2}
        emissive={data.color}
        emissiveIntensity={0.2}
      />
      <Html position={[0, 0.8, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
        <div className="bg-black/70 text-white text-[8px] px-1 py-0.5 rounded backdrop-blur-sm whitespace-nowrap border border-white/20 select-none">
          {data.username}
        </div>
      </Html>
    </mesh>
  );
};