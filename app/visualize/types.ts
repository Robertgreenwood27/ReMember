// types.ts
import { Entry } from '@/lib/types';
import * as THREE from 'three';

export interface EntryNode {
  id: string;
  entry: Entry;
  position: THREE.Vector3;
}

export interface SymbolNode {
  word: string;
  position: THREE.Vector3;
  parentEntries: string[];
}

export interface NeuralConnection {
  start: THREE.Vector3;
  end: THREE.Vector3;
  type: 'noun' | 'tag';
  highlighted: boolean;
  opacity: number;
}