'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useState, useMemo, useRef } from 'react';
import { loadData } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';
import * as THREE from 'three';
import { Info, Search, X, Sparkles, Brain, Zap } from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile';
import { NeuralGraph } from './components/NeuralGraph';
import { MobileDreamSheet } from './components/MobileDreamSheet';
import { DesktopInfoPanel } from './components/DesktopInfoPanel';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

/* ==============================
   🎛️ VISUAL PAGE SETTINGS PANEL
   ============================== */
const VISUAL_PAGE_SETTINGS = {
  // 🪐 Camera
  camera: {
    fovDesktop: 55,
    fovMobile: 65,
    positionDesktop: [0, 0, 24],
    positionMobile: [0, 0, 18],
  },

  // 🌫️ Fog
  fog: {
    color: '#000000',
    near: 10,
    far: 50,
  },

  // 🌟 Stars
  stars: {
    radius: 120,
    depth: 60,
    countDesktop: 3000,
    countMobile: 1500,
    factor: 4.5,
    speed: 0.5,
  },

  // 💡 Lighting
  lighting: {
    ambientIntensityDesktop: 0.3,
    ambientIntensityMobile: 0.4,
    pointMainIntensityDesktop: 0.9,
    pointMainIntensityMobile: 0.7,
    mainColor: '#4ecdc4',
    secondaryLights: [
      { position: [-10, -10, -10], intensity: 0.6, color: '#ff6b9d' },
      { position: [0, 20, 0], intensity: 0.7, color: '#ffd93d' },
      { position: [15, -5, 15], intensity: 0.5, color: '#a78bfa' },
    ],
  },

  // 💫 Postprocessing
  bloom: {
    intensity: 1.2,
    threshold: 0.3,
    smoothing: 0.9,
  },
  chromaticAberration: {
    offset: [0.0005, 0.0005],
  },

  // 🌀 Controls
  orbit: {
    rotateSpeedDesktop: 0.4,
    rotateSpeedMobile: 0.6,
    zoomSpeedDesktop: 0.9,
    zoomSpeedMobile: 1.2,
    minDistanceDesktop: 10,
    minDistanceMobile: 8,
    maxDistanceDesktop: 70,
    maxDistanceMobile: 45,
  },
};

