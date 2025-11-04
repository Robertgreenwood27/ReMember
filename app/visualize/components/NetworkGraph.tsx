import { useMemo } from 'react';
import { Entry } from '@/lib/types';
import { useForceSimulation } from '../hooks/useForceSimulation';
import { EntryNode } from './EntryNode';
import { AnchorNode } from './AnchorNode';
import { ConnectionLines } from './ConnectionLines';

export function NetworkGraph({ 
  entries, 
  selectedEntry, 
  onSelectEntry,
  isMobile 
}: { 
  entries: Entry[];
  selectedEntry: string | null;
  onSelectEntry: (id: string | null) => void;
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
        highlightedEntry={selectedEntry}
        isMobile={isMobile}
      />
      
      {entries.map((entry) => {
        const position = entryPositions.get(entry.id);
        if (!position) return null;

        const isHighlighted = selectedEntry === entry.id;
        const isDimmed = selectedEntry !== null && !isHighlighted;

        return (
          <EntryNode
            key={entry.id}
            entry={entry}
            position={position}
            onClick={() => onSelectEntry(selectedEntry === entry.id ? null : entry.id)}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isMobile={isMobile}
          />
        );
      })}

      {Array.from(anchorPositions.entries()).map(([word, position]) => {
        const parentEntries = anchorToEntries.get(word) || [];
        const isHighlighted = selectedEntry ? parentEntries.includes(selectedEntry) : false;
        const isDimmed = selectedEntry !== null && !isHighlighted;

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