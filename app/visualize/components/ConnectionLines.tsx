import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

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
    const result: Array<{ start: THREE.Vector3; end: THREE.Vector3; opacity: number; highlighted: boolean }> = [];
    
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
          highlighted: isRelated
        });
      });
    });

    return result;
  }, [entries, entryPositions, anchorPositions, highlightedEntry, isMobile]);

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.start, line.end]}
          color={line.highlighted ? '#4ecdc4' : '#666666'}
          lineWidth={line.highlighted ? 2.5 : 1}
          transparent
          opacity={line.opacity}
        />
      ))}
    </>
  );
}