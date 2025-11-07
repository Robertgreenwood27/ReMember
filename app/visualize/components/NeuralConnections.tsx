'use client';

import { useMemo, useRef } from 'react';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

/* ==============================
   🎛️ CONNECTION SETTINGS PANEL
   ============================== */
const CONNECTION_SETTINGS = {
  // 🎨 Colors – cool desaturated neutrals with warm highlights
  nounLineColor: '#3a4a54',          // deep blue-gray
  nounHighlightColor: '#8cbec9',     // pale cyan glow
  tagLineColor: '#7e6550',           // muted bronze-brown
  tagHighlightColor: '#d0a970',      // soft golden highlight
  tagTextColor: '#a48a6b',           // warm desaturated sand
  tagTextHighlightColor: '#e2cf9e',  // light amber for legibility

  // 🌈 Opacity – balanced translucency
  nounOpacityDefault: 0.30,
  nounOpacityMobile: 0.45,        // 📱 Increased for mobile visibility
  nounOpacityHighlighted: 0.85,   // 📱 More visible when highlighted
  nounOpacityDimmed: 0.08,        // 📱 Less aggressive dimming on mobile

  tagOpacityDefault: 0.55,
  tagOpacityMobile: 0.65,         // 📱 More visible on mobile
  tagOpacityHighlighted: 0.95,
  tagOpacityDimmed: 0.08,

  // 💫 Pulse & Glow – float-safe numeric values
  nounPulseSpeed: { base: 0.20, highlighted: 0.45 },
  tagPulseSpeed: { base: 0.25, highlighted: 0.60 },
  pulseWidth: 0.10,
  pulseBrightness: 2.4,
  baseBrightness: 0.35,

  // 🧩 Line Width
  nounLineWidth: { base: 1.4, highlighted: 2.4, mobile: 2.2, mobileHighlighted: 3.5 },
  tagLineWidth: { base: 3.2, highlighted: 4.4, mobile: 4.0, mobileHighlighted: 5.5 },

  // 🏷️ Label
  fontSize: { desktop: 0.14, mobile: 0.11 },
  labelOutline: 0.018,
  labelOpacityMultiplier: 0.90,

  // ⚡ Performance
  cullOpacityThreshold: 0.02,     // Don't render if below this
  maxHighlightedLines: 50,        // Use fancy rendering for N highlighted lines max
  simplifiedSegments: 2,          // Segments for simple lines
  fancySegments: 8,               // Segments for highlighted lines
};

/* ==============================
   🧠 NeuralConnections Component (OPTIMIZED)
   ============================== */
