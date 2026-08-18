import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Plane } from '@react-three/drei';
import * as THREE from 'three';

interface ParliamentChamberProps {
  children?: React.ReactNode;
}

export function ParliamentChamber({ children }: ParliamentChamberProps) {
  const chamberRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    // Subtle ambient animation - chamber "breathing" effect
    if (chamberRef.current) {
      chamberRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={chamberRef}>
      {/* Floor */}
      <Plane 
        args={[20, 15]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
      >
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>

      {/* Government Benches (Right Side) */}
      <group position={[4, 0, -2]}>
        {Array.from({ length: 3 }, (_, row) => (
          <group key={`gov-row-${row}`} position={[0, row * 0.3, row * -1.2]}>
            {Array.from({ length: 8 }, (_, seat) => (
              <Box 
                key={`gov-seat-${row}-${seat}`}
                args={[0.8, 0.4, 0.6]} 
                position={[seat * 1.0 - 3.5, 0.2, 0]}
              >
                <meshStandardMaterial 
                  color="#2D5016" 
                  roughness={0.6}
                  metalness={0.2}
                />
              </Box>
            ))}
          </group>
        ))}
      </group>

      {/* Opposition Benches (Left Side) */}
      <group position={[-4, 0, -2]}>
        {Array.from({ length: 3 }, (_, row) => (
          <group key={`opp-row-${row}`} position={[0, row * 0.3, row * -1.2]}>
            {Array.from({ length: 8 }, (_, seat) => (
              <Box 
                key={`opp-seat-${row}-${seat}`}
                args={[0.8, 0.4, 0.6]} 
                position={[seat * 1.0 - 3.5, 0.2, 0]}
              >
                <meshStandardMaterial 
                  color="#8B0000" 
                  roughness={0.6}
                  metalness={0.2}
                />
              </Box>
            ))}
          </group>
        ))}
      </group>

      {/* Speaker's Chair (Ceann Comhairle) */}
      <group position={[0, 0.5, 3]}>
        <Box args={[1.2, 1.0, 0.8]} position={[0, 0.5, 0]}>
          <meshStandardMaterial 
            color="#8B4513" 
            roughness={0.4}
            metalness={0.3}
          />
        </Box>
        {/* Speaker's Podium */}
        <Box args={[0.8, 0.1, 0.6]} position={[0, 1.1, -0.3]}>
          <meshStandardMaterial 
            color="#654321" 
            roughness={0.5}
            metalness={0.2}
          />
        </Box>
      </group>

      {/* Central Dispatch Box/Table */}
      <Box args={[3, 0.8, 1.5]} position={[0, 0.4, 0]}>
        <meshStandardMaterial 
          color="#2F4F4F" 
          roughness={0.3}
          metalness={0.4}
        />
      </Box>

      {/* Ceiling/Dome Structure */}
      <group position={[0, 8, 0]}>
        <Cylinder args={[12, 12, 1, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#F5F5DC" 
            roughness={0.7}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </Cylinder>
      </group>

      {/* Pillars */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 10;
        const z = Math.sin(angle) * 8;
        return (
          <Cylinder 
            key={`pillar-${i}`}
            args={[0.3, 0.3, 8]} 
            position={[x, 4, z]}
          >
            <meshStandardMaterial 
              color="#DDD" 
              roughness={0.8}
              metalness={0.2}
            />
          </Cylinder>
        );
      })}

      {/* Wall Panels */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 11;
        const z = Math.sin(angle) * 9;
        return (
          <Plane 
            key={`wall-${i}`}
            args={[3, 6]} 
            position={[x, 3, z]}
            rotation={[0, -angle + Math.PI, 0]}
          >
            <meshStandardMaterial 
              color="#E6E6FA" 
              roughness={0.9}
              metalness={0.0}
            />
          </Plane>
        );
      })}

      {/* Irish Harp Symbol (Central) */}
      <group position={[0, 2, 3.5]}>
        <Box args={[0.6, 0.8, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#FFD700" 
            roughness={0.2}
            metalness={0.8}
          />
        </Box>
      </group>

      {children}
    </group>
  );
}

export default ParliamentChamber;