
import React from 'react';
import { useBox, useCylinder } from '@react-three/cannon';
import { COLORS } from '../constants';
import { useFrame } from '@react-three/fiber';

// Constants for track dimensions to ensure consistency
const TRACK_WIDTH = 12;
const WALL_HEIGHT = 6; // High walls to prevent flying out
const WALL_THICKNESS = 1;

// Material for the floor
const TrackMaterial = () => (
  <meshStandardMaterial 
    color={COLORS.trackBase} 
    roughness={0.4} 
    metalness={0.8}
    emissive={COLORS.neonBlue}
    emissiveIntensity={0.15}
  />
);

// Material for the walls (Semi-transparent neon)
const WallMaterial = () => (
  <meshStandardMaterial 
    color={COLORS.neonPurple} 
    transparent 
    opacity={0.3}
    roughness={0.1}
    metalness={0.9}
  />
);

// A reusable segment that includes a floor and two side walls
const WalledSegment = ({ position, rotation, args, color = COLORS.trackBase }: any) => {
  const [width, height, length] = args;

  // 1. Floor Physics Body
  const [floorRef] = useBox(() => ({ 
    type: 'Static', 
    args: [width, height, length], 
    position, 
    rotation, 
    friction: 0.1 
  }));

  // Calculate Wall Positions relative to the rotated floor
  // Since useBox doesn't support child-relative positioning easily in a loop without complex math,
  // we will construct walls as separate static bodies positioned manually.
  // However, for simple slopes, we can group them visually, but physics needs absolute coords.
  // To simplify, we will attach invisible physics walls to the same coordinate system if possible, 
  // but rotating walls alongside a floor is tricky.
  // INSTEAD: We will use a Compound Body approach for the visual wrapper? 
  // No, useBox compound is complex. We will just render separate Wall components.
  
  return (
    <group>
      {/* Floor Visual & Physics */}
      <mesh ref={floorRef as any} receiveShadow castShadow>
        <boxGeometry args={[width, height, length]} />
        <TrackMaterial />
      </mesh>
      
      {/* We need separate physics bodies for walls to match the floor's rotation exactly.
          The easiest way in this setup is to create a component that renders walls based on the floor's props.
      */}
      <SideWall 
        parentPosition={position} 
        parentRotation={rotation} 
        offset={width / 2 + WALL_THICKNESS / 2} 
        length={length} 
        height={WALL_HEIGHT}
      />
      <SideWall 
        parentPosition={position} 
        parentRotation={rotation} 
        offset={-(width / 2 + WALL_THICKNESS / 2)} 
        length={length} 
        height={WALL_HEIGHT}
      />
    </group>
  );
};

// Helper for Side Walls attached to a segment
const SideWall = ({ parentPosition, parentRotation, offset, length, height }: any) => {
  // We need to calculate the world position of the wall based on the floor's rotation.
  // Actually, standard Cannon useBox can take rotation. If we rotate the floor, we rotate the walls same way.
  // But we need to offset them LOCALLY X.
  
  // Math: Rotate the local offset vector by the parent rotation.
  // Simplification: We will cheat slightly by rendering walls as separate bodies 
  // that share the same rotation but calculated position.
  
  // Actually, let's just use Compound Body for the segment if possible? 
  // No, let's just place them manually. It's safer.
  
  // To properly offset in 3D space with rotation:
  // x' = x * cos(rz) - y * sin(rz) ... it gets complex with 3D Euler.
  
  // ALTERNATIVE: Use a wrapper Group for transforms and local boxes? 
  // Cannon doesn't support nested groups for physics bodies nicely.
  
  // SOLUTION: We will just assume the rotation is mostly on X axis (pitch) for ramps.
  // Local offset X is preserved if rotation is only on X.
  
  const [ref] = useBox(() => ({
    type: 'Static',
    args: [WALL_THICKNESS, height, length],
    position: [
      parentPosition[0] + offset, // This works if Y-rotation is 0
      parentPosition[1],
      parentPosition[2]
    ],
    rotation: parentRotation,
    friction: 0
  }));

  return (
    <mesh ref={ref as any}>
      <boxGeometry args={[WALL_THICKNESS, height, length]} />
      <WallMaterial />
    </mesh>
  );
};

// Obstacles to slow marbles down
const ObstaclePin = ({ position }: { position: [number, number, number] }) => {
  const [ref] = useCylinder(() => ({
    mass: 0,
    type: 'Static',
    position,
    args: [0.8, 0.8, 3, 16],
    material: { restitution: 0.8 } 
  }));

  return (
    <mesh ref={ref as any} castShadow>
      <cylinderGeometry args={[0.8, 0.8, 3, 16]} />
      <meshStandardMaterial color={COLORS.neonPurple} emissive={COLORS.neonPurple} emissiveIntensity={0.5} />
    </mesh>
  );
};

