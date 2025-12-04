import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CameraMode } from '../types';
import * as THREE from 'three';

interface CameraControllerProps {
  mode: CameraMode;
  targetRef?: React.RefObject<THREE.Object3D>; // The leading marble
}

export const CameraController = ({ mode, targetRef }: CameraControllerProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Smooth follow vector
  const vec = new THREE.Vector3();

  useFrame((state, delta) => {
    if (mode === CameraMode.FOLLOW && targetRef?.current) {
        // Find position of the target
        const targetPos = targetRef.current.position;
        
        // Offset: 15 units back, 12 units up to see the track better from above
        vec.set(targetPos.x * 0.8, targetPos.y + 12, targetPos.z - 20);
        
        // Smoothly move camera
        state.camera.position.lerp(vec, delta * 3);
        
        // Look slightly ahead of the marble
        const lookAtTarget = new THREE.Vector3(targetPos.x, targetPos.y - 2, targetPos.z + 10);
        state.camera.lookAt(lookAtTarget);
    } 
    else if (mode === CameraMode.CINEMATIC) {
        // Slowly rotate around the start of the track (which is at Y=210)
        const t = state.clock.getElapsedTime();
        const startHeight = 210;
        
        // Orbit parameters
        const radius = 70;
        const centerX = 0;
        const centerY = startHeight - 20; // Look slightly below start
        const centerZ = 40; // Look a bit forward into the track

        state.camera.position.x = centerX + Math.sin(t * 0.15) * radius;
        state.camera.position.z = centerZ + Math.cos(t * 0.15) * radius;
        state.camera.position.y = startHeight + 40; // Look from above
        
        state.camera.lookAt(centerX, centerY, centerZ);
    }
  });

  return (
    <>
      {mode === CameraMode.FREE && <OrbitControls ref={controlsRef} target={[0, 200, 50]} />}
    </>
  );
};
