// ConnectionLines.tsx
import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export function ConnectionLines({ 
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
    }> = [];
    
    const tagResult: Array<{
      start: THREE.Vector3;
      end: THREE.Vector3;
      opacity: number;
      highlighted: boolean;
      tag: string;
      midpoint: THREE.Vector3;
    }> = [];
    
    // Noun-based connections (entry to anchor)
    entries.forEach((entry) => {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos) return;

      entry.nouns.forEach((noun) => {
        const anchorPos = anchorPositions.get(noun);
        if (!anchorPos) return;

        const isRelated = highlightedEntry === entry.id;
        const opacity = highlightedEntry ? (isRelated ? 0.7 : 0.03) : (isMobile ? 0.2 : 0.3);
        
        nounResult.push({
          start: entryPos,
          end: anchorPos,
          opacity,
          highlighted: isRelated,
          entryId: entry.id
        });
      });
    });

    // Tag-based connections (entry to entry)
    const tagGroups = new Map<string, string[]>();
    entries.forEach((entry) => {
      if (entry.tags && entry.tags.length > 0) {
        entry.tags.forEach((tag) => {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
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
          
          if (pos1 && pos2) {
            const isRelated = highlightedEntry === entryIds[i] || highlightedEntry === entryIds[j];
            const opacity = highlightedEntry ? (isRelated ? 0.9 : 0.05) : 0.6;
            const midpoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
            
            tagResult.push({
              start: pos1,
              end: pos2,
              opacity,
              highlighted: isRelated,
              tag,
              midpoint
            });
          }
        }
      }
    });

    return { nounLines: nounResult, tagLines: tagResult };
  }, [entries, entryPositions, anchorPositions, highlightedEntry, isMobile]);

  return (
    <>
      {nounLines.map((line, i) => (
        <AnimatedLine
          key={`noun-${i}`}
          start={line.start}
          end={line.end}
          color={line.highlighted ? '#4ecdc4' : '#666666'}
          lineWidth={line.highlighted ? 2.5 : 1}
          opacity={line.opacity}
          highlighted={line.highlighted}
        />
      ))}
      
      {tagLines.map((line, i) => (
        <group key={`tag-${i}`}>
          <AnimatedLine
            start={line.start}
            end={line.end}
            color={line.highlighted ? '#ff3366' : '#ff6699'}
            lineWidth={line.highlighted ? 4.5 : 3.5}
            opacity={line.opacity}
            highlighted={line.highlighted}
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

function AnimatedLine({ 
  start, 
  end, 
  color, 
  lineWidth, 
  opacity,
  highlighted 
}: { 
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  lineWidth: number;
  opacity: number;
  highlighted: boolean;
}) {
  const lineRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (lineRef.current && highlighted) {
      const material = lineRef.current.material;
      if (material && !Array.isArray(material)) {
        material.opacity = opacity * (0.8 + Math.sin(clock.getElapsedTime() * 3) * 0.2);
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
    />
  );
}

function TagLabel({
  position,
  tag,
  opacity,
  highlighted,
  isMobile
}: {
  position: THREE.Vector3;
  tag: string;
  opacity: number;
  highlighted: boolean;
  isMobile: boolean;
}) {
  const textRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const fontSize = isMobile ? 0.12 : 0.15;
  const textOpacity = opacity * 0.9;

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={fontSize}
      color={highlighted ? '#ff99bb' : '#ff88aa'}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#000000"
      fillOpacity={textOpacity}
    >
      #{tag}
    </Text>
  );
}