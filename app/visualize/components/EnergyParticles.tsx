'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Entry } from '@/lib/types';

/* ==============================
   🎛️ PARTICLE SETTINGS PANEL
   ============================== */
const PARTICLE_SETTINGS = {
  // ✨ Particle Counts
  countDesktop: 100,
  countMobile: 40,

  // 🎨 Colors
  colorDefault: '#3b4a56',
  colorHighlight: '#8cbec9',
  colorDimmed: '#1d252b',

  // 💨 Motion
  speedDefault: 0.006,
  speedHighlight: 0.012,
  directionSwapChance: 0.4,

  // 💫 Appearance
  sizeDefault: { desktop: 0.05, mobile: 0.04 },
  sizeHighlight: { desktop: 0.07, mobile: 0.05 },
  sizeDimmed: { desktop: 0.04, mobile: 0.03 },

  opacityDefault: 0.3,
  opacityHighlight: 0.8,
  opacityDimmed: 0.08,

  // 🌈 Shader Visuals
  glowIntensity: 0.4,
  discardRadius: 0.45,

  // 🔧 Behavior
  highlightProximity: 0.12,
};

/* ==============================
   ⚡ EnergyParticles Component
   ============================== */
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  progress: number;
  speed: number;
  color: THREE.Color;
  size: number;
  opacity: number;
}

export function EnergyParticles({
  entries,
  entryPositions,
  symbolPositions,
  highlightedEntry,
  isMobile,
}: {
  entries: Entry[];
  entryPositions: Map<string, THREE.Vector3>;
  symbolPositions: Map<string, THREE.Vector3>;
  highlightedEntry: string | null;
  isMobile: boolean;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const particlesData = useRef<Particle[]>([]);

  /* ==============================
     🧩 Initialize Geometry + Material
     ============================== */
  const { geometry, material } = useMemo(() => {
    const particleCount = isMobile
      ? PARTICLE_SETTINGS.countMobile
      : PARTICLE_SETTINGS.countDesktop;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    const particles: Particle[] = [];
    let particleIndex = 0;

    entries.forEach((entry) => {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos || particleIndex >= particleCount) return;

      entry.nouns.forEach((noun) => {
        if (particleIndex >= particleCount) return;
        const symbolPos = symbolPositions.get(noun);
        if (!symbolPos) return;

        const color = new THREE.Color(PARTICLE_SETTINGS.colorDefault);
        const particle: Particle = {
          position: entryPos.clone(),
          velocity: new THREE.Vector3(),
          startPos: entryPos.clone(),
          endPos: symbolPos.clone(),
          progress: Math.random(),
          speed: PARTICLE_SETTINGS.speedDefault,
          color,
          size: isMobile
            ? PARTICLE_SETTINGS.sizeDefault.mobile
            : PARTICLE_SETTINGS.sizeDefault.desktop,
          opacity: PARTICLE_SETTINGS.opacityDefault,
        };

        particles.push(particle);
        particleIndex++;
      });
    });

    particlesData.current = particles;

    particles.forEach((p, i) => {
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;

      sizes[i] = p.size;
      opacities[i] = p.opacity;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // 🧠 Same shader, kept inline for clarity
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vColor = color;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 100.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > ${PARTICLE_SETTINGS.discardRadius}) discard;

          float alpha = vOpacity * (1.0 - dist * 2.0);
          vec3 glowColor = vColor * (1.0 + (1.0 - dist * 2.0) * ${PARTICLE_SETTINGS.glowIntensity});

          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, [entries, entryPositions, symbolPositions, highlightedEntry, isMobile]);

  /* ==============================
     🔁 Animation Loop
     ============================== */
  let lastUpdate = 0;
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - lastUpdate < 1 / 30) return; // ~30 FPS update
    lastUpdate = now;

    if (!geometry || !material) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;
    const opacities = geometry.attributes.opacity.array as Float32Array;

    particlesData.current.forEach((particle, i) => {
      particle.progress += particle.speed;

      if (particle.progress >= 1) {
        particle.progress = 0;
        if (Math.random() > PARTICLE_SETTINGS.directionSwapChance) {
          const temp = particle.startPos.clone();
          particle.startPos = particle.endPos.clone();
          particle.endPos = temp;
        }
      }

      particle.position.lerpVectors(
        particle.startPos,
        particle.endPos,
        particle.progress
      );

      // Highlight logic
      if (highlightedEntry) {
        const entry = entries.find((e) => e.id === highlightedEntry);
        if (entry) {
          const entryPos = entryPositions.get(entry.id);
          const isOnHighlightedPath =
            entryPos &&
            (particle.startPos.distanceTo(entryPos) <
              PARTICLE_SETTINGS.highlightProximity ||
              particle.endPos.distanceTo(entryPos) <
                PARTICLE_SETTINGS.highlightProximity);

          if (isOnHighlightedPath) {
            particle.color.set(PARTICLE_SETTINGS.colorHighlight);
            particle.opacity = PARTICLE_SETTINGS.opacityHighlight;
            particle.size = isMobile
              ? PARTICLE_SETTINGS.sizeHighlight.mobile
              : PARTICLE_SETTINGS.sizeHighlight.desktop;
          } else {
            particle.color.set(PARTICLE_SETTINGS.colorDimmed);
            particle.opacity = PARTICLE_SETTINGS.opacityDimmed;
            particle.size = isMobile
              ? PARTICLE_SETTINGS.sizeDimmed.mobile
              : PARTICLE_SETTINGS.sizeDimmed.desktop;
          }
        }
      } else {
        particle.color.set(PARTICLE_SETTINGS.colorDefault);
        particle.opacity = PARTICLE_SETTINGS.opacityDefault;
        particle.size = isMobile
          ? PARTICLE_SETTINGS.sizeDefault.mobile
          : PARTICLE_SETTINGS.sizeDefault.desktop;
      }

      // Update buffers
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;

      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;

      sizes[i] = particle.size;
      opacities[i] = particle.opacity;
    });

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.opacity.needsUpdate = true;

    material.uniforms.time.value = clock.getElapsedTime();
  });

  return <points ref={particlesRef} geometry={geometry} material={material} />;
}
