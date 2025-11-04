import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

export function EntryNode({ 
  entry, 
  position, 
  onClick,
  isHighlighted,
  isDimmed,
  isMobile
}: { 
  entry: Entry;
  position: THREE.Vector3;
  onClick: () => void;
  isHighlighted: boolean;
  isDimmed: boolean;
  isMobile: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      const scale = isHighlighted ? 1.4 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      
      if (isHighlighted) {
        meshRef.current.rotation.y += 0.01;
      }
    }

    // Make text face camera
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const opacity = isDimmed ? 0.2 : 1;
  const textOpacity = isDimmed ? 0.15 : 0.9;
  const color = isHighlighted ? '#ff6b6b' : '#88ccff';
  const size = isMobile ? 0.35 : 0.4;
  const fontSize = isMobile ? 0.2 : 0.25;
  const labelOffset = isMobile ? 0.5 : 0.6;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[size, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.6 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      <Text
        ref={textRef}
        position={[0, labelOffset, 0]}
        fontSize={fontSize}
        color={isHighlighted ? '#ff6b6b' : '#88ccff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        fillOpacity={textOpacity}
      >
        {entry.anchor}
      </Text>
    </group>
  );
}