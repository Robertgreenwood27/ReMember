import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function AnchorNode({ 
  word, 
  position, 
  isHighlighted,
  isDimmed,
  count,
  isMobile
}: { 
  word: string;
  position: THREE.Vector3;
  isHighlighted: boolean;
  isDimmed: boolean;
  count: number;
  isMobile: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      const scale = isHighlighted ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }

    // Make text face camera
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const size = Math.min(0.15 + count * 0.02, isMobile ? 0.25 : 0.3);
  const opacity = isDimmed ? 0.15 : 0.8;
  const textOpacity = isDimmed ? 0.1 : 0.7;
  const color = isHighlighted ? '#4ecdc4' : '#ffd93d';
  const fontSize = isMobile ? 0.15 : 0.18;
  const labelOffset = isMobile ? 0.35 : 0.4;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, isMobile ? 12 : 16, isMobile ? 12 : 16]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.5 : 0.2}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      <Text
        ref={textRef}
        position={[0, labelOffset, 0]}
        fontSize={fontSize}
        color={isHighlighted ? '#4ecdc4' : '#ffd93d'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000000"
        fillOpacity={textOpacity}
      >
        {word}
      </Text>
    </group>
  );
}