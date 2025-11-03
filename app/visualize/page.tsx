'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import { useEffect, useState, useRef, useMemo } from 'react';
import { loadData } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { X, Info } from 'lucide-react';

interface EntryNode {
  id: string;
  entry: Entry;
  position: THREE.Vector3;
}

interface AnchorNode {
  word: string;
  position: THREE.Vector3;
  parentEntries: string[];
}

// Detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Force-directed graph simulation
function useForceSimulation(entries: Entry[], isMobile: boolean) {
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

// Entry node component
function EntryNodeComponent({ 
  entry, 
  position, 
  onClick,
  isHighlighted,
  isDimmed,
  isMobile
}: { 
  entry: Entry;
  position: THREE.Vector3;
  onClick: () => void;
  isHighlighted: boolean;
  isDimmed: boolean;
  isMobile: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      const scale = isHighlighted ? 1.4 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      
      if (isHighlighted) {
        meshRef.current.rotation.y += 0.01;
      }
    }

    // Make text face camera
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const opacity = isDimmed ? 0.2 : 1;
  const textOpacity = isDimmed ? 0.15 : 0.9;
  const color = isHighlighted ? '#ff6b6b' : '#88ccff';
  const size = isMobile ? 0.35 : 0.4;
  const fontSize = isMobile ? 0.2 : 0.25;
  const labelOffset = isMobile ? 0.5 : 0.6;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[size, isMobile ? 16 : 32, isMobile ? 16 : 32]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.6 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      {/* Label text */}
      <Text
        ref={textRef}
        position={[0, labelOffset, 0]}
        fontSize={fontSize}
        color={isHighlighted ? '#ff6b6b' : '#88ccff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        fillOpacity={textOpacity}
      >
        {entry.anchor}
      </Text>
    </group>
  );
}

// Anchor node component
function AnchorNodeComponent({ 
  word, 
  position, 
  isHighlighted,
  isDimmed,
  count,
  isMobile
}: { 
  word: string;
  position: THREE.Vector3;
  isHighlighted: boolean;
  isDimmed: boolean;
  count: number;
  isMobile: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      const scale = isHighlighted ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }

    // Make text face camera
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const size = Math.min(0.15 + count * 0.02, isMobile ? 0.25 : 0.3);
  const opacity = isDimmed ? 0.15 : 0.8;
  const textOpacity = isDimmed ? 0.1 : 0.7;
  const color = isHighlighted ? '#4ecdc4' : '#ffd93d';
  const fontSize = isMobile ? 0.15 : 0.18;
  const labelOffset = isMobile ? 0.35 : 0.4;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, isMobile ? 12 : 16, isMobile ? 12 : 16]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.5 : 0.2}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      {/* Label text */}
      <Text
        ref={textRef}
        position={[0, labelOffset, 0]}
        fontSize={fontSize}
        color={isHighlighted ? '#4ecdc4' : '#ffd93d'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000000"
        fillOpacity={textOpacity}
      >
        {word}
      </Text>
    </group>
  );
}

// Connection lines
function ConnectionLines({ 
  entries, 
  entryPositions,
  anchorPositions,
  highlightedEntry,
  isMobile
}: { 
  entries: Entry[];
  entryPositions: Map<string, THREE.Vector3>;
  anchorPositions: Map<string, THREE.Vector3>;
  highlightedEntry: string | null;
  isMobile: boolean;
}) {
  const lines = useMemo(() => {
    const result: Array<{ start: THREE.Vector3; end: THREE.Vector3; opacity: number; highlighted: boolean }> = [];
    
    entries.forEach((entry) => {
      const entryPos = entryPositions.get(entry.id);
      if (!entryPos) return;

      entry.nouns.forEach((noun) => {
        const anchorPos = anchorPositions.get(noun);
        if (!anchorPos) return;

        const isRelated = highlightedEntry === entry.id;
        const opacity = highlightedEntry ? (isRelated ? 0.7 : 0.03) : (isMobile ? 0.2 : 0.3);
        
        result.push({
          start: entryPos,
          end: anchorPos,
          opacity,
          highlighted: isRelated
        });
      });
    });

    return result;
  }, [entries, entryPositions, anchorPositions, highlightedEntry, isMobile]);

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.start, line.end]}
          color={line.highlighted ? '#4ecdc4' : '#666666'}
          lineWidth={line.highlighted ? 2.5 : 1}
          transparent
          opacity={line.opacity}
        />
      ))}
    </>
  );
}

