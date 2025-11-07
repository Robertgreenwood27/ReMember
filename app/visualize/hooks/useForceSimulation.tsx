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

    let frame = 0;
    const maxFrames = isMobile ? 350 : 450;
    
    const interval = setInterval(() => {
      frame++;
      if (frame > maxFrames) {
        clearInterval(interval);
        return;
      }

      const allKeys = [...initialEntryPositions.keys(), ...initialSymbolPositions.keys()];
      const forces = new Map<string, THREE.Vector3>();

      allKeys.forEach((key) => {
        forces.set(key, new THREE.Vector3(0, 0, 0));
      });

      // Repulsion between all nodes
      allKeys.forEach((keyA, i) => {
        allKeys.forEach((keyB, j) => {
          if (i >= j) return;
          
          const posA = initialEntryPositions.get(keyA) || initialSymbolPositions.get(keyA);
          const posB = initialEntryPositions.get(keyB) || initialSymbolPositions.get(keyB);
          if (!posA || !posB) return;

          const delta = new THREE.Vector3().subVectors(posA, posB);
          const distance = Math.max(delta.length(), 0.1);
          const repulsion = 2.0 / (distance * distance);
          
          delta.normalize().multiplyScalar(repulsion);
          forces.get(keyA)!.add(delta);
          forces.get(keyB)!.sub(delta);
        });
      });

      // Attraction between connected nodes
      symbolsMap.forEach((entryIds, symbol) => {
        const symbolPos = initialSymbolPositions.get(symbol);
        if (!symbolPos) return;

        entryIds.forEach((entryId) => {
          const entryPos = initialEntryPositions.get(entryId);
          if (!entryPos) return;

          const delta = new THREE.Vector3().subVectors(entryPos, symbolPos);
          const distance = delta.length();
          const attraction = distance * 0.025;
          
          delta.normalize().multiplyScalar(attraction);
          forces.get(symbol)!.add(delta);
          forces.get(entryId)!.sub(delta.multiplyScalar(0.12));
        });
      });

      // Tag-based clustering
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

      tagGroups.forEach((entryIds) => {
        if (entryIds.length < 2) return;
        
        for (let i = 0; i < entryIds.length; i++) {
          for (let j = i + 1; j < entryIds.length; j++) {
            const pos1 = initialEntryPositions.get(entryIds[i]);
            const pos2 = initialEntryPositions.get(entryIds[j]);
            
            if (pos1 && pos2) {
              const delta = new THREE.Vector3().subVectors(pos1, pos2);
              const distance = delta.length();
              const attraction = distance * 0.015;
              
              delta.normalize().multiplyScalar(attraction);
              forces.get(entryIds[i])!.sub(delta);
              forces.get(entryIds[j])!.add(delta);
            }
          }
        }
      });

      const damping = 0.87;
      const newEntryPositions = new Map<string, THREE.Vector3>();
      const newSymbolPositions = new Map<string, THREE.Vector3>();

      initialEntryPositions.forEach((pos, id) => {
        const vel = velocities.current.get(id)!;
        const force = forces.get(id)!;

        vel.add(force.multiplyScalar(0.12));
        vel.multiplyScalar(damping);
        const newPos = pos.clone().add(vel);

        newEntryPositions.set(id, newPos);
        velocities.current.set(id, vel);
        initialEntryPositions.set(id, newPos);
      });

      initialSymbolPositions.forEach((pos, word) => {
        const vel = velocities.current.get(word)!;
        const force = forces.get(word)!;

        vel.add(force.multiplyScalar(0.12));
        vel.multiplyScalar(damping);
        const newPos = pos.clone().add(vel);

        newSymbolPositions.set(word, newPos);
        velocities.current.set(word, vel);
        initialSymbolPositions.set(word, newPos);
      });

      setEntryPositions(new Map(newEntryPositions));
      setSymbolPositions(new Map(newSymbolPositions));
    }, 16);

    return () => clearInterval(interval);
  }, [entries, isMobile]);

  return { entryPositions, symbolPositions };
}