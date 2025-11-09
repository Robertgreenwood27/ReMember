'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getEntriesForSymbol, updateEntry } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';
import Link from 'next/link';

/* ============================================
   💬 TAG DEFINITIONS
============================================ */
const TAG_DEFINITIONS: Record<string, string> = {
  shadow: 'The unconscious aspects of yourself you hide or deny.',
  anima: 'The feminine inner archetype in a man’s psyche.',
  animus: 'The masculine inner archetype in a woman’s psyche.',
  self: 'The integrated totality of the psyche; wholeness.',
  ego: 'The conscious identity that mediates between self and world.',
  wise_old: 'The inner sage or mentor guiding you toward wisdom.',
  trickster: 'The mischievous, chaotic force that challenges norms.',
};

/* ============================================
   🏷️ CURATED TAG CATEGORIES
============================================ */
const TAG_CATEGORIES: Record<string, string[]> = {
  Mood: [
    'calm',
    'anxious',
    'ecstatic',
    'angry',
    'fearful',
    'peaceful',
    'confused',
    'joyful',
    'lonely',
  ],
  Clarity: ['lucid', 'vivid', 'fragmented', 'blurry', 'surreal'],
  Theme: [
    'falling',
    'flying',
    'pursuit',
    'transformation',
    'death',
    'birth',
    'loss',
    'discovery',
    'betrayal',
    'escape',
    'reunion',
  ],
  Archetype: [
    'shadow',
    'anima',
    'animus',
    'self',
    'ego',
    'wise_old',
    'trickster',
  ],
  Source: ['recurring', 'childhood', 'recent_event', 'stress', 'relationship'],
};

/* ============================================
   🌙 DREAMS PAGE CONTENT
============================================ */
function DreamsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get('symbol') || '';

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadEntries() {
      if (symbol) {
        const data = await getEntriesForSymbol(symbol);
        setEntries(data);
      }
      setIsLoading(false);
    }
    loadEntries();
  }, [symbol]);

  const toggleExpanded = (id: string) =>
    setExpandedEntry(expandedEntry === id ? null : id);

  const handleSaveEdit = async (entryId: string) => {
    try {
      await updateEntry(entryId, editText, editTags);
      const updated = await getEntriesForSymbol(symbol);
      setEntries(updated);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry. Please try again.');
    }
  };

  if (!symbol) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">No symbol specified</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">Loading dreams...</div>
      </div>
    );
  }

  /* ============================================
     🧠 RENDER
  ============================================= */
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          {/* Entries List */}
<div className="space-y-6">
  {entries.length === 0 ? (
    <div className="text-neutral-500 dark:text-neutral-400 text-center py-20">
      No dreams recorded for this symbol yet.
    </div>
  ) : (
    entries.map((entry) => (
      <div
        key={entry.id}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 transition hover:shadow-md"
      >
        {/* Date */}
        <div className="text-xs text-neutral-400 mb-2">
          {new Date(entry.date).toLocaleString()}
        </div>

        {/* View Mode */}
        {editingEntry !== entry.id ? (
          <>
            <div
              className="text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap cursor-pointer"
              onClick={() => toggleExpanded(entry.id)}
            >
              {expandedEntry === entry.id
                ? entry.text
                : entry.text.slice(0, 200) + (entry.text.length > 200 ? '…' : '')}
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-full"
                  >
                    #{tag.replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setEditingEntry(entry.id);
                  setEditText(entry.text);
                  setEditTags(entry.tags || []);
                }}
                className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Edit
              </button>
            </div>
          </>
        ) : (
          /* Edit Mode */
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-40 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md text-neutral-800 dark:text-neutral-100 resize-none"
            />
            <div>
              <h4 className="text-xs text-neutral-400 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {Object.values(TAG_CATEGORIES)
                  .flat()
                  .map((tag) => {
                    const isSelected = editTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          setEditTags((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                        className={`px-2 py-1 text-xs rounded-full border transition ${
                          isSelected
                            ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        #{tag.replaceAll('_', ' ')}
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(entry.id)}
                className="px-4 py-1 text-sm bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    ))
  )}
</div>

          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-6 inline-block transition-colors"
          >
            ← Back to symbols
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-5xl font-light text-neutral-800 dark:text-neutral-100 break-words">
              {symbol}
            </h1>
            <Link
              href={`/write?symbol=${encodeURIComponent(symbol)}`}
              className="px-6 py-2 text-sm bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              + Write New
            </Link>
          </div>

          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {entries.length} {entries.length === 1 ? 'dream' : 'dreams'}
          </p>
        </header>

        {/* Rest of file unchanged — your editing, tag picker, etc. */}
      </div>
    </div>
  );
}

/* ============================================
   EXPORT
============================================ */
export default function DreamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="text-neutral-500">Loading...</div>
        </div>
      }
    >
      <DreamsPageContent />
    </Suspense>
  );
}
