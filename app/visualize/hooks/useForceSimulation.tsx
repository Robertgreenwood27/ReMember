// hooks/useForceSimulation.tsx
import { useEffect, useState, useRef } from 'react';
import { Entry } from '@/lib/types';
import * as THREE from 'three';

/* ==============================
   🎨 EMOTIONAL THEME REGIONS
   ============================== */
const EMOTIONAL_ATTRACTORS = {
  happy: { position: new THREE.Vector3(12, 8, 5), color: '#bba54a' },
  exciting: { position: new THREE.Vector3(15, -3, 8), color: '#e1a257' },
  love: { position: new THREE.Vector3(-8, 10, -6), color: '#c48f84' },
  grateful: { position: new THREE.Vector3(-10, -5, 10), color: '#89a68a' },
  calm: { position: new THREE.Vector3(5, -12, -8), color: '#6fa8a6' },
  sad: { position: new THREE.Vector3(-12, 2, -10), color: '#4f5f75' },
  fear: { position: new THREE.Vector3(-15, -8, 5), color: '#7b6ea6' },
  angry: { position: new THREE.Vector3(10, 5, -12), color: '#915c4e' },
  neutral: { position: new THREE.Vector3(0, 0, 0), color: '#7ea4c8' }, // Default for untagged
};

/**
 * 🧠 Thematic Clustering Force Simulation
 * - Groups memories by emotional content
 * - Creates distinct neighborhoods for different emotions
 * - Symbols act as bridges between emotional regions
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

    /* ==============================
       🎯 STEP 1: Place entries near their emotional attractors
       ============================== */
    entries.forEach((entry) => {
      // Find primary emotion from tags
      const primaryEmotion = detectPrimaryEmotion(entry.tags || []);
      const attractor = EMOTIONAL_ATTRACTORS[primaryEmotion];
      
      // Place entry near its emotional region with some randomness
      const spread = isMobile ? 3 : 4;
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      );
      
      const position = attractor.position.clone().add(offset);
      initialEntryPositions.set(entry.id, position);
      initialVelocities.set(entry.id, new THREE.Vector3());
    });

    /* ==============================
       🌉 STEP 2: Place symbols between their connected emotional regions
       ============================== */
    symbolsMap.forEach((entryIds, symbol) => {
      // Find all emotional regions this symbol connects
      const emotionalCentroids: THREE.Vector3[] = [];
      
      entryIds.forEach((entryId) => {
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
          const emotion = detectPrimaryEmotion(entry.tags || []);
          emotionalCentroids.push(EMOTIONAL_ATTRACTORS[emotion].position);
        }
      });
      
      // Position symbol at the centroid of its emotional regions
      const centroid = new THREE.Vector3();
      emotionalCentroids.forEach(c => centroid.add(c));
      centroid.divideScalar(emotionalCentroids.length);
      
      // Add slight randomness
      const jitter = isMobile ? 2 : 3;
      centroid.add(new THREE.Vector3(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter
      ));
      
      initialSymbolPositions.set(symbol, centroid);
      initialVelocities.set(symbol, new THREE.Vector3());
    });

    setEntryPositions(new Map(initialEntryPositions));
    setSymbolPositions(new Map(initialSymbolPositions));
    velocities.current = initialVelocities;

    /* ==========================================
       ⚙️ STEP 3: Gentle refinement simulation
       ========================================== */
    let frame = 0;
    const maxFrames = isMobile ? 180 : 240;
    const tickInterval = 30;
    
    // Lighter forces to maintain clustering
    const repelStrength = isMobile ? 0.8 : 1.2; // Weaker repulsion to keep clusters tight
    const attractToEmotionStrength = 0.05; // Pull entries back to their emotional center
    const attractToConnectedStrength = 0.02; // Pull symbols toward their entries
    const damping = 0.88;

    const interval = setInterval(() => {
      frame++;
      if (frame > maxFrames) {
        clearInterval(interval);
        return;
      }

      const allKeys = [...initialEntryPositions.keys(), ...initialSymbolPositions.keys()];
      const forces = new Map<string, THREE.Vector3>();
      allKeys.forEach((k) => forces.set(k, new THREE.Vector3()));

      /* ==========================================
         💥 Light repulsion (avoid overlap)
         ========================================== */
      for (let i = 0; i < allKeys.length; i++) {
        for (let j = i + 1; j < allKeys.length; j++) {
          const posA =
            initialEntryPositions.get(allKeys[i]) ||
            initialSymbolPositions.get(allKeys[i]);
          const posB =
            initialEntryPositions.get(allKeys[j]) ||
            initialSymbolPositions.get(allKeys[j]);
          if (!posA || !posB) continue;

          const delta = new THREE.Vector3().subVectors(posA, posB);
          const dist = Math.max(delta.length(), 0.1);
          
          // Only repel if very close
          if (dist < 3) {
            const strength = repelStrength / (dist * dist);
            delta.normalize().multiplyScalar(strength);
            forces.get(allKeys[i])!.add(delta);
            forces.get(allKeys[j])!.sub(delta);
          }
        }
      }

      /* ==========================================
         🎯 Pull entries toward their emotional attractor
         ========================================== */
      entries.forEach((entry) => {
        const pos = initialEntryPositions.get(entry.id);
        if (!pos) return;
        
        const emotion = detectPrimaryEmotion(entry.tags || []);
        const attractor = EMOTIONAL_ATTRACTORS[emotion].position;
        
        const delta = new THREE.Vector3().subVectors(attractor, pos);
        const dist = delta.length();
        
        // Gentle pull back to emotional center
        if (dist > 2) {
          delta.normalize().multiplyScalar(attractToEmotionStrength * dist);
          forces.get(entry.id)!.add(delta);
        }
      });

      /* ==========================================
         🌉 Pull symbols toward their connected entries
         ========================================== */
      symbolsMap.forEach((entryIds, symbol) => {
        const symbolPos = initialSymbolPositions.get(symbol);
        if (!symbolPos) return;
        
        entryIds.forEach((entryId) => {
          const entryPos = initialEntryPositions.get(entryId);
          if (!entryPos) return;
          
          const delta = new THREE.Vector3().subVectors(entryPos, symbolPos);
          const dist = delta.length();
          const attraction = dist * attractToConnectedStrength;
          
          delta.normalize().multiplyScalar(attraction);
          forces.get(symbol)!.add(delta);
          forces.get(entryId)!.sub(delta.multiplyScalar(0.3));
        });
      });

      /* ==========================================
         🚀 Integrate velocities
         ========================================== */
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

/* ==============================
   🎨 Detect Primary Emotion
   ============================== */
function detectPrimaryEmotion(tags: string[]): keyof typeof EMOTIONAL_ATTRACTORS {
  if (!tags || tags.length === 0) return 'neutral';
  
  // Priority order for emotion detection
  const emotionPriority: (keyof typeof EMOTIONAL_ATTRACTORS)[] = [
    'love',
    'happy',
    'exciting',
    'grateful',
    'calm',
    'sad',
    'fear',
    'angry',
  ];
  
  for (const emotion of emotionPriority) {
    for (const tag of tags) {
      if (tag.toLowerCase().includes(emotion)) {
        return emotion;
      }
    }
  }
  
  return 'neutral';
}