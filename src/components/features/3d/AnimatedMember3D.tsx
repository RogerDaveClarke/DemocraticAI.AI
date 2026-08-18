import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cone } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedMember3DProps {
  name: string;
  party: string;
  position: [number, number, number];
  isSpeaking: boolean;
  personality: 'serious' | 'animated' | 'calm' | 'passionate';
  speechText: string;
  onClick: () => void;
  partyColor: string;
}

export function AnimatedMember3D({
  position,
  isSpeaking,
  personality,
  speechText,
  onClick,
  partyColor
}: AnimatedMember3DProps) {
  const memberRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Animation timing
  useFrame((state) => {
    if (!memberRef.current) return;

    // Base idle animation
    const time = state.clock.elapsedTime;
    const idleFloat = Math.sin(time * 2) * 0.01;
    memberRef.current.position.y = position[1] + idleFloat;

    // Head movement based on personality
    if (headRef.current) {
      switch (personality) {
        case 'animated':
          headRef.current.rotation.y = Math.sin(time * 1.5) * 0.2;
          headRef.current.rotation.x = Math.sin(time * 0.8) * 0.1;
          break;
        case 'serious':
          headRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
          break;
        case 'passionate':
          headRef.current.rotation.y = Math.sin(time * 2.2) * 0.3;
          headRef.current.rotation.z = Math.sin(time * 1.8) * 0.1;
          break;
        case 'calm':
          headRef.current.rotation.y = Math.sin(time * 0.3) * 0.03;
          break;
      }
    }

    // Arm gestures when speaking
    if (isSpeaking) {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = Math.sin(time * 3) * 0.4 + 0.5;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = Math.sin(time * 2.5) * 0.3 - 0.5;
      }
    } else {
      // Return arms to rest position
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.05);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.1, 0.05);
      }
    }

    // Mouth animation for speech
    if (mouthRef.current) {
      if (isSpeaking) {
        const mouthMovement = Math.abs(Math.sin(time * 8)) * 0.3 + 0.7;
        mouthRef.current.scale.y = mouthMovement;
      } else {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1, 0.1);
      }
    }
  });

  // Party color mapping
  const getPartyMaterial = () => {
    const baseColor = partyColor;
    return (
      <meshStandardMaterial 
        color={baseColor}
        roughness={0.6}
        metalness={0.2}
        emissive={isSpeaking ? baseColor : '#000000'}
        emissiveIntensity={isSpeaking ? 0.2 : 0}
      />
    );
  };

  return (
    <group
      ref={memberRef}
      position={position}
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      scale={isHovered ? 1.1 : 1}
    >
      {/* Body */}
      <Box args={[0.6, 1.0, 0.3]} position={[0, 0.5, 0]}>
        {getPartyMaterial()}
      </Box>

      {/* Head */}
      <Sphere 
        ref={headRef}
        args={[0.35]} 
        position={[0, 1.3, 0]}
      >
        <meshStandardMaterial 
          color="#FFE4C4" 
          roughness={0.8}
          metalness={0.0}
        />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.05]} position={[-0.12, 1.4, 0.3]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.05]} position={[0.12, 1.4, 0.3]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* Mouth */}
      <Box 
        ref={mouthRef}
        args={[0.15, 0.08, 0.05]} 
        position={[0, 1.2, 0.32]}
      >
        <meshStandardMaterial 
          color="#8B0000" 
          roughness={0.4}
        />
      </Box>

      {/* Arms */}
      <Box 
        ref={leftArmRef}
        args={[0.15, 0.8, 0.15]} 
        position={[-0.45, 0.5, 0]}
      >
        <meshStandardMaterial color="#FFE4C4" />
      </Box>
      <Box 
        ref={rightArmRef}
        args={[0.15, 0.8, 0.15]} 
        position={[0.45, 0.5, 0]}
      >
        <meshStandardMaterial color="#FFE4C4" />
      </Box>

      {/* Legs */}
      <Box args={[0.2, 0.9, 0.2]} position={[-0.15, -0.45, 0]}>
        <meshStandardMaterial color="#2F4F4F" />
      </Box>
      <Box args={[0.2, 0.9, 0.2]} position={[0.15, -0.45, 0]}>
        <meshStandardMaterial color="#2F4F4F" />
      </Box>

      {/* Party Badge */}
      <Cone args={[0.1, 0.05]} position={[0.3, 0.8, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        {getPartyMaterial()}
      </Cone>

      {/* Name Label (appears when hovered or speaking) */}
      {(isHovered || isSpeaking) && (
        <group position={[0, 2, 0]}>
          <Box args={[1.2, 0.3, 0.05]}>
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
          </Box>
          {/* Text placeholder - would need proper 3D text implementation */}
        </group>
      )}

      {/* Speech Bubble (3D) */}
      {isSpeaking && speechText && (
        <group position={[0, 2.2, 0]}>
          {/* Bubble Background */}
          <Sphere args={[0.8, 16, 8]} position={[0, 0, 0]}>
            <meshStandardMaterial 
              color="#FFFFFF" 
              transparent 
              opacity={0.9}
              roughness={0.1}
            />
          </Sphere>
          
          {/* Speech Text */}
          <group position={[0, 0, 0.1]}>
            <Box args={[1.5, 0.6, 0.05]}>
              <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
            </Box>
            {/* Text content placeholder - displaying first 50 chars */}
          </group>
        </group>
      )}

      {/* Speaking Indicator - Glowing Ring */}
      {isSpeaking && (
        <group position={[0, -1, 0]}>
          <Sphere args={[1, 16, 8]}>
            <meshStandardMaterial 
              color={partyColor}
              transparent
              opacity={0.3}
              emissive={partyColor}
              emissiveIntensity={0.5}
            />
          </Sphere>
        </group>
      )}
    </group>
  );
}

export default AnimatedMember3D;