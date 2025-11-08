// hooks/useForceSimulation.tsx
import { useEffect, useState, useRef } from 'react';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

/**
 * 🧠 Force Simulation Hook
 * - Organically spaces entries and symbols in 3D
 * - Throttled + deterministic for GPU efficiency
 * - Tuned for larger, more "cosmic" layout
 */
export function useForceSimulation(entries: Entry[], isMobile: boolean) {
  const [entryPositions, setEntryPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const [symbolPositions, setSymbolPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const velocities = useRef<Map<string, THREE.Vector3>>(new Map());

  useEffect(() => {
    if (entries.length === 0) return;

    const initialEntryPositions = new Map<string, THREE.Vector3>();
    const initialSymbolPositions = new Map<string, THREE.Vector3>();
    const initialVelocities = new Map<string, THREE.Vector3>();
    const symbolsMap = new Map<string, string[]>();

    // Build noun→entry mapping
    entries.forEach((entry) => {
      entry.nouns.forEach((noun) => {
        if (!symbolsMap.has(noun)) symbolsMap.set(noun, []);
        symbolsMap.get(noun)!.push(entry.id);
      });
    });

    // 🌌 Expanded space radius
    const radius = isMobile ? 14 : 20; // was 7 / 10

    // Initial spherical distribution
    entries.forEach((entry) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = radius + Math.random() * (isMobile ? 4 : 6);
      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      initialEntryPositions.set(entry.id, pos);
      initialVelocities.set(entry.id, new THREE.Vector3());
    });

    // Average out symbol positions around their connected entries
    symbolsMap.forEach((entryIds, symbol) => {
      const avg = new THREE.Vector3();
      entryIds.forEach((id) => {
        const p = initialEntryPositions.get(id);
        if (p) avg.add(p);
      });
      avg.divideScalar(entryIds.length);
      avg.add(new THREE.Vector3(
        (Math.random() - 0.5) * (isMobile ? 4 : 6),
        (Math.random() - 0.5) * (isMobile ? 4 : 6),
        (Math.random() - 0.5) * (isMobile ? 4 : 6)
      ));
      initialSymbolPositions.set(symbol, avg);
      initialVelocities.set(symbol, new THREE.Vector3());
    });

    setEntryPositions(new Map(initialEntryPositions));
    setSymbolPositions(new Map(initialSymbolPositions));
    velocities.current = initialVelocities;

    /* ==========================================
       ⚙️ Simplified force simulation loop
       ========================================== */
    let frame = 0;
    const maxFrames = isMobile ? 240 : 300; // run slightly longer to stabilize
    const tickInterval = 30; // ~33ms → ~30fps
    const repelStrength = isMobile ? 2.0 : 3.0; // ↑ more space between nodes
    const attractStrength = 0.025;
    const damping = 0.92; // ↓ slower, smoother motion

    const interval = setInterval(() => {
      frame++;
      if (frame > maxFrames) {
        clearInterval(interval);
        return;
      }

      const allKeys = [...initialEntryPositions.keys(), ...initialSymbolPositions.keys()];
      const forces = new Map<string, THREE.Vector3>();
      allKeys.forEach((k) => forces.set(k, new THREE.Vector3()));

      // 💥 Repulsion (skip some pairs for perf)
      for (let i = 0; i < allKeys.length; i++) {
        for (let j = i + 2; j < allKeys.length; j += 2) {
          const posA =
            initialEntryPositions.get(allKeys[i]) ||
            initialSymbolPositions.get(allKeys[i]);
          const posB =
            initialEntryPositions.get(allKeys[j]) ||
            initialSymbolPositions.get(allKeys[j]);
          if (!posA || !posB) continue;

          const delta = new THREE.Vector3().subVectors(posA, posB);
          const dist = Math.max(delta.length(), 0.1);
          const strength = repelStrength / (dist * dist);
          delta.normalize().multiplyScalar(strength);
          forces.get(allKeys[i])!.add(delta);
          forces.get(allKeys[j])!.sub(delta);
        }
      }

      // 🧲 Attraction (entries ↔ their symbols)
      symbolsMap.forEach((entryIds, symbol) => {
        const symbolPos = initialSymbolPositions.get(symbol);
        if (!symbolPos) return;
        entryIds.forEach((entryId) => {
          const entryPos = initialEntryPositions.get(entryId);
          if (!entryPos) return;
          const delta = new THREE.Vector3().subVectors(entryPos, symbolPos);
          const dist = delta.length();
          const attraction = dist * attractStrength;
          delta.normalize().multiplyScalar(attraction);
          forces.get(symbol)!.add(delta);
          forces.get(entryId)!.sub(delta.multiplyScalar(0.25));
        });
      });

      // 🚀 Integrate velocities
      const newEntryPositions = new Map<string, THREE.Vector3>();
      const newSymbolPositions = new Map<string, THREE.Vector3>();

      initialEntryPositions.forEach((pos, id) => {
        const vel = velocities.current.get(id)!;
        const f = forces.get(id)!;
        vel.add(f.multiplyScalar(0.15));
        vel.multiplyScalar(damping);
        pos.add(vel);
        newEntryPositions.set(id, pos.clone());
      });

      initialSymbolPositions.forEach((pos, word) => {
        const vel = velocities.current.get(word)!;
        const f = forces.get(word)!;
        vel.add(f.multiplyScalar(0.15));
        vel.multiplyScalar(damping);
        pos.add(vel);
        newSymbolPositions.set(word, pos.clone());
      });

      setEntryPositions(new Map(newEntryPositions));
      setSymbolPositions(new Map(newSymbolPositions));
    }, tickInterval);

    return () => clearInterval(interval);
  }, [entries, isMobile]);

  return { entryPositions, symbolPositions };
}
