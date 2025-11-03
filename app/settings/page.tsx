'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadData } from '@/lib/storage-supabase';
import { Node } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Menu } from 'lucide-react'; // optional: install `lucide-react`

export default function Home() {
  // ... your existing state and hooks ...

  const [menuOpen, setMenuOpen] = useState(false);

  // ... existing fetchData useEffect ...

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
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
          >
            <Menu size={18} />
            Anchors
          </button>

          {/* Dropdown menu */}
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

        {/* 🧠 Rest of your main content here (ReMind header, anchor cloud, etc.) */}
      </main>
    </div>
  );
}
