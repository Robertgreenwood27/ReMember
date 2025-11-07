'use client';

import { useMemo, useState, useEffect } from 'react';
import { Entry } from '@/lib/types';
import { useForceSimulation } from '../hooks/useForceSimulation';
import { NeuronNode } from './NeuronNode';
import { SymbolNeuron } from './SymbolNeuron';
import { NeuralConnections } from './NeuralConnections';
import { EnergyParticles } from './EnergyParticles';

/* ==============================
   🎛️ MASTER GRAPH SETTINGS PANEL
   ============================== */
const GRAPH_SETTINGS = {
  // 🕸️ Force Simulation Behavior
  forceStrength: {
    entryRepel: -25,
    symbolRepel: -12,
    linkStrength: 0.2,
  },

  // 🌊 Activation Waves
  waveDuration: 1400,
  wavePropagationSpeed: 0.8,
  entryWaveStart: 0.0,
  symbolWaveStart: 0.25,
  tagWaveStart: 0.45,

  // ⚡ Interaction Feel
  hoverHighlightBoost: 0.9,
  clickSelectBoost: 1.2,
  dimmedOpacity: 0.22,

  // 🧠 Entry Visualization
  showConnections: true,
  showParticles: true,
  showSymbols: true,

  // 🔄 Animation Toggles
  enableWaves: true,
  enableHover: true,
  enableRotation: true,
};


/* ==============================
   🧠 NeuralGraph Component
   ============================== */
export function NeuralGraph({ 
  entries, 
  selectedEntry,
  hoveredEntry,
  onSelectEntry,
  onHoverEntry,
  isMobile,
}: { 
  entries: Entry[];
  selectedEntry: string | null;
  hoveredEntry: string | null;
  onSelectEntry: (id: string | null) => void;
  onHoverEntry: (id: string | null) => void;
  isMobile: boolean;
}) {
  const { entryPositions, symbolPositions } = useForceSimulation(entries, isMobile);
  const [activationWaves, setActivationWaves] = useState<Map<string, number>>(new Map());

  const symbolToEntries = useMemo(() => {
    const map = new Map<string, string[]>();
    entries.forEach((entry) => {
      entry.nouns.forEach((noun) => {
        if (!map.has(noun)) map.set(noun, []);
        map.get(noun)!.push(entry.id);
      });
    });
    return map;
  }, [entries]);

  /* ==============================
     🌊 Activation Wave Propagation
     ============================== */
    useEffect(() => {
    if (!GRAPH_SETTINGS.enableWaves) return;

    // 🧹 Reset when nothing is selected or hovered
    if (!selectedEntry && !hoveredEntry) {
      setActivationWaves(new Map());
      return;
    }

    const activeId = selectedEntry || hoveredEntry;
    if (!activeId) return;

    const newWaves = new Map<string, number>();
    newWaves.set(activeId, GRAPH_SETTINGS.entryWaveStart);

    const entry = entries.find((e) => e.id === activeId);
    if (entry) {
      // 🌐 Connect related symbols
      entry.nouns.forEach((noun) => {
        newWaves.set(noun, GRAPH_SETTINGS.symbolWaveStart);
      });

      // 🏷️ Connect entries sharing tags (safe access)
      const entryTags = entry.tags ?? [];
      if (entryTags.length > 0) {
        entries.forEach((otherEntry) => {
          if (otherEntry.id === activeId) return;
          const otherTags = otherEntry.tags ?? [];
          const sharedTags = entryTags.filter((tag) =>
            otherTags.includes(tag)
          );
          if (sharedTags.length > 0) {
            newWaves.set(otherEntry.id, GRAPH_SETTINGS.tagWaveStart);
          }
        });
      }
    }

    setActivationWaves(newWaves);

    // 🌊 Animate waves over time (single RAF chain)
    const startTime = performance.now();
    const duration = GRAPH_SETTINGS.waveDuration;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const normalized = Math.min(elapsed / duration, 1);
      const progress = normalized * GRAPH_SETTINGS.wavePropagationSpeed;

      const updated = new Map<string, number>();
      newWaves.forEach((baseValue, id) => {
        updated.set(id, baseValue + progress);
      });

      setActivationWaves(updated);

      if (normalized < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [selectedEntry, hoveredEntry, entries]);


  /* ==============================
     🧩 Scene Composition
     ============================== */
  return (
    <>
      {GRAPH_SETTINGS.showConnections && (
        <NeuralConnections 
          entries={entries}
          entryPositions={entryPositions}
          symbolPositions={symbolPositions}
          highlightedEntry={selectedEntry || hoveredEntry}
          isMobile={isMobile}
        />
      )}

      {GRAPH_SETTINGS.showParticles && (
        <EnergyParticles
          entries={entries}
          entryPositions={entryPositions}
          symbolPositions={symbolPositions}
          highlightedEntry={selectedEntry || hoveredEntry}
          isMobile={isMobile}
        />
      )}

      {/* 🧠 Entry Neurons */}
      {entries.map((entry) => {
        const position = entryPositions.get(entry.id);
        if (!position) return null;

        const isSelected = selectedEntry === entry.id;
        const isHovered = hoveredEntry === entry.id;
        const isHighlighted = isSelected || isHovered;
        const isDimmed =
          (selectedEntry !== null || hoveredEntry !== null) && !isHighlighted;
        const activationWave = activationWaves.get(entry.id) || 0;

        return (
          <NeuronNode
            key={entry.id}
            entry={entry}
            position={position}
            onClick={() =>
              onSelectEntry(selectedEntry === entry.id ? null : entry.id)
            }
            onHover={() =>
              GRAPH_SETTINGS.enableHover && !isMobile && onHoverEntry(entry.id)
            }
            onUnhover={() =>
              GRAPH_SETTINGS.enableHover && !isMobile && onHoverEntry(null)
            }
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            isMobile={isMobile}
            activationWave={activationWave}
          />
        );
      })}

      {/* 🌐 Symbol Nodes */}
      {GRAPH_SETTINGS.showSymbols &&
        Array.from(symbolPositions.entries()).map(([word, position]) => {
          const parentEntries = symbolToEntries.get(word) || [];
          const highlightId = selectedEntry || hoveredEntry;
          const isHighlighted = highlightId
            ? parentEntries.includes(highlightId)
            : false;
          const isDimmed = highlightId !== null && !isHighlighted;
          const activationWave = activationWaves.get(word) || 0;

          return (
            <SymbolNeuron
              key={word}
              word={word}
              position={position}
              isHighlighted={isHighlighted}
              isDimmed={isDimmed}
              count={parentEntries.length}
              isMobile={isMobile}
              activationWave={activationWave}
            />
          );
        })}
    </>
  );
}