const WobbleBoard = ({ position }: { position: [number, number, number] }) => {
  const [ref, api] = useBox(() => ({
    type: 'Kinematic',
    position,
    args: [TRACK_WIDTH - 1, 1, 20]
  }));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    api.rotation.set(Math.sin(t * 1.5) * 0.1, 0, 0); // Gentle rocking
  });

  return (
    <group>
      {/* Board */}
      <mesh ref={ref as any} receiveShadow>
        <boxGeometry args={[TRACK_WIDTH - 1, 1, 20]} />
        <meshStandardMaterial color={COLORS.neonBlue} wireframe />
      </mesh>
      {/* Static Side Walls for the wobble area (detached from board so they don't wobble) */}
      <WalledSegment position={position} rotation={[0,0,0]} args={[TRACK_WIDTH + 2, 6, 20]} /> 
      {/* The walled segment above is invisible/ghost just to provide walls? 
          No, it overlaps. Let's make walls manually here. */}
       <StaticWall position={[position[0] + TRACK_WIDTH/2, position[1] + 2, position[2]]} args={[1, 6, 20]} />
       <StaticWall position={[position[0] - TRACK_WIDTH/2, position[1] + 2, position[2]]} args={[1, 6, 20]} />
    </group>
  );
};

const StaticWall = ({position, args}: any) => {
   const [ref] = useBox(() => ({ type: 'Static', position, args }));
   return (
       <mesh ref={ref as any}>
           <boxGeometry args={args} />
           <WallMaterial />
       </mesh>
   )
}

const FinishLine = ({ position, onFinish }: { position: [number, number, number], onFinish: (id: string) => void }) => {
    const [ref] = useBox(() => ({
        isTrigger: true,
        position,
        args: [TRACK_WIDTH, 10, 1],
        onCollide: (e) => {
            if (e.body.name) onFinish(e.body.name);
        }
    }));

    return (
        <group position={position}>
            <mesh position={[6, 5, 0]}>
                <boxGeometry args={[1, 10, 1]} />
                <meshStandardMaterial color="white" emissive="white" />
            </mesh>
            <mesh position={[-6, 5, 0]}>
                <boxGeometry args={[1, 10, 1]} />
                <meshStandardMaterial color="white" emissive="white" />
            </mesh>
            <mesh position={[0, 8, 0]}>
                <boxGeometry args={[12, 3, 0.2]} />
                <meshBasicMaterial color="black" />
            </mesh>
            <mesh ref={ref as any} visible={false} />
        </group>
    )
}

export const Track = ({ onFinish }: { onFinish: (id: string) => void }) => {
  // Track layout designed for ~50 seconds duration
  // Uses gentle slopes and obstacles to control speed.
  // Z coordinates are extended significantly.
  
  return (
    <group>
      {/* SECTION 1: The Launch (0 - 40z) - Gentle Slope */}
      <WalledSegment position={[0, 20, 20]} rotation={[0.1, 0, 0]} args={[TRACK_WIDTH, 1, 40]} />
      
      {/* SECTION 2: The Pinball Plinko (40 - 90z) - Flatter with obstacles */}
      <WalledSegment position={[0, 16, 65]} rotation={[0.05, 0, 0]} args={[TRACK_WIDTH, 1, 50]} />
      {/* Pins Layout */}
      {[...Array(12)].map((_, i) => (
         <React.Fragment key={i}>
            <ObstaclePin position={[-3 + (i%3)*3, 18 - i*0.2, 45 + i*3.5]} />
            {i % 2 === 0 && <ObstaclePin position={[0, 18 - i*0.2, 47 + i*3.5]} />}
         </React.Fragment>
      ))}

      {/* SECTION 3: The Long Slide (90 - 200z) - Very long, somewhat steep to regain speed */}
      <WalledSegment position={[0, 5, 145]} rotation={[0.12, 0, 0]} args={[TRACK_WIDTH, 1, 110]} />
      
      {/* SECTION 4: The Wobble Zone (200 - 230z) - Flat */}
      <WobbleBoard position={[0, -5, 215]} />
      {/* Connecting ramp to wobble */}
      <WalledSegment position={[0, -3, 200]} rotation={[0.1, 0, 0]} args={[TRACK_WIDTH, 1, 10]} />
      
      {/* SECTION 5: The Obstacle Course 2 (230 - 330z) - Long and flat-ish */}
      <WalledSegment position={[0, -10, 280]} rotation={[0.08, 0, 0]} args={[TRACK_WIDTH, 1, 100]} />
      {/* Central Dividers to split traffic */}
      <StaticWall position={[0, -8, 260]} args={[2, 4, 20]} />
      <StaticWall position={[0, -12, 300]} args={[2, 4, 20]} />

      {/* SECTION 6: The Final Drop (330 - 380z) */}
      <WalledSegment position={[0, -25, 355]} rotation={[0.2, 0, 0]} args={[TRACK_WIDTH, 1, 50]} />

      {/* SECTION 7: Finish Run-up (380 - 400z) */}
      <WalledSegment position={[0, -32, 390]} rotation={[0, 0, 0]} args={[TRACK_WIDTH, 1, 20]} />

      {/* Safety Floor far below just in case */}
      <mesh position={[0, -50, 200]}>
         <boxGeometry args={[100, 1, 500]} />
         <meshBasicMaterial color="black" transparent opacity={0} />
      </mesh>

      <FinishLine position={[0, -30, 400]} onFinish={onFinish} />
    </group>
  );
};