export function NeuralConnections({ 
  entries, 
  entryPositions,
  symbolPositions,
  highlightedEntry,
  isMobile
}: { 
  entries: Entry[];
  entryPositions: Map<string, THREE.Vector3>;
  symbolPositions: Map<string, THREE.Vector3>;
  highlightedEntry: string | null;
  isMobile: boolean;
}) {
  const { nounLines, tagLines } = useMemo(() => {
    const nounResult: Array<{ 
      start: THREE.Vector3; 
      end: THREE.Vector3; 
      opacity: number; 
      highlighted: boolean;
      entryId: string;
      length: number;
    }> = [];
    
    const tagResult: Array<{
      start: THREE.Vector3;
      end: THREE.Vector3;
      opacity: number;
      highlighted: boolean;
      tag: string;
      midpoint: THREE.Vector3;
      length: number;
    }> = [];

    // Noun-based connections
    entries.forEach((entry) => {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos) return;

      entry.nouns.forEach((noun) => {
        const symbolPos = symbolPositions.get(noun);
        if (!symbolPos) return;

        const isRelated = highlightedEntry === entry.id;
        const opacity = highlightedEntry
          ? (isRelated
              ? CONNECTION_SETTINGS.nounOpacityHighlighted
              : CONNECTION_SETTINGS.nounOpacityDimmed)
          : (isMobile
              ? CONNECTION_SETTINGS.nounOpacityMobile
              : CONNECTION_SETTINGS.nounOpacityDefault);

        // Cull invisible lines early
        if (opacity < CONNECTION_SETTINGS.cullOpacityThreshold) return;

        const length = entryPos.distanceTo(symbolPos);

        nounResult.push({
          start: entryPos,
          end: symbolPos,
          opacity,
          highlighted: isRelated,
          entryId: entry.id,
          length,
        });
      });
    });

    // Tag-based connections
    const tagGroups = new Map<string, string[]>();
    entries.forEach((entry) => {
      if (entry.tags && entry.tags.length > 0) {
        entry.tags.forEach((tag) => {
          if (!tagGroups.has(tag)) tagGroups.set(tag, []);
          tagGroups.get(tag)!.push(entry.id);
        });
      }
    });

    tagGroups.forEach((entryIds, tag) => {
      if (entryIds.length < 2) return;

      for (let i = 0; i < entryIds.length; i++) {
        for (let j = i + 1; j < entryIds.length; j++) {
          const pos1 = entryPositions.get(entryIds[i]);
          const pos2 = entryPositions.get(entryIds[j]);
          if (!pos1 || !pos2) continue;

          const isRelated =
            highlightedEntry === entryIds[i] ||
            highlightedEntry === entryIds[j];
          const opacity = highlightedEntry
            ? (isRelated
                ? CONNECTION_SETTINGS.tagOpacityHighlighted
                : CONNECTION_SETTINGS.tagOpacityDimmed)
            : (isMobile
                ? CONNECTION_SETTINGS.tagOpacityMobile
                : CONNECTION_SETTINGS.tagOpacityDefault);

          // Cull invisible lines
          if (opacity < CONNECTION_SETTINGS.cullOpacityThreshold) return;

          const midpoint = new THREE.Vector3()
            .addVectors(pos1, pos2)
            .multiplyScalar(0.5);
          const length = pos1.distanceTo(pos2);

          tagResult.push({
            start: pos1,
            end: pos2,
            opacity,
            highlighted: isRelated,
            tag,
            midpoint,
            length,
          });
        }
      }
    });

    return { nounLines: nounResult, tagLines: tagResult };
  }, [entries, entryPositions, symbolPositions, highlightedEntry, isMobile]);

  // Separate highlighted from non-highlighted
  const highlightedNounLines = useMemo(
    () => nounLines.filter(l => l.highlighted).slice(0, CONNECTION_SETTINGS.maxHighlightedLines),
    [nounLines]
  );
  const simpleNounLines = useMemo(
    () => nounLines.filter(l => !l.highlighted),
    [nounLines]
  );

  const highlightedTagLines = useMemo(
    () => tagLines.filter(l => l.highlighted).slice(0, CONNECTION_SETTINGS.maxHighlightedLines),
    [tagLines]
  );
  const simpleTagLines = useMemo(
    () => tagLines.filter(l => !l.highlighted),
    [tagLines]
  );

  return (
    <>
      {/* 🔥 FANCY: Highlighted Noun Connections */}
      {highlightedNounLines.map((line, i) => (
        <FancyPulsingLine
          key={`noun-fancy-${i}`}
          start={line.start}
          end={line.end}
          color={new THREE.Color(CONNECTION_SETTINGS.nounHighlightColor)}
          opacity={line.opacity}
          pulseSpeed={CONNECTION_SETTINGS.nounPulseSpeed.highlighted}
          lineWidth={isMobile ? CONNECTION_SETTINGS.nounLineWidth.mobileHighlighted : CONNECTION_SETTINGS.nounLineWidth.highlighted}
          length={line.length}
        />
      ))}

      {/* ⚡ SIMPLE: Non-highlighted Noun Connections (batched) */}
      <SimpleLinesInstanced
        lines={simpleNounLines}
        color={new THREE.Color(CONNECTION_SETTINGS.nounLineColor)}
        lineWidth={isMobile ? CONNECTION_SETTINGS.nounLineWidth.mobile : CONNECTION_SETTINGS.nounLineWidth.base}
      />

      {/* 🔥 FANCY: Highlighted Tag Connections */}
      {highlightedTagLines.map((line, i) => (
        <group key={`tag-fancy-${i}`}>
          <FancyPulsingLine
            start={line.start}
            end={line.end}
            color={new THREE.Color(CONNECTION_SETTINGS.tagHighlightColor)}
            opacity={line.opacity}
            pulseSpeed={CONNECTION_SETTINGS.tagPulseSpeed.highlighted}
            lineWidth={isMobile ? CONNECTION_SETTINGS.tagLineWidth.mobileHighlighted : CONNECTION_SETTINGS.tagLineWidth.highlighted}
            length={line.length}
          />
          <TagLabel
            position={line.midpoint}
            tag={line.tag}
            opacity={line.opacity}
            highlighted={true}
            isMobile={isMobile}
          />
        </group>
      ))}

      {/* ⚡ SIMPLE: Non-highlighted Tag Connections (batched) */}
      <SimpleLinesInstanced
        lines={simpleTagLines}
        color={new THREE.Color(CONNECTION_SETTINGS.tagLineColor)}
        lineWidth={isMobile ? CONNECTION_SETTINGS.tagLineWidth.mobile : CONNECTION_SETTINGS.tagLineWidth.base}
      />

      {/* Labels for simple tag lines */}
      {simpleTagLines.map((line, i) => (
        <TagLabel
          key={`tag-label-${i}`}
          position={line.midpoint}
          tag={line.tag}
          opacity={line.opacity}
          highlighted={false}
          isMobile={isMobile}
        />
      ))}
    </>
  );
}

/* ==============================
   🔥 FANCY Pulsing Line (for highlighted only)
   ============================== */
