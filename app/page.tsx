'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadData } from '@/lib/storage-supabase';
import { Node } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Menu } from 'lucide-react';

/* ============================
   Dream Home Component
============================ */
export default function DreamHome() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [symbolsWithDreams, setSymbolsWithDreams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entriesCount, setEntriesCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  /* ---------- localStorage for info panel ---------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('infoOpen');
      if (stored === 'true') setInfoOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('infoOpen', String(infoOpen));
    }
  }, [infoOpen]);

  /* ---------- Load data ---------- */
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const data = await loadData();

      const uniqueNodes = Array.from(
        new Map(data.nodes.map((n) => [n.word.toLowerCase(), n])).values()
      ).sort((a, b) => b.count - a.count);

      setNodes(uniqueNodes);
      setEntriesCount(data.entries.length);
      const symbols = Array.from(new Set(data.entries.map((e) => e.symbol.toLowerCase())));
      setSymbolsWithDreams(symbols);
      setIsLoading(false);
    }

    if (!authLoading && user) fetchData();
    else if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleNewAnchor = () => {
    const word = prompt('Enter a new dream symbol:');
    if (word?.trim()) router.push(`/write?symbol=${encodeURIComponent(word.trim())}`);
  };

  const getFontSize = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-3xl sm:text-5xl';
    if (ratio > 0.5) return 'text-2xl sm:text-4xl';
    if (ratio > 0.3) return 'text-xl sm:text-2xl';
    return 'text-base sm:text-lg';
  };
  const maxCount = Math.max(...nodes.map((n) => n.count), 1);

  /* ---------- Loading screen ---------- */
  if (isLoading || authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-zinc-500">
        Loading your dreamscape...
      </div>
    );
  }

  /* ---------- MAIN RETURN ---------- */
  return (
    <>
      {/* ==== STARFIELD (fixed, behind everything) ==== */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Main layer */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/stars.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            backgroundPosition: '0 0',
            animation: 'floatStars 600s linear infinite',
          }}
        />
        {/* Slower secondary layer */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "url('/stars.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            backgroundPosition: '0 0',
            animation: 'floatStars2 900s linear infinite',
          }}
        />
      </div>

      {/* ==== PAGE CONTENT ==== */}
      <div className="relative min-h-screen flex flex-col md:flex-row overflow-hidden text-zinc-300 font-light">

        {/* ---- Sidebar (desktop) ---- */}
        <aside className="hidden md:block w-64 border-r border-zinc-800 bg-zinc-900/30 backdrop-blur p-6">
          <h2 className="text-lg font-medium text-zinc-400 mb-4">Symbols with Dreams</h2>
          {symbolsWithDreams.length === 0 ? (
            <p className="text-sm text-zinc-600">No dreams yet.</p>
          ) : (
            <ul className="space-y-2">
              {symbolsWithDreams.map((s) => (
                <li key={s}>
                  <Link
                    href={`/dreams?symbol=${encodeURIComponent(s)}`}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ---- Main area ---- */}
        <main className="flex-1 relative p-6 sm:p-10">

          {/* Mobile menu */}
          <div className="md:hidden mb-6">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-300 rounded-md border border-zinc-700 hover:bg-zinc-800 transition"
            >
              <Menu size={18} />
              Symbols
            </button>

            {menuOpen && (
              <div className="mt-2 bg-zinc-900/80 rounded-lg border border-zinc-800 p-4">
                <h2 className="text-sm font-medium text-zinc-400 mb-2">Symbols with Dreams</h2>
                {symbolsWithDreams.length === 0 ? (
                  <p className="text-sm text-zinc-500">No dreams yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {symbolsWithDreams.map((s) => (
                      <li key={s}>
                        <Link
                          href={`/dreams?symbol=${encodeURIComponent(s)}`}
                          className="block text-sm text-zinc-400 hover:text-white transition"
                          onClick={() => setMenuOpen(false)}
                        >
                          {s}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Header */}
          <header className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl sm:text-6xl font-extralight text-white mb-3 tracking-wide">
              Noctis
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 italic">
              A dream map of your subconscious.
            </p>
            {/* Action buttons */}
              <div className="text-center mt-8 flex flex-wrap justify-center gap-3 mb-30">
                <button
                  onClick={handleNewAnchor}
                  className="px-6 py-2 text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-full hover:bg-zinc-800 transition"
                >
                  + New Symbol
                </button>
                <Link
                  href="/visualize"
                  className="px-6 py-2 text-sm bg-white text-black rounded-full hover:bg-zinc-200 transition"
                >
                  Enter the Dream Map
                </Link>
              </div>
          </header>

          

          {/* Info panel */}
          <details
            open={infoOpen}
            onToggle={(e) => setInfoOpen(e.currentTarget.open)}
            className="group bg-zinc-900/30 backdrop-blur rounded-xl p-4 border border-zinc-800 mb-8"
          >
            <summary className="flex justify-between cursor-pointer list-none">
              <span className="text-sm font-medium text-zinc-300">What is Noctis?</span>
              <svg
                className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="mt-3 text-sm text-zinc-400 leading-relaxed space-y-3">
              <p>
                <strong>Symbols</strong> are recurring motifs in your dreams — people, places, feelings.
                Each dream adds to their gravity, forming constellations of meaning.
              </p>
              <p>
                <strong>Tags</strong> let you mark dreams by theme or tone —{' '}
                <code className="bg-zinc-800 rounded px-1 py-0.5 text-xs">lucid</code>,{' '}
                <code className="bg-zinc-800 rounded px-1 py-0.5 text-xs mx-1">nightmare</code>,{' '}
                <code className="bg-zinc-800 rounded px-1 py-0.5 text-xs">prophetic</code> — helping you trace patterns.
              </p>
            </div>
          </details>

          {/* No symbols yet */}
          {nodes.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-zinc-500 mb-8">No dream symbols yet. Start by recording your first dream.</p>
              <button
                onClick={handleNewAnchor}
                className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition"
              >
                Record Dream
              </button>
            </div>
          ) : (
            <>
              {/* Symbol cloud */}
              <div className="flex flex-wrap justify-center gap-4 mb-10 text-center">
                {nodes.map((node) => (
                  <span
                    key={node.word}
                    className={`${getFontSize(node.count, maxCount)} text-zinc-400 hover:text-white/80 transition-colors`}
                  >
                    {node.word}
                    <span className="text-xs text-zinc-700 ml-1">{node.count}</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Stats */}
          {nodes.length > 0 && (
            <div className="mt-12 text-center text-xs text-zinc-500">
              {nodes.length} symbols · {entriesCount} dream{entriesCount !== 1 ? 's' : ''}
            </div>
          )}
        </main>
      </div>
    </>
  );
}