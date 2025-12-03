
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment, Stars } from '@react-three/drei';
import { Track } from './Track';
import { Marble } from './Marble';
import { CameraController } from './CameraController';
import { Participant, CameraMode, GameState } from '../types';
import * as THREE from 'three';
import { PHYSICS_CONFIG } from '../constants';

interface GameCanvasProps {
  participants: Participant[];
  gameState: GameState;
  onFinish: (result: { id: string, time: number }) => void;
  cameraMode: CameraMode;
}

// Component to update the camera target to follow the leading marble
const LeaderTracker = ({ 
  marblesMap, 
  targetRef 
}: { 
  marblesMap: React.MutableRefObject<Map<string, THREE.Mesh>>, 
  targetRef: React.RefObject<THREE.Group> 
}) => {
  useFrame(() => {
    if (!targetRef.current) return;

    let maxZ = -Infinity;
    let leaderPos: THREE.Vector3 | null = null;

    // Find the marble with the highest Z position (furthest along track)
    marblesMap.current.forEach((mesh) => {
       if (mesh.position.z > maxZ) {
           maxZ = mesh.position.z;
           leaderPos = mesh.position;
       }
    });

    if (leaderPos) {
      // Smoothly interpolate dummy target to leader position
      targetRef.current.position.lerp(leaderPos, 0.05); // Slower lerp for cinematic feel
    } else {
        // Default start position view
        targetRef.current.position.set(0, 20, 0);
    }
  });

  return null;
};

export const GameCanvas = ({ participants, gameState, onFinish, cameraMode }: GameCanvasProps) => {
  const cameraTargetRef = useRef<THREE.Group>(null);
  const marblesMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const startTime = useRef<number>(0);

  const registerMarble = (id: string, mesh: THREE.Mesh) => {
    marblesMap.current.set(id, mesh);
  };
  
  const unregisterMarble = (id: string) => {
    marblesMap.current.delete(id);
  };

  useEffect(() => {
    if (gameState === GameState.RACE) {
      startTime.current = Date.now();
      marblesMap.current.clear();
    }
  }, [gameState]);

  const handleFinish = (id: string) => {
    if (gameState === GameState.RACE) {
      const time = Date.now() - startTime.current;
      onFinish({ id, time });
    }
  };

  return (
    <Canvas shadows camera={{ position: [0, 40, -40], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 100, 50]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-10, 20, 0]} color="#00F5FF" intensity={2} distance={100} />
      <pointLight position={[10, 20, 100]} color="#B200FF" intensity={2} distance={100} />
      
      <Stars radius={200} depth={100} count={7000} factor={4} saturation={0} fade speed={0.5} />
      <Environment preset="city" />

      {/* Increased iterations for better collision detection reliability */}
      <Physics 
        gravity={PHYSICS_CONFIG.gravity} 
        defaultContactMaterial={PHYSICS_CONFIG.defaultContactMaterial}
        iterations={20} 
        tolerance={0.001}
      >
        <Track onFinish={handleFinish} />
        
        {gameState !== GameState.MENU && participants.map((p, index) => {
             // Spawn logic: Grid formation to prevent explosion at start
             const col = index % 4;
             const row = Math.floor(index / 4);
             const startX = (col - 1.5) * 1.5;
             const startZ = row * -1.5; // Start behind 0
             const startY = 25; 

             return (
               <Marble 
                 key={p.id}
                 data={p} 
                 startPosition={[startX, startY, startZ]} 
                 onRegister={registerMarble}
                 onUnregister={unregisterMarble}
               />
             );
        })}
      </Physics>

      <group ref={cameraTargetRef} />
      <LeaderTracker marblesMap={marblesMap} targetRef={cameraTargetRef} />
      <CameraController mode={cameraMode} targetRef={cameraTargetRef} />
    </Canvas>
  );
};
