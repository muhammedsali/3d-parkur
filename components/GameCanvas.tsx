
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment, Stars } from '@react-three/drei';
import { Track } from './Track';
import { Marble } from './Marble';
import { CameraController } from './CameraController';
import { Participant, CameraMode, GameState, TrackConfig } from '../types';
import * as THREE from 'three';
import { PHYSICS_CONFIG } from '../constants';

interface GameCanvasProps {
  participants: Participant[];
  gameState: GameState;
  onFinish: (result: { id: string, time: number }) => void;
  cameraMode: CameraMode;
  trackConfig: TrackConfig;
}

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

    marblesMap.current.forEach((mesh) => {
       if (mesh.position.z > maxZ) {
           maxZ = mesh.position.z;
           leaderPos = mesh.position;
       }
    });

    if (leaderPos) {
      targetRef.current.position.lerp(leaderPos, 0.05); 
    } else {
        // Default start position view
        targetRef.current.position.set(0, 215, 0);
    }
  });

  return null;
};

export const GameCanvas = ({ participants, gameState, onFinish, cameraMode, trackConfig }: GameCanvasProps) => {
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
    <Canvas shadows camera={{ position: [20, 250, -30], fov: 60 }} dpr={[1, 2]}>
      <color attach="background" args={['#050505']} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 300, 50]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-10, 200, 0]} color="#00F5FF" intensity={2} distance={200} />
      <pointLight position={[10, 100, 100]} color="#B200FF" intensity={2} distance={200} />
      
      <Stars radius={200} depth={100} count={7000} factor={4} saturation={0} fade speed={0.5} />
      <Environment preset="city" />

      <Physics 
        gravity={PHYSICS_CONFIG.gravity} 
        defaultContactMaterial={PHYSICS_CONFIG.defaultContactMaterial}
        iterations={20} 
        tolerance={0.001}
      >
        <Track onFinish={handleFinish} config={trackConfig} />
        
        {gameState !== GameState.MENU && gameState !== GameState.EDITOR && participants.map((p, index) => {
             const col = index % 4; 
             const row = Math.floor(index / 4);
             
             // Spawn logic adjusted for the fixed Start Ramp at [0, 210, 0]
             const x = (col - 1.5) * 1.5; 
             const z = 5 + (row * 1.5); 
             const y = 220;

             return (
               <Marble 
                 key={p.id}
                 data={p} 
                 startPosition={[x, y, z]} 
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
