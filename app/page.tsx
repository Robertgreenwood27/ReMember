'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadData } from '@/lib/storage-supabase';
import { Node } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Menu } from 'lucide-react'; // npm i lucide-react

/* 🌀 Weighted random helper */
function weightedRandom(nodes: Node[], count = 40): Node[] {
  const weighted: Node[] = [];
  nodes.forEach((node) => {
    const weight = Math.max(1, node.count);
    for (let i = 0; i < weight; i++) weighted.push(node);
  });

  const result: Node[] = [];
  const used = new Set<string>();
  while (result.length < count && weighted.length > 0) {
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    if (!used.has(pick.word)) {
      result.push(pick);
      used.add(pick.word);
    }
  }
  return result;
}

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [anchorsWithMemories, setAnchorsWithMemories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entriesCount, setEntriesCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false); // ✅ start safe (no SSR access)

  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();

  /* 🧠 Load dropdown state only on client */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('infoOpen');
      if (stored === 'true') setInfoOpen(true);
    }
  }, []);

  /* 🧠 Save dropdown state changes */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('infoOpen', String(infoOpen));
    }
  }, [infoOpen]);

  /* 🧠 Fetch Supabase data and randomize anchors */
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const data = await loadData();
      const randomized = weightedRandom(data.nodes, 40);
      setNodes(randomized);
      setEntriesCount(data.entries.length);

      const anchors = Array.from(
        new Set(data.entries.map((e) => e.anchor.toLowerCase()))
      );
      setAnchorsWithMemories(anchors);
      setIsLoading(false);
    }

    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleAnchorClick = (word: string) => {
    router.push(`/write?anchor=${encodeURIComponent(word)}`);
  };

  const handleNewAnchor = () => {
    const word = prompt('Enter a new anchor word:');
    if (word && word.trim()) {
      router.push(`/write?anchor=${encodeURIComponent(word.trim())}`);
    }
  };

  const handleRefreshAnchors = () => {
    setNodes((prev) => weightedRandom(prev, 40));
  };

  const getFontSize = (count: number, maxCount: number) => {
    if (maxCount === 1) return 'text-base sm:text-lg';
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-3xl sm:text-4xl';
    if (ratio > 0.5) return 'text-2xl sm:text-3xl';
    if (ratio > 0.3) return 'text-xl sm:text-2xl';
    if (ratio > 0.15) return 'text-lg sm:text-xl';
    return 'text-base sm:text-lg';
  };

  const maxCount = Math.max(...nodes.map((n) => n.count), 1);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col md:flex-row">
      {/* 🔹 Sidebar (Desktop only) */}
      <aside className="hidden md:block w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 p-6 overflow-y-auto">
        <h2 className="text-lg font-medium text-neutral-700 dark:text-neutral-200 mb-4">
          🧭 Anchors with Memories
        </h2>
        {anchorsWithMemories.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No memories yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {anchorsWithMemories.map((anchor) => (
              <li key={anchor}>
                <Link
                  href={`/memories?anchor=${encodeURIComponent(anchor)}`}
                  className="block text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  {anchor}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* 🔹 Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative">
        {/* Mobile dropdown trigger */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
          >
            <Menu size={18} />
            Anchors
          </button>

          {menuOpen && (
            <div className="mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
              <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                🧭 Anchors with Memories
              </h2>
              {anchorsWithMemories.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No memories yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {anchorsWithMemories.map((anchor) => (
                    <li key={anchor}>
                      <Link
                        href={`/memories?anchor=${encodeURIComponent(anchor)}`}
                        className="block text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        {anchor}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 🧠 Header */}
        <header className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 mb-6">
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-800 dark:text-neutral-100 mb-3">
                🧠 ReMind
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
                A self-growing map of personal memory
              </p>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-end gap-2 items-center">
              {user && (
                <>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 w-full sm:w-auto text-center sm:text-right">
                    {user.email}
                  </div>
                  <Link
                    href="/settings"
                    className="px-4 py-2 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 🧩 Info Dropdown */}
        <div className="mb-8">
          <details
            open={infoOpen}
            onToggle={(e) => setInfoOpen(e.currentTarget.open)}
            className="group bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 transition-all border border-neutral-200 dark:border-neutral-700"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                What am I looking at you ask?
              </span>
              <svg
                className="w-4 h-4 text-neutral-500 group-open:rotate-180 transition-transform"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-3">
              <p>
                <strong>Anchors</strong> are words or ideas that connect related memories.
                Each time you write about something, the app extracts important nouns and
                builds links between them — gradually forming a map of your thoughts.
              </p>
              <p>
                <strong>Tags</strong> are optional labels you can add, like
                <code className="px-1 py-0.5 mx-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">cringy</code>,
                <code className="px-1 py-0.5 mx-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">private</code>,
                or
                <code className="px-1 py-0.5 mx-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">funny</code>.
                They help you find memories by emotion, tone, or theme later.
              </p>
              <p>
                You can edit any memory, add or remove tags, and explore connected anchors
                to see how your ideas and experiences intertwine over time.
              </p>
            </div>
          </details>
        </div>

        {/* 🔹 Anchor Cloud */}
        {nodes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">
              No anchors yet. Start by creating your first memory.
            </p>
            <button
              onClick={handleNewAnchor}
              className="px-8 py-3 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              Create First Anchor
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2 mb-8 text-center">
              {nodes.map((node) => (
                <button
                  key={node.word}
                  onClick={() => handleAnchorClick(node.word)}
                  className={`${getFontSize(
                    node.count,
                    maxCount
                  )} font-light text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer px-3 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md`}
                >
                  {node.word}
                  <span className="text-xs text-neutral-400 dark:text-neutral-600 ml-1">
                    {node.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center gap-3 flex-wrap">
              <button
                onClick={handleNewAnchor}
                className="px-6 py-2 text-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                + New Anchor
              </button>
              <button
                onClick={handleRefreshAnchors}
                className="px-6 py-2 text-sm bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-full hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors"
              >
                🔄 Refresh Anchors
              </button>
              <Link
  href="/visualize"
  className="px-6 py-2 text-sm bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
>
  Mine my Mind
</Link>

            </div>
          </>
        )}

        {/* Stats */}
        {nodes.length > 0 && (
          <div className="mt-12 sm:mt-20 text-center text-xs sm:text-sm text-neutral-400 dark:text-neutral-600">
            <p>
              {nodes.length} anchor{nodes.length !== 1 ? 's' : ''} ·{' '}
              {entriesCount} memor{entriesCount !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
