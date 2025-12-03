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
        
        // Desired camera position: behind (-z) and above (+y) relative to the object
        // Since track goes towards +Z, "behind" is actually smaller Z if looking forward.
        // Wait, track is Start [0,15,0] -> Finish [0,-3,85].
        // Motion is +Z.
        // So we want camera at Z - offset.
        
        // Offset: 12 units back, 10 units up
        vec.set(targetPos.x * 0.8, targetPos.y + 10, targetPos.z - 15);
        
        // Smoothly move camera
        state.camera.position.lerp(vec, delta * 3);
        
        // Look slightly ahead of the marble
        const lookAtTarget = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z + 5);
        state.camera.lookAt(lookAtTarget);
    } 
    else if (mode === CameraMode.CINEMATIC) {
        // Slowly rotate around center or pan along track
        const t = state.clock.getElapsedTime();
        state.camera.position.x = Math.sin(t * 0.2) * 30;
        state.camera.position.z = 40 + Math.cos(t * 0.2) * 10;
        state.camera.position.y = 20;
        state.camera.lookAt(0, 0, 50);
    }
  });

  return (
    <>
      {mode === CameraMode.FREE && <OrbitControls ref={controlsRef} />}
    </>
  );
};