'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useState, useMemo } from 'react';
import { loadData } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { Info } from 'lucide-react';
import { X } from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile';
import { NetworkGraph } from './components/NetworkGraph';
import { MobileMemorySheet } from './components/MobileMemorySheet';
import { DesktopInfoPanel } from './components/DesktopInfoPanel';

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