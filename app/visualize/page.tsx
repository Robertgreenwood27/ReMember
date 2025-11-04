// page.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useState, useMemo, useRef } from 'react';
import { loadData } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { Info, Search, X, Sparkles, Calendar } from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile';
import { NetworkGraph } from './components/NetworkGraph';
import { MobileMemorySheet } from './components/MobileMemorySheet';
import { DesktopInfoPanel } from './components/DesktopInfoPanel';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function VisualizationPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const isMobile = useIsMobile();
  const cameraRef = useRef<THREE.Camera>();
  const controlsRef = useRef<any>();

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

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(e => 
      e.text.toLowerCase().includes(query) ||
      e.anchor.toLowerCase().includes(query) ||
      e.nouns.some(n => n.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  const selectedEntryData = useMemo(() => {
    return entries.find(e => e.id === selectedEntry) || null;
  }, [entries, selectedEntry]);

  const hoveredEntryData = useMemo(() => {
    return entries.find(e => e.id === hoveredEntry) || null;
  }, [entries, hoveredEntry]);

  const handleRandomMemory = () => {
    if (filteredEntries.length === 0) return;
    const randomEntry = filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
    setSelectedEntry(randomEntry.id);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <div>Loading your memories...</div>
        </div>
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
      {isMobile ? (
        <>
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
            <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex-1">
              <div className="text-sm font-semibold">
                🧠 <span className="text-blue-300">{filteredEntries.length}</span> memories
              </div>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/80 transition-colors"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/80 transition-colors"
            >
              <Info size={18} />
            </button>
          </div>

          {showSearch && (
            <div className="absolute top-20 left-4 right-4 z-10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memories..."
                  className="w-full bg-black/80 backdrop-blur-md text-white pl-12 pr-4 py-3 rounded-full border border-white/10 focus:border-blue-400/50 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

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
                  <div>• Pinch to zoom, two fingers to rotate</div>
                  <div>• Use search to filter memories</div>
                </div>
              </div>
            </div>
          )}

          <MobileMemorySheet 
            entry={selectedEntryData}
            onClose={() => setSelectedEntry(null)}
          />
        </>
      ) : (
        <>
          <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md text-white p-5 rounded-xl max-w-xs border border-white/10">
            <h1 className="text-xl font-bold mb-3 flex items-center gap-2">
              🧠 Memory Network
            </h1>
            <p className="text-sm text-gray-300 mb-4">
              <span className="text-blue-300 font-semibold">{filteredEntries.length}</span> memories • 
              <span className="text-yellow-300 font-semibold"> {totalAnchors}</span> anchors
            </p>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="w-full bg-black/40 text-white pl-10 pr-3 py-2 rounded-lg border border-white/10 focus:border-blue-400/50 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleRandomMemory}
              className="w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles size={16} />
              Random Memory
            </button>

            <div className="text-xs text-gray-400 space-y-1.5 border-t border-white/10 pt-4">
              <div>• <span className="text-blue-300">Blue spheres</span> = Memories</div>
              <div>• <span className="text-yellow-300">Yellow nodes</span> = Anchor words</div>
              <div>• Click a memory to read it</div>
              <div>• Drag to rotate, scroll to zoom</div>
            </div>
          </div>

          {hoveredEntryData && !selectedEntry && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg max-w-xs text-center pointer-events-none">
              <div className="text-sm font-semibold text-blue-300">{hoveredEntryData.anchor}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(hoveredEntryData.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          )}

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
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera;
        }}
      >
        <color attach="background" args={['#0a0a0a']} />
        
        <Stars radius={100} depth={50} count={isMobile ? 1000 : 2000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={isMobile ? 0.6 : 0.5} />
        <pointLight position={[10, 10, 10]} intensity={isMobile ? 0.8 : 1} />
        {!isMobile && (
          <>
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />
            <pointLight position={[0, 15, 0]} intensity={0.6} color="#ffd93d" />
          </>
        )}

        <NetworkGraph 
          entries={filteredEntries}
          selectedEntry={selectedEntry}
          hoveredEntry={hoveredEntry}
          onSelectEntry={setSelectedEntry}
          onHoverEntry={setHoveredEntry}
          isMobile={isMobile}
        />

        <OrbitControls 
          ref={controlsRef}
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

        {!isMobile && (
          <EffectComposer>
            <Bloom 
              intensity={0.5}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
            />
          </EffectComposer>
        )}
      </Canvas>

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