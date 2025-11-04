import { useEffect, useState, useRef } from 'react';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

export function useForceSimulation(entries: Entry[], isMobile: boolean) {
  const [entryPositions, setEntryPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const [anchorPositions, setAnchorPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const velocities = useRef<Map<string, THREE.Vector3>>(new Map());

  useEffect(() => {
    if (entries.length === 0) return;

    const initialEntryPositions = new Map<string, THREE.Vector3>();
    const initialAnchorPositions = new Map<string, THREE.Vector3>();
    const initialVelocities = new Map<string, THREE.Vector3>();
    
    const anchorsMap = new Map<string, string[]>();
    entries.forEach((entry) => {
      entry.nouns.forEach((noun) => {
        if (!anchorsMap.has(noun)) {
          anchorsMap.set(noun, []);
        }
        anchorsMap.get(noun)!.push(entry.id);
      });
    });

    // Tighter clustering for mobile
    const radius = isMobile ? 6 : 8;
    
    entries.forEach((entry, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = radius + Math.random() * (isMobile ? 1 : 2);
      
      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      initialEntryPositions.set(entry.id, pos);
      initialVelocities.set(entry.id, new THREE.Vector3(0, 0, 0));
    });

    anchorsMap.forEach((entryIds, anchor) => {
      let avgPos = new THREE.Vector3(0, 0, 0);
      entryIds.forEach(entryId => {
        const entryPos = initialEntryPositions.get(entryId);
        if (entryPos) avgPos.add(entryPos);
      });
      avgPos.divideScalar(entryIds.length);
      
      avgPos.add(new THREE.Vector3(
        (Math.random() - 0.5) * (isMobile ? 1.5 : 2),
        (Math.random() - 0.5) * (isMobile ? 1.5 : 2),
        (Math.random() - 0.5) * (isMobile ? 1.5 : 2)
      ));
      
      initialAnchorPositions.set(anchor, avgPos);
      initialVelocities.set(anchor, new THREE.Vector3(0, 0, 0));
    });

    setEntryPositions(initialEntryPositions);
    setAnchorPositions(initialAnchorPositions);
    velocities.current = initialVelocities;

    let frame = 0;
    const maxFrames = isMobile ? 300 : 400;
    
    const interval = setInterval(() => {
      frame++;
      if (frame > maxFrames) {
        clearInterval(interval);
        return;
      }

      const allKeys = [...initialEntryPositions.keys(), ...initialAnchorPositions.keys()];
      const forces = new Map<string, THREE.Vector3>();

      allKeys.forEach((key) => {
        forces.set(key, new THREE.Vector3(0, 0, 0));
      });

      allKeys.forEach((keyA, i) => {
        allKeys.forEach((keyB, j) => {
          if (i >= j) return;
          
          const posA = initialEntryPositions.get(keyA) || initialAnchorPositions.get(keyA);
          const posB = initialEntryPositions.get(keyB) || initialAnchorPositions.get(keyB);
          if (!posA || !posB) return;

          const delta = new THREE.Vector3().subVectors(posA, posB);
          const distance = Math.max(delta.length(), 0.1);
          const repulsion = 1.5 / (distance * distance);
          
          delta.normalize().multiplyScalar(repulsion);
          forces.get(keyA)!.add(delta);
          forces.get(keyB)!.sub(delta);
        });
      });

      anchorsMap.forEach((entryIds, anchor) => {
        const anchorPos = initialAnchorPositions.get(anchor);
        if (!anchorPos) return;

        entryIds.forEach((entryId) => {
          const entryPos = initialEntryPositions.get(entryId);
          if (!entryPos) return;

          const delta = new THREE.Vector3().subVectors(entryPos, anchorPos);
          const distance = delta.length();
          const attraction = distance * 0.02;
          
          delta.normalize().multiplyScalar(attraction);
          forces.get(anchor)!.add(delta);
          forces.get(entryId)!.sub(delta.multiplyScalar(0.1));
        });
      });

      const damping = 0.88;
      const newEntryPositions = new Map<string, THREE.Vector3>();
      const newAnchorPositions = new Map<string, THREE.Vector3>();

      initialEntryPositions.forEach((pos, id) => {
        const vel = velocities.current.get(id)!;
        const force = forces.get(id)!;

        vel.add(force.multiplyScalar(0.1));
        vel.multiplyScalar(damping);
        const newPos = pos.clone().add(vel);

        newEntryPositions.set(id, newPos);
        velocities.current.set(id, vel);
        initialEntryPositions.set(id, newPos);
      });

      initialAnchorPositions.forEach((pos, word) => {
        const vel = velocities.current.get(word)!;
        const force = forces.get(word)!;

        vel.add(force.multiplyScalar(0.1));
        vel.multiplyScalar(damping);
        const newPos = pos.clone().add(vel);

        newAnchorPositions.set(word, newPos);
        velocities.current.set(word, vel);
        initialAnchorPositions.set(word, newPos);
      });

      setEntryPositions(new Map(newEntryPositions));
      setAnchorPositions(new Map(newAnchorPositions));
    }, 16);

    return () => clearInterval(interval);
  }, [entries, isMobile]);

  return { entryPositions, anchorPositions };
}