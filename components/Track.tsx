
import React, { useMemo } from 'react';
import { useBox, useCylinder } from '@react-three/cannon';
import { COLORS } from '../constants';
import { TrackConfig } from '../types';
import * as THREE from 'three';

const TRACK_WIDTH = 12;
const WALL_HEIGHT = 6;
const WALL_THICKNESS = 1;

// Helper to create materials efficiently
const materials = {
  track: new THREE.MeshStandardMaterial({
    color: COLORS.trackBase,
    roughness: 0.4,
    metalness: 0.8,
    emissive: COLORS.neonBlue,
    emissiveIntensity: 0.2
  }),
  wall: new THREE.MeshStandardMaterial({
    color: COLORS.neonPurple,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.9,
    side: THREE.DoubleSide
  })
};

const SideWall = ({ parentPosition, parentRotation, offset, length }: any) => {
  const euler = new THREE.Euler(...parentRotation);
  const offsetVec = new THREE.Vector3(offset, 0, 0);
  offsetVec.applyEuler(euler);

  const pos = [
    parentPosition[0] + offsetVec.x,
    parentPosition[1] + offsetVec.y,
    parentPosition[2] + offsetVec.z
  ];

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [WALL_THICKNESS, WALL_HEIGHT, length],
    position: pos as [number, number, number],
    rotation: parentRotation
  }));

  return (
    <mesh ref={ref as any}>
      <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, length]} />
      <primitive object={materials.wall} attach="material" />
    </mesh>
  );
};

const WalledSegment = ({ position, rotation, length }: any) => {
  const [floorRef] = useBox(() => ({
    type: 'Static',
    args: [TRACK_WIDTH, 1, length],
    position,
    rotation
  }));

  return (
    <group>
      <mesh ref={floorRef as any} receiveShadow castShadow>
        <boxGeometry args={[TRACK_WIDTH, 1, length]} />
        <primitive object={materials.track} attach="material" />
      </mesh>

      <SideWall
        parentPosition={position}
        parentRotation={rotation}
        offset={TRACK_WIDTH / 2 + 0.5}
        length={length}
      />
      <SideWall
        parentPosition={position}
        parentRotation={rotation}
        offset={-(TRACK_WIDTH / 2 + 0.5)}
        length={length}
      />
    </group>
  );
};

const ObstaclePin = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
   const [ref] = useCylinder(() => ({
    type: 'Static',
    position,
    rotation: [rotation[0], rotation[1], rotation[2]], 
    args: [0.5, 0.5, 3, 16],
    material: { restitution: 0.8 }
  }));

  return (
    <mesh ref={ref as any} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 3, 16]} />
      <meshStandardMaterial
        color={COLORS.neonPurple}
        emissive={COLORS.neonPurple}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

const FinishLine = ({ position, rotation, onFinish }: any) => {
  const [ref] = useBox(() => ({
    isTrigger: true,
    position,
    rotation,
    args: [TRACK_WIDTH * 2, 8, 2],
    onCollide: (e) => {
      if (e.body.name) onFinish(e.body.name);
    }
  }));

  return (
    <group position={position} rotation={rotation}>
       <mesh position={[0, 4, 0]}>
         <boxGeometry args={[TRACK_WIDTH + 2, 1, 0.5]} />
         <meshBasicMaterial color="white" />
       </mesh>
       <mesh ref={ref as any} visible={false} />
    </group>
  );
}

