// ConnectionLines.tsx
import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

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
  const lines = useMemo(() => {
    const result: Array<{ 
      start: THREE.Vector3; 
      end: THREE.Vector3; 
      opacity: number; 
      highlighted: boolean;
      entryId: string;
    }> = [];
    
    entries.forEach((entry) => {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos) return;

      entry.nouns.forEach((noun) => {
        const anchorPos = anchorPositions.get(noun);
        if (!anchorPos) return;

        const isRelated = highlightedEntry === entry.id;
        const opacity = highlightedEntry ? (isRelated ? 0.7 : 0.03) : (isMobile ? 0.2 : 0.3);
        
        result.push({
          start: entryPos,
          end: anchorPos,
          opacity,
          highlighted: isRelated,
          entryId: entry.id
        });
      });
    });

    return result;
  }, [entries, entryPositions, anchorPositions, highlightedEntry, isMobile]);

  return (
    <>
      {lines.map((line, i) => (
        <AnimatedLine
          key={i}
          start={line.start}
          end={line.end}
          color={line.highlighted ? '#4ecdc4' : '#666666'}
          lineWidth={line.highlighted ? 2.5 : 1}
          opacity={line.opacity}
          highlighted={line.highlighted}
        />
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