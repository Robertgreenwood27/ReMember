'use client';

import { useMemo, useState, useEffect } from 'react';
import { Entry } from '@/lib/types';
import { useForceSimulation } from '../hooks/useForceSimulation';
import { NeuronNode } from './NeuronNode';
import { AnchorNeuron } from './AnchorNeuron';
import { NeuralConnections } from './NeuralConnections';
import { EnergyParticles } from './EnergyParticles';

/* ==============================
   🎛️ MASTER GRAPH SETTINGS PANEL
   ============================== */
const GRAPH_SETTINGS = {
  // 🕸️ Force Simulation Behavior
  forceStrength: {
    entryRepel: -25,
    anchorRepel: -12,
    linkStrength: 0.2,
  },

  // 🌊 Activation Waves
  waveDuration: 1400,
  wavePropagationSpeed: 0.8,
  entryWaveStart: 0.0,
  anchorWaveStart: 0.25,
  tagWaveStart: 0.45,

  // ⚡ Interaction Feel
  hoverHighlightBoost: 0.9,
  clickSelectBoost: 1.2,
  dimmedOpacity: 0.22,

  // 🧠 Entry Visualization
  showConnections: true,
  showParticles: true,
  showAnchors: true,

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
  const { entryPositions, anchorPositions } = useForceSimulation(entries, isMobile);
  const [activationWaves, setActivationWaves] = useState<Map<string, number>>(new Map());

  const anchorToEntries = useMemo(() => {
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
      // Connect anchors
      entry.nouns.forEach((noun) => {
        newWaves.set(noun, GRAPH_SETTINGS.anchorWaveStart);
      });

      // Connect entries sharing tags
      if (entry.tags) {
        entries.forEach((otherEntry) => {
          if (otherEntry.id !== activeId && otherEntry.tags) {
            const sharedTags = entry.tags.filter((tag) =>
              otherEntry.tags?.includes(tag)
            );
            if (sharedTags.length > 0) {
              newWaves.set(otherEntry.id, GRAPH_SETTINGS.tagWaveStart);
            }
          }
        });
      }
    }

    setActivationWaves(newWaves);

    // Animate waves over time
    const startTime = Date.now();
    const duration = GRAPH_SETTINGS.waveDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1) * GRAPH_SETTINGS.wavePropagationSpeed;

      const updatedWaves = new Map<string, number>();
      newWaves.forEach((baseValue, id) => {
        updatedWaves.set(id, baseValue + progress);
      });

      setActivationWaves(updatedWaves);

      if (progress < 1) requestAnimationFrame(animate);
    };

    animate();
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
          anchorPositions={anchorPositions}
          highlightedEntry={selectedEntry || hoveredEntry}
          isMobile={isMobile}
        />
      )}

      {GRAPH_SETTINGS.showParticles && (
        <EnergyParticles
          entries={entries}
          entryPositions={entryPositions}
          anchorPositions={anchorPositions}
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

      {/* 🌐 Anchor Nodes */}
      {GRAPH_SETTINGS.showAnchors &&
        Array.from(anchorPositions.entries()).map(([word, position]) => {
          const parentEntries = anchorToEntries.get(word) || [];
          const highlightId = selectedEntry || hoveredEntry;
          const isHighlighted = highlightId
            ? parentEntries.includes(highlightId)
            : false;
          const isDimmed = highlightId !== null && !isHighlighted;
          const activationWave = activationWaves.get(word) || 0;

          return (
            <AnchorNeuron
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
