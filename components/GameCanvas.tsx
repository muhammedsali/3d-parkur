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
      targetRef.current.position.lerp(leaderPos, 0.1);
    }
  });

  return null;
};

export const GameCanvas = ({ participants, gameState, onFinish, cameraMode }: GameCanvasProps) => {
  // A dummy object that the camera will actually follow
  const cameraTargetRef = useRef<THREE.Group>(null);
  
  // Store refs to all marbles to calculate the leader
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
      // Reset map on new race just in case, though unmount handles it
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
    <Canvas shadows camera={{ position: [0, 20, -20], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 50, 10]} angle={0.5} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, 10, -10]} color="cyan" intensity={1} />
      <pointLight position={[10, 5, 50]} color="purple" intensity={1} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="city" />

      <Physics gravity={PHYSICS_CONFIG.gravity} defaultContactMaterial={PHYSICS_CONFIG.defaultContactMaterial}>
        <Track onFinish={handleFinish} />
        
        {/* Render Marbles if Race Started */}
        {gameState !== GameState.MENU && participants.map((p, index) => {
             // Stagger positions slightly
             const startX = (Math.random() - 0.5) * 6;
             const startZ = (Math.random() - 0.5) * 4;
             const startY = 18 + index * 0.5; 

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

      {/* Invisible target for camera to track */}
      <group ref={cameraTargetRef} />
      
      {/* Logic to move the target to the leader */}
      <LeaderTracker marblesMap={marblesMap} targetRef={cameraTargetRef} />

      <CameraController mode={cameraMode} targetRef={cameraTargetRef} />
    </Canvas>
  );
};