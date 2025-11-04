import { Entry } from '@/lib/types';
import * as THREE from 'three';

export interface EntryNode {
  id: string;
  entry: Entry;
  position: THREE.Vector3;
}

export interface AnchorNode {
  word: string;
  position: THREE.Vector3;
  parentEntries: string[];
}