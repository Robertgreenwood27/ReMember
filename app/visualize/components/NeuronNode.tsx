'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { neuronVertexShader, neuronFragmentShader } from '../shaders/neuronShader';

/* ==============================
   🎛️ NEURON VISUAL SETTINGS PANEL
   ============================== */
const NEURON_SETTINGS = {
  // ⚙️ Base Appearance
  baseColor: '#7ea4c8',          // desaturated blue-gray
  baseOpacity: 0.9,
  dimmedOpacity: 0.15,

  // 🌈 Highlighting
  highlightPulseIntensity: 0.9,
  defaultPulseIntensity: 0.25,
  highlightScaleBoost: 1.25,
  scalePulseAmplitude: 0.08,
  highlightRotationSpeed: 0.015,
  idleRotationSpeed: 0.002,

  // 💫 Glow
  glowBaseScale: 1.3,
  glowHighlightScale: 1.8,
  glowBaseOpacity: 0.1,
  glowHighlightOpacity: 0.35,
  glowDimmedOpacity: 0.03,

  // 🧍 Label
  fontSize: { desktop: 0.24, mobile: 0.18 },
  labelOffset: { desktop: 0.55, mobile: 0.45 },
  textColor: '#bcd0e0',          // faint icy white-blue
  textHighlightColor: '#e6f5ff',
  outlineWidth: 0.02,

  // 🔄 Animation
  scaleLerpSpeed: 0.12,
  glowLerpSpeed: 0.08,
};


/* ==============================
   🧠 NeuronNode Component
   ============================== */
export function NeuronNode({ 
  entry, 
  position, 
  onClick,
  onHover,
  onUnhover,
  isHighlighted,
  isDimmed,
  isMobile,
  activationWave
}: { 
  entry: Entry;
  position: THREE.Vector3;
  onClick: () => void;
  onHover: () => void;
  onUnhover: () => void;
  isHighlighted: boolean;
  isDimmed: boolean;
  isMobile: boolean;
  activationWave: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  /* ==============================
     🎨 Emotional Color Mapping
     ============================== */
  const emotionalColor = useMemo(() => {
    if (!entry.tags || entry.tags.length === 0)
      return new THREE.Color(NEURON_SETTINGS.baseColor);

const tagColors: { [key: string]: string } = {
  happy: '#bba54a',     // faded amber
  sad: '#4f5f75',
  exciting: '#e1a257',
  calm: '#6fa8a6',
  love: '#c48f84',
  fear: '#7b6ea6',
  angry: '#915c4e',
  grateful: '#89a68a',
};

    for (const tag of entry.tags) {
      const lower = tag.toLowerCase();
      for (const [emotion, color] of Object.entries(tagColors)) {
        if (lower.includes(emotion)) return new THREE.Color(color);
      }
    }

    return new THREE.Color(NEURON_SETTINGS.baseColor);
  }, [entry.tags]);

  /* ==============================
     🧩 Shader Material
     ============================== */
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: emotionalColor },
        time: { value: 0 },
        opacity: { value: NEURON_SETTINGS.baseOpacity },
        pulseIntensity: { value: NEURON_SETTINGS.defaultPulseIntensity },
        isHighlighted: { value: 0.0 },
      },
      vertexShader: neuronVertexShader,
      fragmentShader: neuronFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [emotionalColor]);

  /* ==============================
     🔁 Animation Frame Updates
     ============================== */
  useFrame(({ clock }) => {
    if (meshRef.current && shaderMaterial) {
      shaderMaterial.uniforms.time.value = clock.getElapsedTime();

      const waveEffect = Math.max(0, 1.0 - activationWave * 0.5);

      shaderMaterial.uniforms.pulseIntensity.value = isHighlighted
        ? NEURON_SETTINGS.highlightPulseIntensity + waveEffect
        : NEURON_SETTINGS.defaultPulseIntensity;
      shaderMaterial.uniforms.isHighlighted.value = isHighlighted ? 1.0 : 0.0;
      shaderMaterial.uniforms.opacity.value = isDimmed
        ? NEURON_SETTINGS.dimmedOpacity
        : NEURON_SETTINGS.baseOpacity;

      // Scale pulsing
      const baseScale = 1.0;
      const targetScale = isHighlighted
        ? baseScale *
          (NEURON_SETTINGS.highlightScaleBoost +
            Math.sin(clock.getElapsedTime() * 3) *
              NEURON_SETTINGS.scalePulseAmplitude)
        : baseScale;

      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        NEURON_SETTINGS.scaleLerpSpeed
      );

      // Gentle rotation
      meshRef.current.rotation.y += isHighlighted
        ? NEURON_SETTINGS.highlightRotationSpeed
        : NEURON_SETTINGS.idleRotationSpeed;
    }

    if (glowRef.current) {
      const glowScale = isHighlighted
        ? NEURON_SETTINGS.glowHighlightScale
        : NEURON_SETTINGS.glowBaseScale;
      glowRef.current.scale.lerp(
        new THREE.Vector3(glowScale, glowScale, glowScale),
        NEURON_SETTINGS.glowLerpSpeed
      );

      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = isHighlighted
        ? NEURON_SETTINGS.glowHighlightOpacity
        : isDimmed
        ? NEURON_SETTINGS.glowDimmedOpacity
        : NEURON_SETTINGS.glowBaseOpacity;
    }
  });

  /* ==============================
     🧍 Node & Label Rendering
     ============================== */
  const size = isMobile ? 0.35 : 0.4;
  const fontSize = isMobile
    ? NEURON_SETTINGS.fontSize.mobile
    : NEURON_SETTINGS.fontSize.desktop;
  const labelOffset = isMobile
    ? NEURON_SETTINGS.labelOffset.mobile
    : NEURON_SETTINGS.labelOffset.desktop;
  const textColor = isHighlighted
    ? NEURON_SETTINGS.textHighlightColor
    : NEURON_SETTINGS.textColor;

  return (
    <group position={position}>
      {/* Outer Glow */}
      <mesh ref={glowRef} scale={NEURON_SETTINGS.glowBaseScale}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={emotionalColor}
          transparent
          opacity={NEURON_SETTINGS.glowBaseOpacity}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main Neuron */}
      <mesh
        ref={meshRef}
        material={shaderMaterial}
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
        <sphereGeometry
          args={[size, isMobile ? 24 : 48, isMobile ? 24 : 48]}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, labelOffset, 0]} follow>
        <Text
          fontSize={fontSize}
          color={textColor}
          symbolX="center"
          symbolY="middle"
          outlineWidth={NEURON_SETTINGS.outlineWidth}
          outlineColor="#000000"
          fillOpacity={isDimmed ? 0.2 : 1}
        >
          {entry.symbol}
        </Text>
      </Billboard>
    </group>
  );
}