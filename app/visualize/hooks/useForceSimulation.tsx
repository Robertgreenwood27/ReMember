// hooks/useForceSimulation.tsx
import { useEffect, useState, useRef } from 'react';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

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
    entries.forEach((entry) => {
      entry.nouns.forEach((noun) => {
        if (!symbolsMap.has(noun)) {
          symbolsMap.set(noun, []);
        }
        symbolsMap.get(noun)!.push(entry.id);
      });
    });

    // Organic, brain-like clustering
    const radius = isMobile ? 7 : 10;
    
    entries.forEach((entry, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = radius + Math.random() * (isMobile ? 2 : 3);
      
      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      initialEntryPositions.set(entry.id, pos);
      initialVelocities.set(entry.id, new THREE.Vector3(0, 0, 0));
    });

    symbolsMap.forEach((entryIds, symbol) => {
      let avgPos = new THREE.Vector3(0, 0, 0);
      entryIds.forEach(entryId => {
        const entryPos = initialEntryPositions.get(entryId);
        if (entryPos) avgPos.add(entryPos);
      });
      avgPos.divideScalar(entryIds.length);
      
      avgPos.add(new THREE.Vector3(
        (Math.random() - 0.5) * (isMobile ? 2 : 3),
        (Math.random() - 0.5) * (isMobile ? 2 : 3),
        (Math.random() - 0.5) * (isMobile ? 2 : 3)
      ));
      
      initialSymbolPositions.set(symbol, avgPos);
      initialVelocities.set(symbol, new THREE.Vector3(0, 0, 0));
    });

    setEntryPositions(initialEntryPositions);
    setSymbolPositions(initialSymbolPositions);
    velocities.current = initialVelocities;

        // ⚡ Simplified and throttled force simulation
    let frame = 0;
    const maxFrames = isMobile ? 160 : 220;  // ~3x shorter run
    const tickInterval = 33;                 // ~30 FPS instead of 60

    const interval = setInterval(() => {
      frame++;
      if (frame > maxFrames) {
        clearInterval(interval);
        return;
      }

      // Calculate forces just like before, but skip half the pairs for speed
      const allKeys = [...initialEntryPositions.keys(), ...initialSymbolPositions.keys()];
      const forces = new Map<string, THREE.Vector3>();
      allKeys.forEach((key) => forces.set(key, new THREE.Vector3()));

      // Only check every 3rd pair instead of all
      for (let i = 0; i < allKeys.length; i++) {
        for (let j = i + 3; j < allKeys.length; j += 3) {
          const posA = initialEntryPositions.get(allKeys[i]) || initialSymbolPositions.get(allKeys[i]);
          const posB = initialEntryPositions.get(allKeys[j]) || initialSymbolPositions.get(allKeys[j]);
          if (!posA || !posB) continue;

          const delta = new THREE.Vector3().subVectors(posA, posB);
          const dist = Math.max(delta.length(), 0.1);
          const repulsion = 1.5 / (dist * dist);
          delta.normalize().multiplyScalar(repulsion);
          forces.get(allKeys[i])!.add(delta);
          forces.get(allKeys[j])!.sub(delta);
        }
      }

      // attraction logic unchanged ↓
      symbolsMap.forEach((entryIds, symbol) => {
        const symbolPos = initialSymbolPositions.get(symbol);
        if (!symbolPos) return;
        entryIds.forEach((entryId) => {
          const entryPos = initialEntryPositions.get(entryId);
          if (!entryPos) return;
          const delta = new THREE.Vector3().subVectors(entryPos, symbolPos);
          const dist = delta.length();
          const attraction = dist * 0.02;
          delta.normalize().multiplyScalar(attraction);
          forces.get(symbol)!.add(delta);
          forces.get(entryId)!.sub(delta.multiplyScalar(0.1));
        });
      });

      const damping = 0.9;
      const newEntryPositions = new Map<string, THREE.Vector3>();
      const newSymbolPositions = new Map<string, THREE.Vector3>();

      initialEntryPositions.forEach((pos, id) => {
        const vel = velocities.current.get(id)!;
        const force = forces.get(id)!;
        vel.add(force.multiplyScalar(0.1));
        vel.multiplyScalar(damping);
        const newPos = pos.clone().add(vel);
        newEntryPositions.set(id, newPos);
        initialEntryPositions.set(id, newPos);
      });

      initialSymbolPositions.forEach((pos, word) => {
        const vel = velocities.current.get(word)!;
        const force = forces.get(word)!;
        vel.add(force.multiplyScalar(0.1));
        vel.multiplyScalar(damping);
        const newPos = pos.clone().add(vel);
        newSymbolPositions.set(word, newPos);
        initialSymbolPositions.set(word, newPos);
      });

      setEntryPositions(new Map(newEntryPositions));
      setSymbolPositions(new Map(newSymbolPositions));
    }, tickInterval);


    return () => clearInterval(interval);
  }, [entries, isMobile]);

  return { entryPositions, symbolPositions };
}