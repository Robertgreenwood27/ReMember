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
  // 🎨 Colors — cool desaturated neutrals with warm highlights
  nounLineColor: '#3a4a54',          // deep blue-gray
  nounHighlightColor: '#8cbec9',     // pale cyan glow
  tagLineColor: '#7e6550',           // muted bronze-brown
  tagHighlightColor: '#d0a970',      // soft golden highlight
  tagTextColor: '#a48a6b',           // warm desaturated sand
  tagTextHighlightColor: '#e2cf9e',  // light amber for legibility

  // 🌈 Opacity — balanced translucency
  nounOpacityDefault: 0.30,
  nounOpacityMobile: 0.22,
  nounOpacityHighlighted: 0.72,
  nounOpacityDimmed: 0.05,

  tagOpacityDefault: 0.55,
  tagOpacityHighlighted: 0.90,
  tagOpacityDimmed: 0.05,

  // 💫 Pulse & Glow — float-safe numeric values
  nounPulseSpeed: { base: 0.20, highlighted: 0.45 },
  tagPulseSpeed: { base: 0.25, highlighted: 0.60 },
  pulseWidth: 0.10,            // controls how thick the pulse wave is
  pulseBrightness: 2.4,        // overall brightness multiplier
  baseBrightness: 0.35,        // baseline emission intensity

  // 🧩 Line Width — slightly thinner for subtlety
  nounLineWidth: { base: 1.4, highlighted: 2.4 },
  tagLineWidth: { base: 3.2, highlighted: 4.4 },

  // 📝 Label — smaller and softer
  fontSize: { desktop: 0.14, mobile: 0.11 },
  labelOutline: 0.018,
  labelOpacityMultiplier: 0.90,
};

/* ==============================
   🧠 NeuralConnections Component
   ============================== */
export function NeuralConnections({ 
  entries, 
  entryPositions,
  anchorPositions,
  highlightedEntry,
  isMobile
}: { 
  entries: Entry[];
  entryPositions: Map<string, THREE.Vector3>;
  anchorPositions: Map<string, THREE.Vector3>;
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

    // Noun-based connections (entry → anchor)
    entries.forEach((entry) => {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos) return;

      entry.nouns.forEach((noun) => {
        const anchorPos = anchorPositions.get(noun);
        if (!anchorPos) return;

        const isRelated = highlightedEntry === entry.id;
        const opacity = highlightedEntry
          ? (isRelated
              ? CONNECTION_SETTINGS.nounOpacityHighlighted
              : CONNECTION_SETTINGS.nounOpacityDimmed)
          : (isMobile
              ? CONNECTION_SETTINGS.nounOpacityMobile
              : CONNECTION_SETTINGS.nounOpacityDefault);

        const length = entryPos.distanceTo(anchorPos);

        nounResult.push({
          start: entryPos,
          end: anchorPos,
          opacity,
          highlighted: isRelated,
          entryId: entry.id,
          length,
        });
      });
    });

    // Tag-based connections (entry ↔ entry)
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
            : CONNECTION_SETTINGS.tagOpacityDefault;

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
  }, [entries, entryPositions, anchorPositions, highlightedEntry, isMobile]);

  return (
    <>
      {/* 🧬 Noun Connections */}
      {nounLines.map((line, i) => (
        <PulsingLine
          key={`noun-${i}`}
          start={line.start}
          end={line.end}
          color={
            line.highlighted
              ? new THREE.Color(CONNECTION_SETTINGS.nounHighlightColor)
              : new THREE.Color(CONNECTION_SETTINGS.nounLineColor)
          }
          opacity={line.opacity}
          pulseSpeed={
            line.highlighted
              ? CONNECTION_SETTINGS.nounPulseSpeed.highlighted
              : CONNECTION_SETTINGS.nounPulseSpeed.base
          }
          lineWidth={
            line.highlighted
              ? CONNECTION_SETTINGS.nounLineWidth.highlighted
              : CONNECTION_SETTINGS.nounLineWidth.base
          }
          length={line.length}
        />
      ))}

      {/* 🏷️ Tag Connections */}
      {tagLines.map((line, i) => (
        <group key={`tag-${i}`}>
          <PulsingLine
            start={line.start}
            end={line.end}
            color={
              line.highlighted
                ? new THREE.Color(CONNECTION_SETTINGS.tagHighlightColor)
                : new THREE.Color(CONNECTION_SETTINGS.tagLineColor)
            }
            opacity={line.opacity}
            pulseSpeed={
              line.highlighted
                ? CONNECTION_SETTINGS.tagPulseSpeed.highlighted
                : CONNECTION_SETTINGS.tagPulseSpeed.base
            }
            lineWidth={
              line.highlighted
                ? CONNECTION_SETTINGS.tagLineWidth.highlighted
                : CONNECTION_SETTINGS.tagLineWidth.base
            }
            length={line.length}
          />
          <TagLabel
            position={line.midpoint}
            tag={line.tag}
            opacity={line.opacity}
            highlighted={line.highlighted}
            isMobile={isMobile}
          />
        </group>
      ))}
    </>
  );
}

/* ==============================
   ⚡ Pulsing Line
   ============================== */
function PulsingLine({
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

  // Slightly curved Catmull-Rom spline instead of a dead-straight line
  const curve = useMemo(() => {
    const a = start.clone();
    const b = end.clone();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(dir, up);

    if (side.lengthSq() < 0.0001) {
      // Fallback if direction is almost vertical
      side.set(1, 0, 0);
    } else {
      side.normalize();
    }

    const bendAmount = Math.min(1.0, length * 0.12); // adjust to taste
    mid.addScaledVector(side, bendAmount);

    return new THREE.CatmullRomCurve3([a, mid, b]);
  }, [start, end, length]);

  // TubeGeometry so it feels like a glowing cable
  const geometry = useMemo(() => {
    const tubularSegments = Math.max(8, Math.floor(length * 3));
    const radius = lineWidth * 0.008; // convert "px-ish" line width to world radius
    const radialSegments = 4;

    return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  }, [curve, lineWidth, length]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        pulseSpeed: { value: pulseSpeed },
        opacity: { value: opacity },
      },
      vertexShader: `
        varying float vAlong;
        varying float vRadial;

        void main() {
          // TubeGeometry gives us uv.x along the length, uv.y around the circumference
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
          // Center vs edge of the tube for core/halo effect
          float radialCenter = 1.0 - abs(vRadial * 2.0 - 1.0);
          float core = smoothstep(0.2, 1.0, radialCenter);

          // Two pulses traveling along the cable
          float head1 = fract(time * pulseSpeed);
          float head2 = fract(time * pulseSpeed * 0.6 + 0.35);

          float pulseWidth = 0.12;
          float d1 = abs(vAlong - head1);
          float d2 = abs(vAlong - head2);

          float wave1 = smoothstep(pulseWidth, 0.0, d1);
          float wave2 = smoothstep(pulseWidth, 0.0, d2);
          float pulses = max(wave1, wave2);

          // Base glow along entire line (so it's always visible)
          float baseGlow = 0.20 + 0.30 * core;

          // Extra intensity where the pulses are
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
      materialRef.current.uniforms.opacity.value = opacity;
      materialRef.current.uniforms.pulseSpeed.value = pulseSpeed;
    }
  });

  return <mesh geometry={geometry} material={material} />;
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
      anchorX="center"
      anchorY="middle"
      outlineWidth={CONNECTION_SETTINGS.labelOutline}
      outlineColor="#000000"
      fillOpacity={textOpacity}
    >
      #{tag}
    </Text>
  );
}