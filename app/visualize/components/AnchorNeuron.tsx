'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { neuronVertexShader, neuronFragmentShader } from '../shaders/neuronShader';

/* ==============================
   🎛️ VISUAL CONTROL PANEL
   ============================== */
const ANCHOR_SETTINGS = {
  // ⚙️ Core Appearance
  color: '#b39c6b',         // dull gold
  baseOpacity: 0.75,
  dimmedOpacity: 0.12,

  // 🌐 Scaling
  baseScale: 0.8,
  scalePerConnection: 0.04,
  maxScale: 1.2,
  highlightScaleBoost: 1.25,

  // 💫 Glow
  glowBaseOpacity: 0.1,
  glowDimmedOpacity: 0.04,
  glowHighlightOpacity: 0.25,
  glowBaseScale: 1.2,
  glowHighlightScale: 1.6,

  // 🔁 Animation
  rotationSpeed: 0.004,
  bobSpeed: 1.5,
  bobAmplitude: 0.04,
  scaleLerpSpeed: 0.1,
  glowLerpSpeed: 0.08,

  // 🔥 Shader
  defaultPulseIntensity: 0.25,
  highlightPulseIntensity: 0.7,

  // 🧍 Label
  fontSize: { desktop: 0.17, mobile: 0.14 },
  labelOffset: { desktop: 0.4, mobile: 0.32 },
  outlineWidth: 0.018,
  textColor: '#e2d7b8',
  textHighlightColor: '#fff5d6',
};


/* ==============================
   🧠 AnchorNeuron Component
   ============================== */
export function AnchorNeuron({ 
  word, 
  position, 
  isHighlighted,
  isDimmed,
  count,
  isMobile,
  activationWave
}: { 
  word: string;
  position: THREE.Vector3;
  isHighlighted: boolean;
  isDimmed: boolean;
  count: number;
  isMobile: boolean;
  activationWave: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const router = useRouter();

  const anchorColor = useMemo(() => new THREE.Color(ANCHOR_SETTINGS.color), []);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: anchorColor },
        time: { value: 0 },
        opacity: { value: ANCHOR_SETTINGS.baseOpacity },
        pulseIntensity: { value: ANCHOR_SETTINGS.defaultPulseIntensity },
        isHighlighted: { value: 0.0 }
      },
      vertexShader: neuronVertexShader,
      fragmentShader: neuronFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, [anchorColor]);

  useFrame(({ clock }) => {
    if (meshRef.current && shaderMaterial) {
      shaderMaterial.uniforms.time.value = clock.getElapsedTime();
      const waveEffect = Math.max(0, 1.0 - activationWave * 0.5);

      // Update shader uniforms
      shaderMaterial.uniforms.pulseIntensity.value =
        isHighlighted
          ? ANCHOR_SETTINGS.highlightPulseIntensity + waveEffect * 0.5
          : ANCHOR_SETTINGS.defaultPulseIntensity;
      shaderMaterial.uniforms.isHighlighted.value = isHighlighted ? 1.0 : 0.0;
      shaderMaterial.uniforms.opacity.value = isDimmed
        ? ANCHOR_SETTINGS.dimmedOpacity
        : ANCHOR_SETTINGS.baseOpacity;

      // Scale behavior
      const baseScale = Math.min(
        ANCHOR_SETTINGS.baseScale + count * ANCHOR_SETTINGS.scalePerConnection,
        ANCHOR_SETTINGS.maxScale
      );
      const targetScale = isHighlighted
        ? baseScale * ANCHOR_SETTINGS.highlightScaleBoost
        : baseScale;

      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        ANCHOR_SETTINGS.scaleLerpSpeed
      );

      // Gentle rotation + bobbing
      meshRef.current.rotation.y += ANCHOR_SETTINGS.rotationSpeed;
      if (isHighlighted) {
        meshRef.current.position.y =
          Math.sin(clock.getElapsedTime() * ANCHOR_SETTINGS.bobSpeed) *
          ANCHOR_SETTINGS.bobAmplitude;
      }
    }

    if (glowRef.current) {
      const glowScale = isHighlighted
        ? ANCHOR_SETTINGS.glowHighlightScale
        : ANCHOR_SETTINGS.glowBaseScale;

      glowRef.current.scale.lerp(
        new THREE.Vector3(glowScale, glowScale, glowScale),
        ANCHOR_SETTINGS.glowLerpSpeed
      );

      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = isHighlighted
        ? ANCHOR_SETTINGS.glowHighlightOpacity
        : isDimmed
        ? ANCHOR_SETTINGS.glowDimmedOpacity
        : ANCHOR_SETTINGS.glowBaseOpacity;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    router.push(`/write?anchor=${encodeURIComponent(word)}`);
  };

  const size = Math.min(
    0.15 + count * 0.02,
    isMobile ? 0.25 : 0.3
  );
  const fontSize = isMobile
    ? ANCHOR_SETTINGS.fontSize.mobile
    : ANCHOR_SETTINGS.fontSize.desktop;
  const labelOffset = isMobile
    ? ANCHOR_SETTINGS.labelOffset.mobile
    : ANCHOR_SETTINGS.labelOffset.desktop;
  const textColor = isHighlighted
    ? ANCHOR_SETTINGS.textHighlightColor
    : ANCHOR_SETTINGS.textColor;

  return (
    <group position={position}>
      {/* Outer Glow */}
      <mesh ref={glowRef} scale={ANCHOR_SETTINGS.glowBaseScale}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial
          color={anchorColor}
          transparent
          opacity={ANCHOR_SETTINGS.glowBaseOpacity}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main Anchor Neuron */}
      <mesh
        ref={meshRef}
        material={shaderMaterial}
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
        <sphereGeometry
          args={[size, isMobile ? 16 : 32, isMobile ? 16 : 32]}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, labelOffset, 0]} follow>
        <Text
          fontSize={fontSize}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={ANCHOR_SETTINGS.outlineWidth}
          outlineColor="#000000"
          fillOpacity={isDimmed ? 0.15 : 1}
        >
          {word}
        </Text>
      </Billboard>
    </group>
  );
}