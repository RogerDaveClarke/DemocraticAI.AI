import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Camera3DControlsProps {
  autoRotate?: boolean;
  enablePan?: boolean;
  enableZoom?: boolean;
  presetView?: 'overview' | 'government' | 'opposition' | 'speaker' | 'gallery';
}

export function Camera3DControls({ 
  autoRotate = false, 
  enablePan = true, 
  enableZoom = true,
  presetView = 'overview'
}: Camera3DControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Preset camera positions
  const cameraPresets = {
    overview: { position: [0, 12, 15], target: [0, 2, 0] },
    government: { position: [8, 6, 5], target: [4, 2, -2] },
    opposition: { position: [-8, 6, 5], target: [-4, 2, -2] },
    speaker: { position: [0, 8, -8], target: [0, 3, 3] },
    gallery: { position: [0, 15, 0], target: [0, 0, 0] }
  };

  // Apply preset view
  useFrame(() => {
    if (controlsRef.current && presetView in cameraPresets) {
      const preset = cameraPresets[presetView];
      
      // Smoothly transition camera position
      camera.position.lerp(new THREE.Vector3(...preset.position), 0.02);
      controlsRef.current.target.lerp(new THREE.Vector3(...preset.target), 0.02);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={30}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
      target={[0, 2, 0]}
    />
  );
}

export default Camera3DControls;