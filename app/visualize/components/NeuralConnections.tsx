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
  nounLineColor: '#3a4a54',
  nounHighlightColor: '#8cbec9',
  tagLineColor: '#7e6550',
  tagHighlightColor: '#d0a970',
  tagTextColor: '#a48a6b',
  tagTextHighlightColor: '#e2cf9e',

  nounOpacityDefault: 0.35,
  nounOpacityHighlighted: 0.8,
  nounOpacityDimmed: 0.08,

  tagOpacityDefault: 0.55,
  tagOpacityHighlighted: 0.9,
  tagOpacityDimmed: 0.08,

  fontSize: { desktop: 0.14, mobile: 0.11 },
  labelOutline: 0.018,
  labelOpacityMultiplier: 0.9,

  pulseSpeed: 0.6,
  glowIntensity: 2.5,
  distanceFade: 0.006,
};

/* ==============================
   🧠 NeuralConnections Component
   ============================== */
export function NeuralConnections({
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
  const { nounGeometry, tagGeometry, tagLabels } = useMemo(() => {
    const nounPos: number[] = [];
    const nounColors: number[] = [];
    const tagPos: number[] = [];
    const tagColors: number[] = [];
    const labels: {
      position: THREE.Vector3;
      tag: string;
      highlighted: boolean;
      opacity: number;
    }[] = [];

    const nounBase = new THREE.Color(CONNECTION_SETTINGS.nounLineColor);
    const nounHighlight = new THREE.Color(CONNECTION_SETTINGS.nounHighlightColor);
    const tagBase = new THREE.Color(CONNECTION_SETTINGS.tagLineColor);
    const tagHighlight = new THREE.Color(CONNECTION_SETTINGS.tagHighlightColor);
    const scale = isMobile ? 0.9 : 1.0;

    // 🧬 Noun lines (entry → symbol)
    for (const entry of entries) {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos) continue;
      const isHighlight = highlightedEntry === entry.id;
      for (const noun of entry.nouns) {
        const symbolPos = symbolPositions.get(noun);
        if (!symbolPos) continue;
        const color = isHighlight
          ? nounHighlight
          : highlightedEntry
          ? nounBase.clone().multiplyScalar(0.3)
          : nounBase;
        nounPos.push(
          entryPos.x,
          entryPos.y,
          entryPos.z,
          symbolPos.x,
          symbolPos.y,
          symbolPos.z
        );
        for (let i = 0; i < 2; i++)
          nounColors.push(color.r * scale, color.g * scale, color.b * scale);
      }
    }

    // 🏷️ Tag lines (entry ↔ entry)
    const tagGroups = new Map<string, string[]>();
    for (const e of entries)
      for (const t of e.tags ?? [])
        tagGroups.set(t, [...(tagGroups.get(t) ?? []), e.id]);

    for (const [tag, ids] of tagGroups) {
      if (ids.length < 2) continue;
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++) {
          const a = entryPositions.get(ids[i]);
          const b = entryPositions.get(ids[j]);
          if (!a || !b) continue;
          const highlight =
            highlightedEntry === ids[i] || highlightedEntry === ids[j];
          const c = highlight
            ? tagHighlight
            : highlightedEntry
            ? tagBase.clone().multiplyScalar(0.3)
            : tagBase;
          tagPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          for (let i2 = 0; i2 < 2; i2++)
            tagColors.push(c.r * scale, c.g * scale, c.b * scale);
          const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
          labels.push({
            position: mid,
            tag,
            highlighted: highlight,
            opacity: highlight
              ? CONNECTION_SETTINGS.tagOpacityHighlighted
              : CONNECTION_SETTINGS.tagOpacityDefault,
          });
        }
    }

    const buildGeo = (p: number[], c: number[]) => {
      if (p.length === 0) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      return geo;
    };

    return {
      nounGeometry: buildGeo(nounPos, nounColors),
      tagGeometry: buildGeo(tagPos, tagColors),
      tagLabels: labels,
    };
  }, [entries, entryPositions, symbolPositions, highlightedEntry, isMobile]);

  const nounMat = useMemo(
    () => makeLineShaderMaterial(CONNECTION_SETTINGS.nounOpacityDefault),
    []
  );
  const tagMat = useMemo(
    () => makeLineShaderMaterial(CONNECTION_SETTINGS.tagOpacityDefault),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    nounMat.uniforms.time.value = t;
    tagMat.uniforms.time.value = t;
  });

  return (
    <>
      {nounGeometry && <lineSegments geometry={nounGeometry} material={nounMat} />}
      {tagGeometry && <lineSegments geometry={tagGeometry} material={tagMat} />}
      {tagLabels.map((l, i) => (
        <TagLabel
          key={i}
          position={l.position}
          tag={l.tag}
          highlighted={l.highlighted}
          opacity={l.opacity}
          isMobile={isMobile}
        />
      ))}
    </>
  );
}

/* ==============================
   💡 Animated Shader Line Material
   ============================== */
function makeLineShaderMaterial(baseOpacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      opacity: { value: baseOpacity },
      glowIntensity: { value: CONNECTION_SETTINGS.glowIntensity },
      distanceFade: { value: CONNECTION_SETTINGS.distanceFade },
      pulseSpeed: { value: CONNECTION_SETTINGS.pulseSpeed },
    },
    vertexShader: `
      uniform float time;
      varying vec3 vColor;
      varying float vDepth;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float opacity;
      uniform float glowIntensity;
      uniform float distanceFade;
      uniform float pulseSpeed;
      varying vec3 vColor;
      varying float vDepth;
      void main() {
        float pulse = 0.5 + 0.5 * sin(time * pulseSpeed + vDepth * 0.03);
        float depthFade = 1.0 / (1.0 + vDepth * distanceFade);
        vec3 col = vColor * (0.4 + pulse * glowIntensity * depthFade);
        float alpha = opacity * depthFade * (0.6 + pulse * 0.6);
        gl_FragColor = vec4(col, alpha);
        if (gl_FragColor.a < 0.02) discard;
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/* ==============================
   🏷️ Tag Label Component
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
      outlineColor="#000"
      fillOpacity={opacity * CONNECTION_SETTINGS.labelOpacityMultiplier}
    >
      #{tag}
    </Text>
  );
}
