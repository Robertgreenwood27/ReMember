// AnchorNode.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

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
  const glowRef = useRef<THREE.Mesh>(null);
  const router = useRouter();

  useFrame(({ camera, clock }) => {
    if (meshRef.current) {
      const targetScale = isHighlighted ? 1.4 : 1;
      const scale = new THREE.Vector3(targetScale, targetScale, targetScale);
      meshRef.current.scale.lerp(scale, 0.12);
      
      meshRef.current.rotation.y += 0.005;
      
      if (isHighlighted) {
        meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.05;
      }
    }

    if (glowRef.current) {
      const glowScale = isHighlighted ? 1.6 : 1.2;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
      glowRef.current.material.opacity = isHighlighted ? 0.25 : 0.08;
    }

    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    router.push(`/write?anchor=${encodeURIComponent(word)}`);
  };

  const size = Math.min(0.15 + count * 0.02, isMobile ? 0.25 : 0.3);
  const opacity = isDimmed ? 0.15 : 0.8;
  const textOpacity = isDimmed ? 0.1 : 0.7;
  const color = isHighlighted ? '#4ecdc4' : '#ffd93d';
  const fontSize = isMobile ? 0.15 : 0.18;
  const labelOffset = isMobile ? 0.35 : 0.4;

  return (
    <group position={position}>
      <mesh ref={glowRef} scale={1.2}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh 
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[size, isMobile ? 12 : 16, isMobile ? 12 : 16]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.7 : 0.2}
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