function FancyPulsingLine({
  start,
  end,
  color,
  opacity,
  pulseSpeed,
  lineWidth,
  length,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: THREE.Color;
  opacity: number;
  pulseSpeed: number;
  lineWidth: number;
  length: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const curve = useMemo(() => {
    const a = start.clone();
    const b = end.clone();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(dir, up);

    if (side.lengthSq() < 0.0001) {
      side.set(1, 0, 0);
    } else {
      side.normalize();
    }

    const bendAmount = Math.min(1.0, length * 0.12);
    mid.addScaledVector(side, bendAmount);

    return new THREE.CatmullRomCurve3([a, mid, b]);
  }, [start, end, length]);

  const geometry = useMemo(() => {
    const tubularSegments = CONNECTION_SETTINGS.fancySegments;
    const radius = lineWidth * 0.008;
    const radialSegments = 4;
    return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  }, [curve, lineWidth]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: color.clone() },
        pulseSpeed: { value: pulseSpeed },
        opacity: { value: opacity },
      },
      vertexShader: `
        varying float vAlong;
        varying float vRadial;

        void main() {
          vAlong = uv.x;
          vRadial = uv.y;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float pulseSpeed;
        uniform float opacity;

        varying float vAlong;
        varying float vRadial;

        void main() {
          float radialCenter = 1.0 - abs(vRadial * 2.0 - 1.0);
          float core = smoothstep(0.2, 1.0, radialCenter);

          float head1 = fract(time * pulseSpeed);
          float head2 = fract(time * pulseSpeed * 0.6 + 0.35);

          float pulseWidth = 0.12;
          float d1 = abs(vAlong - head1);
          float d2 = abs(vAlong - head2);

          float wave1 = smoothstep(pulseWidth, 0.0, d1);
          float wave2 = smoothstep(pulseWidth, 0.0, d2);
          float pulses = max(wave1, wave2);

          float baseGlow = 0.20 + 0.30 * core;
          float pulseGlow = pulses * (1.5 + core);
          float glow = baseGlow + pulseGlow;

          vec3 lineColor = color * (0.4 + glow * 2.4);
          float alpha = opacity * (0.3 + glow * 0.8);

          if (alpha < 0.02) discard;

          gl_FragColor = vec4(lineColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    materialRef.current = mat;
    return mat;
  }, [color, pulseSpeed, opacity]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return <mesh geometry={geometry} material={material} />;
}

/* ==============================
   ⚡ SIMPLE Instanced Lines (batched rendering)
   ============================== */
function SimpleLinesInstanced({
  lines,
  color,
  lineWidth,
}: {
  lines: Array<{ start: THREE.Vector3; end: THREE.Vector3; opacity: number; length: number }>;
  color: THREE.Color;
  lineWidth: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const { geometry, material, instancedMesh } = useMemo(() => {
    if (lines.length === 0) return { geometry: null, material: null, instancedMesh: null };

    // Create a simple line segment geometry
    const points: THREE.Vector3[] = [];
    const opacities: number[] = [];

    lines.forEach(line => {
      // Simple straight line (no curve for performance)
      const segments = CONNECTION_SETTINGS.simplifiedSegments;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = new THREE.Vector3().lerpVectors(line.start, line.end, t);
        points.push(point);
        opacities.push(line.opacity);
      }
    });

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const opacityArray = new Float32Array(opacities);
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacityArray, 1));

    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: lineWidth, // Note: only works in some WebGL contexts
    });

    // For better performance, use custom shader with opacity per vertex
    const shaderMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        time: { value: 0 },
      },
      vertexShader: `
        attribute float opacity;
        varying float vOpacity;

        void main() {
          vOpacity = opacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying float vOpacity;

        void main() {
          // Subtle pulse
          float pulse = 0.8 + 0.2 * sin(time * 0.5);
          vec3 finalColor = color * pulse;
          float alpha = vOpacity * 0.6;
          
          if (alpha < 0.02) discard;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: shaderMat, instancedMesh: null };
  }, [lines, color, lineWidth]);

  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame(({ clock }) => {
    if (material && 'uniforms' in material && material.uniforms.time) {
      material.uniforms.time.value = clock.getElapsedTime();
    }
  });

  if (!geometry || !material) return null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry} material={material} />
    </group>
  );
}

/* ==============================
   🏷️ Tag Label
   ============================== */
function TagLabel({
  position,
  tag,
  opacity,
  highlighted,
  isMobile,
}: {
  position: THREE.Vector3;
  tag: string;
  opacity: number;
  highlighted: boolean;
  isMobile: boolean;
}) {
  const textRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (textRef.current) textRef.current.lookAt(camera.position);
  });

  const fontSize = isMobile
    ? CONNECTION_SETTINGS.fontSize.mobile
    : CONNECTION_SETTINGS.fontSize.desktop;
  const textOpacity = opacity * CONNECTION_SETTINGS.labelOpacityMultiplier;

  // Cull labels that are too dim
  if (textOpacity < 0.1) return null;

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={fontSize}
      color={
        highlighted
          ? CONNECTION_SETTINGS.tagTextHighlightColor
          : CONNECTION_SETTINGS.tagTextColor
      }
      symbolX="center"
      symbolY="middle"
      outlineWidth={CONNECTION_SETTINGS.labelOutline}
      outlineColor="#000000"
      fillOpacity={textOpacity}
    >
      #{tag}
    </Text>
  );
}