// Main network graph
function NetworkGraph({ 
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
          <EntryNodeComponent
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
          <AnchorNodeComponent
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

// Mobile bottom sheet for memory details
function MobileMemorySheet({ 
  entry, 
  onClose 
}: { 
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="bg-black/95 backdrop-blur-lg text-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-blue-300 mb-1">{entry.anchor}</h2>
            <p className="text-sm text-gray-400">
              {new Date(entry.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-base mb-4 leading-relaxed">{entry.text}</p>
        
        <div className="flex flex-wrap gap-2">
          {entry.nouns.map((noun, i) => (
            <span 
              key={i}
              className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm"
            >
              {noun}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Desktop info panel
function DesktopInfoPanel({ 
  entry, 
  onClose 
}: { 
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="absolute top-6 right-6 z-10 bg-black/90 backdrop-blur-md text-white p-5 rounded-lg max-w-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-blue-300 mb-1">{entry.anchor}</h2>
          <p className="text-xs text-gray-400">
            {new Date(entry.date).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <p className="text-sm mb-3 leading-relaxed">{entry.text}</p>
      
      <div className="flex flex-wrap gap-1.5">
        {entry.nouns.map((noun, i) => (
          <span 
            key={i}
            className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs"
          >
            {noun}
          </span>
        ))}
      </div>
    </div>
  );
}

// Main page
export default function VisualizationPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await loadData();
        setEntries(data.entries);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedEntryData = useMemo(() => {
    return entries.find(e => e.id === selectedEntry) || null;
  }, [entries, selectedEntry]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your memories...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-white text-center px-6">
          <div className="text-2xl mb-2">No memories yet</div>
          <div className="text-gray-400">Start creating entries to see your memory network</div>
        </div>
      </div>
    );
  }

  const totalAnchors = new Set(entries.flatMap(e => e.nouns)).size;

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 relative touch-none">
      {/* Mobile: Compact header with info button */}
      {isMobile ? (
        <>
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full">
              <div className="text-sm font-semibold">
                🧠 <span className="text-blue-300">{entries.length}</span> memories
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/80 transition-colors"
            >
              <Info size={20} />
            </button>
          </div>

          {/* Info overlay */}
          {showInfo && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-black/90 backdrop-blur-md text-white p-6 rounded-2xl max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">How to Use</h2>
                  <button onClick={() => setShowInfo(false)} className="p-2">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <div>• <span className="text-blue-300">Blue spheres</span> are your memories</div>
                  <div>• <span className="text-yellow-300">Yellow nodes</span> are anchor words</div>
                  <div>• Tap a memory to read it</div>
                  <div>• Pinch to zoom</div>
                  <div>• Two fingers to rotate</div>
                </div>
              </div>
            </div>
          )}

          {/* Memory details bottom sheet */}
          <MobileMemorySheet 
            entry={selectedEntryData}
            onClose={() => setSelectedEntry(null)}
          />
        </>
      ) : (
        <>
          {/* Desktop: Full info panel */}
          <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md text-white p-4 rounded-lg max-w-xs">
            <h1 className="text-xl font-bold mb-2">🧠 Memory Network</h1>
            <p className="text-sm text-gray-300 mb-3">
              <span className="text-blue-300 font-semibold">{entries.length}</span> memories • 
              <span className="text-yellow-300 font-semibold"> {totalAnchors}</span> anchors
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• <span className="text-blue-300">Blue spheres</span> = Memories</div>
              <div>• <span className="text-yellow-300">Yellow nodes</span> = Anchor words</div>
              <div>• Click a memory to read it</div>
              <div>• Drag to rotate, scroll to zoom</div>
            </div>
          </div>

          {/* Memory details panel */}
          <DesktopInfoPanel 
            entry={selectedEntryData}
            onClose={() => setSelectedEntry(null)}
          />
        </>
      )}

      <Canvas 
        camera={{ 
          position: [0, 0, isMobile ? 15 : 20], 
          fov: isMobile ? 60 : 50 
        }}
        gl={{ 
          antialias: !isMobile,
          alpha: false,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#0a0a0a']} />
        
        {/* Simplified lighting for mobile */}
        <ambientLight intensity={isMobile ? 0.6 : 0.5} />
        <pointLight position={[10, 10, 10]} intensity={isMobile ? 0.8 : 1} />
        {!isMobile && (
          <>
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />
            <pointLight position={[0, 15, 0]} intensity={0.6} color="#ffd93d" />
          </>
        )}

        {/* Graph */}
        <NetworkGraph 
          entries={entries}
          selectedEntry={selectedEntry}
          onSelectEntry={setSelectedEntry}
          isMobile={isMobile}
        />

        {/* Touch-friendly controls */}
        <OrbitControls 
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={isMobile ? 0.7 : 0.5}
          zoomSpeed={isMobile ? 1 : 0.8}
          minDistance={isMobile ? 6 : 8}
          maxDistance={isMobile ? 40 : 60}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
        />
      </Canvas>

      {/* Add slide-up animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}