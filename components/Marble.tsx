
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

export const Marble: React.FC<MarbleProps> = ({ data, startPosition, onRegister, onUnregister }) => {
  const [ref] = useSphere(() => ({
    mass: 1,
    position: startPosition,
    args: [0.5],
    material: { friction: 0.05, restitution: 0.5 }, // Lower friction to keep moving on flat, but high damping below
    linearDamping: 0.3, // INCREASED: Air resistance to slow them down (was 0.1)
    angularDamping: 0.4, // INCREASED: Prevents crazy spinning (was 0.1)
    allowSleep: false, // Never let them sleep, race is active
  }));

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
        metalness={0.4}
        roughness={0.1}
        emissive={data.color}
        emissiveIntensity={0.3}
      />
      <Html position={[0, 0.8, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
        <div className="bg-black/70 text-white text-[8px] px-1 py-0.5 rounded backdrop-blur-sm whitespace-nowrap border border-white/20 select-none font-bold">
          {data.username}
        </div>
      </Html>
    </mesh>
  );
};
