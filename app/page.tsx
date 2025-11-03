'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadData } from '@/lib/storage-supabase';
import { Node } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

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
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();

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
    if (maxCount === 1) return 'text-lg';
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-4xl';
    if (ratio > 0.5) return 'text-3xl';
    if (ratio > 0.3) return 'text-2xl';
    if (ratio > 0.15) return 'text-xl';
    return 'text-lg';
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 p-6 overflow-y-auto">
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

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <div className="flex justify-between items-start mb-6">
              <div className="text-center flex-1">
                <h1 className="text-5xl font-light text-neutral-800 dark:text-neutral-100 mb-3">
                  🧠 ReMind
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  A self-growing map of personal memory
                </p>
              </div>

              <div className="flex gap-2 items-center">
                {user && (
                  <>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
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

          {/* Anchor Cloud */}
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
              <div className="flex flex-wrap gap-4 justify-center items-center mb-8">
                {nodes.map((node) => (
                  <button
                    key={node.word}
                    onClick={() => handleAnchorClick(node.word)}
                    className={`${getFontSize(
                      node.count,
                      maxCount
                    )} font-light text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded`}
                  >
                    {node.word}
                    <span className="text-xs text-neutral-400 dark:text-neutral-600 ml-1">
                      {node.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-center mt-12 flex justify-center gap-3 flex-wrap">
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
              </div>
            </>
          )}

          {/* Stats */}
          {nodes.length > 0 && (
            <div className="mt-20 text-center text-sm text-neutral-400 dark:text-neutral-600">
              <p>
                {nodes.length} anchor{nodes.length !== 1 ? 's' : ''} ·{' '}
                {entriesCount} memor{entriesCount !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