export default function NeuralVisualizationPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const isMobile = useIsMobile();
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<any>(null);

  /* ==============================
     🧠 Load Data
     ============================== */
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

  /* ==============================
     🔍 Search Filtering
     ============================== */
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter((e) =>
      e.text.toLowerCase().includes(query) ||
      e.symbol.toLowerCase().includes(query) ||
      e.nouns.some((n) => n.toLowerCase().includes(query)) ||
      (e.tags && e.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }, [entries, searchQuery]);

  const selectedEntryData = useMemo(
    () => entries.find((e) => e.id === selectedEntry) || null,
    [entries, selectedEntry]
  );
  const hoveredEntryData = useMemo(
    () => entries.find((e) => e.id === hoveredEntry) || null,
    [entries, hoveredEntry]
  );

  const handleRandomDream = () => {
    if (filteredEntries.length === 0) return;
    const randomEntry =
      filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
    setSelectedEntry(randomEntry.id);
  };

  /* ==============================
     ⏳ Loading & Empty States
     ============================== */
  if (loading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-b-transparent rounded-full animate-spin"
              style={{
                animationDirection: 'reverse',
                animationDuration: '1.5s',
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Brain className="text-cyan-400" />
            <span>Initializing Neural Network...</span>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center px-6">
          <Brain size={64} className="mx-auto mb-4 text-cyan-400" />
          <div className="text-2xl mb-2">No Neural Dreams</div>
          <div className="text-gray-400">
            Start creating entries to build your dream network
          </div>
        </div>
      </div>
    );
  }

  const totalSymbols = new Set(entries.flatMap((e) => e.nouns)).size;
  const totalTags = new Set(entries.flatMap((e) => e.tags || [])).size;

  /* ==============================
     🌌 Main Visualization
     ============================== */
  return (
    <div className="w-screen h-screen bg-black relative touch-none overflow-hidden">
      {/* 🧭 UI Panels (mobile + desktop) */}
      {isMobile ? (
        <MobileUI
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showInfo={showInfo}
          setShowInfo={setShowInfo}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredEntries={filteredEntries}
          selectedEntryData={selectedEntryData}
          setSelectedEntry={setSelectedEntry}
        />
      ) : (
        <DesktopUI
          filteredEntries={filteredEntries}
          totalSymbols={totalSymbols}
          totalTags={totalTags}
          hoveredEntryData={hoveredEntryData}
          selectedEntryData={selectedEntryData}
          setSelectedEntry={setSelectedEntry}
          handleRandomDream={handleRandomDream}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* 🧠 Neural Canvas */}
      <Canvas
        camera={{
          position: isMobile
            ? (VISUAL_PAGE_SETTINGS.camera.positionMobile as [number, number, number])
            : (VISUAL_PAGE_SETTINGS.camera.positionDesktop as [number, number, number]),
          fov: isMobile
            ? VISUAL_PAGE_SETTINGS.camera.fovMobile
            : VISUAL_PAGE_SETTINGS.camera.fovDesktop,
        }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog
          attach="fog"
          args={[
            VISUAL_PAGE_SETTINGS.fog.color,
            VISUAL_PAGE_SETTINGS.fog.near,
            VISUAL_PAGE_SETTINGS.fog.far,
          ]}
        />
        <Stars
          radius={VISUAL_PAGE_SETTINGS.stars.radius}
          depth={VISUAL_PAGE_SETTINGS.stars.depth}
          count={
            isMobile
              ? VISUAL_PAGE_SETTINGS.stars.countMobile
              : VISUAL_PAGE_SETTINGS.stars.countDesktop
          }
          factor={VISUAL_PAGE_SETTINGS.stars.factor}
          saturation={0}
          fade
          speed={VISUAL_PAGE_SETTINGS.stars.speed}
        />

        {/* Lighting setup */}
        <ambientLight
          intensity={
            isMobile
              ? VISUAL_PAGE_SETTINGS.lighting.ambientIntensityMobile
              : VISUAL_PAGE_SETTINGS.lighting.ambientIntensityDesktop
          }
        />
        <pointLight
          position={[10, 10, 10]}
          intensity={
            isMobile
              ? VISUAL_PAGE_SETTINGS.lighting.pointMainIntensityMobile
              : VISUAL_PAGE_SETTINGS.lighting.pointMainIntensityDesktop
          }
          color={VISUAL_PAGE_SETTINGS.lighting.mainColor}
        />
        {!isMobile &&
          VISUAL_PAGE_SETTINGS.lighting.secondaryLights.map((l, i) => (
            <pointLight
              key={i}
              position={l.position as [number, number, number]}
              intensity={l.intensity}
              color={l.color}
            />
          ))}

        <NeuralGraph
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
          dampingFactor={0.04}
          rotateSpeed={
            isMobile
              ? VISUAL_PAGE_SETTINGS.orbit.rotateSpeedMobile
              : VISUAL_PAGE_SETTINGS.orbit.rotateSpeedDesktop
          }
          zoomSpeed={
            isMobile
              ? VISUAL_PAGE_SETTINGS.orbit.zoomSpeedMobile
              : VISUAL_PAGE_SETTINGS.orbit.zoomSpeedDesktop
          }
          minDistance={
            isMobile
              ? VISUAL_PAGE_SETTINGS.orbit.minDistanceMobile
              : VISUAL_PAGE_SETTINGS.orbit.minDistanceDesktop
          }
          maxDistance={
            isMobile
              ? VISUAL_PAGE_SETTINGS.orbit.maxDistanceMobile
              : VISUAL_PAGE_SETTINGS.orbit.maxDistanceDesktop
          }
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />

        {!isMobile && (
          <EffectComposer>
            <Bloom
              intensity={VISUAL_PAGE_SETTINGS.bloom.intensity}
              luminanceThreshold={VISUAL_PAGE_SETTINGS.bloom.threshold}
              luminanceSmoothing={VISUAL_PAGE_SETTINGS.bloom.smoothing}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={VISUAL_PAGE_SETTINGS.chromaticAberration.offset}
            />
          </EffectComposer>
        )}
      </Canvas>

      {/* 🎨 Minor Animations */}
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
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        body {
          margin: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

/* 🧭 Subcomponents for clarity (MobileUI / DesktopUI) */
/* You can inline them or keep them in separate files — included here for completeness. */

function MobileUI({
  showSearch,
  setShowSearch,
  showInfo,
  setShowInfo,
  searchQuery,
  setSearchQuery,
  filteredEntries,
  selectedEntryData,
  setSelectedEntry,
}: any) {
  return (
    <>
      {/* mobile header & search/info overlays */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
        <div className="bg-black/80 backdrop-blur-xl text-white px-4 py-2.5 rounded-2xl flex-1 border border-cyan-500/20">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <span className="text-cyan-300">{filteredEntries.length}</span>
            <span className="text-gray-400">neurons</span>
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="bg-black/80 p-3 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40"
        >
          <Search size={18} />
        </button>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="bg-black/80 p-3 rounded-2xl border border-purple-500/20 hover:border-purple-500/40"
        >
          <Info size={18} />
        </button>
      </div>
      {showSearch && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search neural dreams..."
              className="w-full bg-black/90 text-white pl-12 pr-4 py-3.5 rounded-2xl border border-cyan-500/30 focus:border-cyan-500/60 focus:outline-none"
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
        <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-black/95 to-gray-900/95 text-white p-6 rounded-3xl max-w-sm border border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Brain className="text-cyan-400" size={20} />
                Neural Interface
              </h2>
              <button onClick={() => setShowInfo(false)} className="p-2">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <p><span className="text-cyan-300">Cyan neurons</span> are your dreams</p>
              <p><span className="text-yellow-300">Yellow nodes</span> are neural symbols</p>
              <p><span className="text-pink-300">Pink connections</span> link emotional tags</p>
              <p>Watch the <span className="text-white font-medium">electrical pulses</span> flow</p>
            </div>
          </div>
        </div>
      )}
      <MobileDreamSheet entry={selectedEntryData} onClose={() => setSelectedEntry(null)} />
    </>
  );
}

function DesktopUI({
  filteredEntries,
  totalSymbols,
  totalTags,
  hoveredEntryData,
  selectedEntryData,
  setSelectedEntry,
  handleRandomDream,
  searchQuery,
  setSearchQuery,
}: any) {
  return (
    <>
      {/* Sidebar info + search + stats */}
      <div className="absolute top-6 left-6 z-10 bg-black/80 p-6 rounded-3xl max-w-sm border border-cyan-500/20 text-white">
        <h1 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Brain className="text-cyan-400" size={24} />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Neural Dream Network
          </span>
        </h1>
        <div className="text-sm text-gray-300 mb-4 space-y-1">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <span>
              <span className="text-cyan-300 font-semibold">{filteredEntries.length}</span> neurons
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-yellow-400" />
            <span>
              <span className="text-yellow-300 font-semibold">{totalSymbols}</span> symbols
            </span>
          </div>
          {totalTags > 0 && (
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-pink-400" />
              <span>
                <span className="text-pink-300 font-semibold">{totalTags}</span> emotional tags
              </span>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search neural dreams..."
            className="w-full bg-black/60 text-white pl-10 pr-3 py-2.5 rounded-xl border border-cyan-500/30 focus:border-cyan-500/60 focus:outline-none text-sm"
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

        {/* Random dream */}
        <button
          onClick={handleRandomDream}
          className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 hover:border-cyan-400/50 text-cyan-300 px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 mb-4"
        >
          <Sparkles size={16} />
          Random Neural Dream
        </button>

        {/* Legend */}
        <div className="text-xs text-gray-400 space-y-2 border-t border-white/10 pt-4">
          <p><span className="text-cyan-300">Cyan neurons</span> store dreams</p>
          <p><span className="text-yellow-300">Yellow nodes</span> are neural symbols</p>
          <p><span className="text-pink-300">Pink connections</span> link emotions</p>
        </div>
      </div>

      {/* Hover info */}
      {hoveredEntryData && !selectedEntryData && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-black/90 text-white px-5 py-3 rounded-xl max-w-sm text-center border border-cyan-500/30">
          <div className="text-sm font-semibold text-cyan-300 flex items-center justify-center gap-2">
            <Zap size={14} /> {hoveredEntryData.symbol}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(hoveredEntryData.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      )}
      <DesktopInfoPanel entry={selectedEntryData} onClose={() => setSelectedEntry(null)} />
    </>
  );
}