// --- Procedural Track Generator ---
const generateTrackSegments = (config: TrackConfig) => {
  const segments = [];
  
  // Starting point (Fixed high point)
  let currentPos = new THREE.Vector3(0, 210, 0);
  
  // 1. Fixed Start Ramp (Always need a safe drop zone)
  const startRamp = { length: 40, slope: 0.4, bank: 0 }; 
  
  // Process Start Ramp
  {
      const rotation = new THREE.Euler(startRamp.slope, 0, startRamp.bank);
      const forwardVec = new THREE.Vector3(0, 0, startRamp.length);
      forwardVec.applyEuler(rotation);
      const centerPos = currentPos.clone().add(forwardVec.clone().multiplyScalar(0.5));
      
      segments.push({
        position: [centerPos.x, centerPos.y, centerPos.z],
        rotation: [startRamp.slope, 0, startRamp.bank],
        length: startRamp.length,
        obstacles: false,
        isFinish: false
      });
      currentPos.add(forwardVec);
  }

  // 2. Generate Dynamic Segments based on Config
  for (let i = 0; i < config.segmentCount; i++) {
    // Varies slightly per segment to keep it organic
    const segmentLength = 50 + Math.random() * 30;
    
    // Slope calculation based on steepness config
    // Base slope 0.3, multiplied by config, plus random variance
    const slope = (0.2 + (config.steepness * 0.3)) + (Math.random() * 0.1);
    
    // Banking (Right tilt) based on config
    const bank = -(config.banking + (Math.random() * 0.05));

    // Obstacles based on chaos level
    const hasObstacles = Math.random() < config.chaosLevel;

    const rotation = new THREE.Euler(slope, 0, bank);
    const forwardVec = new THREE.Vector3(0, 0, segmentLength);
    forwardVec.applyEuler(rotation);
    
    const centerPos = currentPos.clone().add(forwardVec.clone().multiplyScalar(0.5));
    
    segments.push({
      position: [centerPos.x, centerPos.y, centerPos.z],
      rotation: [slope, 0, bank],
      length: segmentLength,
      obstacles: hasObstacles,
      isFinish: false
    });
    
    currentPos.add(forwardVec);
  }

  // 3. Finish Line Segment (Flat-ish)
  {
      const length = 40;
      const slope = 0.1;
      const bank = -0.05;
      const rotation = new THREE.Euler(slope, 0, bank);
      const forwardVec = new THREE.Vector3(0, 0, length);
      forwardVec.applyEuler(rotation);
      const centerPos = currentPos.clone().add(forwardVec.clone().multiplyScalar(0.5));

      segments.push({
        position: [centerPos.x, centerPos.y, centerPos.z],
        rotation: [slope, 0, bank],
        length: length,
        obstacles: false,
        isFinish: true
      });
  }

  return segments;
};

export const Track = ({ onFinish, config }: { onFinish: (id: string) => void, config: TrackConfig }) => {
  // Regenerate track when config changes
  const segments = useMemo(() => generateTrackSegments(config), [config]);

  // Backstop wall at start
  const [backWallRef] = useBox(() => ({
    type: 'Static',
    position: [0, 225, -5],
    rotation: [0.4, 0, 0], 
    args: [20, 20, 2]
  }));

  return (
    <group>
      <mesh ref={backWallRef as any}>
         <boxGeometry args={[20, 20, 2]} />
         <primitive object={materials.wall} attach="material" />
      </mesh>

      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <WalledSegment
            position={seg.position}
            rotation={seg.rotation}
            length={seg.length}
          />
          
          {seg.obstacles && [...Array(Math.floor(seg.length / 3))].map((_, k) => {
             const zOffset = (Math.random() - 0.5) * (seg.length * 0.8);
             const xOffset = (Math.random() - 0.5) * (TRACK_WIDTH * 0.6);
             
             const localPos = new THREE.Vector3(xOffset, 1, zOffset);
             localPos.applyEuler(new THREE.Euler(...(seg.rotation as [number,number,number])));
             
             const worldPos = [
                seg.position[0] + localPos.x,
                seg.position[1] + localPos.y,
                seg.position[2] + localPos.z
             ] as [number, number, number];

             return <ObstaclePin key={`obs-${i}-${k}`} position={worldPos} rotation={seg.rotation as [number,number,number]} />;
          })}

          {seg.isFinish && (
             <FinishLine 
                position={seg.position} 
                rotation={seg.rotation} 
                onFinish={onFinish} 
             />
          )}
        </React.Fragment>
      ))}
      
      {/* Floor Catcher */}
      <mesh position={[0, -500, 500]}>
        <boxGeometry args={[5000, 1, 5000]} />
        <meshBasicMaterial color="black" transparent opacity={0} />
      </mesh>
    </group>
  );
};
