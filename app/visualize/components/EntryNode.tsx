// EntryNode.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

export function EntryNode({ 
  entry, 
  position, 
  onClick,
  onHover,
  onUnhover,
  isHighlighted,
  isDimmed,
  isMobile
}: { 
  entry: Entry;
  position: THREE.Vector3;
  onClick: () => void;
  onHover: () => void;
  onUnhover: () => void;
  isHighlighted: boolean;
  isDimmed: boolean;
  isMobile: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera, clock }) => {
    if (meshRef.current) {
      const targetScale = isHighlighted ? 1.5 : 1;
      const scale = new THREE.Vector3(targetScale, targetScale, targetScale);
      meshRef.current.scale.lerp(scale, 0.15);
      
      if (isHighlighted) {
        meshRef.current.rotation.y += 0.015;
      } else {
        meshRef.current.rotation.y += 0.002;
      }
    }

    if (glowRef.current) {
      const glowScale = isHighlighted ? 1.8 : 1.3;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = isHighlighted ? 0.3 : 0.1;
    }

    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const opacity = isDimmed ? 0.2 : 1;
  const textOpacity = isDimmed ? 0.2 : 1;
  const color = isHighlighted ? '#ff6b6b' : '#88ccff';
  const textColor = isHighlighted ? '#ffffff' : '#e0f0ff';
  const size = isMobile ? 0.35 : 0.4;
  const fontSize = isMobile ? 0.2 : 0.25;
  const labelOffset = isMobile ? 0.5 : 0.6;

  return (
    <group position={position}>
      <mesh
        ref={glowRef}
        scale={1.3}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          onUnhover();
        }}
      >
        <sphereGeometry args={[size, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.8 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      <Text
        ref={textRef}
        position={[0, labelOffset, 0]}
        fontSize={fontSize}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor="#000000"
        fillOpacity={textOpacity}
      >
        {entry.anchor}
      </Text>
    </group>
  );
}