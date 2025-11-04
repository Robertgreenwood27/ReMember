// NetworkGraph.tsx
import { useMemo } from 'react';
import { Entry } from '@/lib/types';
import { useForceSimulation } from '../hooks/useForceSimulation';
import { EntryNode } from './EntryNode';
import { AnchorNode } from './AnchorNode';
import { ConnectionLines } from './ConnectionLines';

export function NetworkGraph({ 
  entries, 
  selectedEntry,
  hoveredEntry,
  onSelectEntry,
  onHoverEntry,
  isMobile 
}: { 
  entries: Entry[];
  selectedEntry: string | null;
  hoveredEntry: string | null;
  onSelectEntry: (id: string | null) => void;
  onHoverEntry: (id: string | null) => void;
  isMobile: boolean;
}) {
  const { entryPositions, anchorPositions } = useForceSimulation(entries, isMobile);

  const anchorToEntries = useMemo(() => {
    const map = new Map<string, string[]>();
    entries.forEach((entry) => {
      entry.nouns.forEach((noun) => {
        if (!map.has(noun)) {
          map.set(noun, []);
        }
        map.get(noun)!.push(entry.id);
      });
    });
    return map;
  }, [entries]);

  return (
    <>
      <ConnectionLines 
        entries={entries}
        entryPositions={entryPositions}
        anchorPositions={anchorPositions}
        highlightedEntry={selectedEntry || hoveredEntry}
        isMobile={isMobile}
      />
      
      {entries.map((entry) => {
        const position = entryPositions.get(entry.id);
        if (!position) return null;

        const isSelected = selectedEntry === entry.id;
        const isHovered = hoveredEntry === entry.id;
        const isHighlighted = isSelected || isHovered;
        const isDimmed = (selectedEntry !== null || hoveredEntry !== null) && !isHighlighted;

        return (
          <EntryNode
            key={entry.id}
            entry={entry}
            position={position}
            onClick={() => onSelectEntry(selectedEntry === entry.id ? null : entry.id)}
            onHover={() => !isMobile && onHoverEntry(entry.id)}
            onUnhover={() => !isMobile && onHoverEntry(null)}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isMobile={isMobile}
          />
        );
      })}

      {Array.from(anchorPositions.entries()).map(([word, position]) => {
        const parentEntries = anchorToEntries.get(word) || [];
        const highlightId = selectedEntry || hoveredEntry;
        const isHighlighted = highlightId ? parentEntries.includes(highlightId) : false;
        const isDimmed = highlightId !== null && !isHighlighted;

        return (
          <AnchorNode
            key={word}
            word={word}
            position={position}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            count={parentEntries.length}
            isMobile={isMobile}
          />
        );
      })}
    </>
  );
}