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
};

/* ============================================
   🏷️ CURATED TAG CATEGORIES
============================================ */
const TAG_CATEGORIES: Record<string, string[]> = {
  Mood: ['calm', 'anxious', 'ecstatic', 'angry', 'fearful', 'peaceful'],
  Clarity: ['lucid', 'vivid', 'fragmented', 'blurry'],
  Theme: [
    'falling',
    'flying',
    'pursuit',
    'transformation',
    'death',
    'birth',
    'loss',
    'discovery',
  ],
  Archetype: ['shadow', 'anima', 'animus', 'self', 'ego'],
  Source: ['recurring', 'childhood', 'recent_event'],
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

        {/* Dreams List */}
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">
              No dreams yet for this symbol.
            </p>
            <Link
              href={`/write?symbol=${encodeURIComponent(symbol)}`}
              className="px-8 py-3 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors inline-block"
            >
              Write First Dream
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => {
              const isExpanded = expandedEntry === entry.id;
              const isEditing = editingEntry === entry.id;
              const preview = entry.text.substring(0, 200);
              const needsExpansion = entry.text.length > 200;

              return (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header (date + edit) */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex gap-2">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingEntry(entry.id);
                            setEditText(entry.text);
                            setEditTags(entry.tags || []);
                          }}
                          className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {entry.phase && (
                        <span className="text-xs px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full">
                          {entry.phase}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content / Editor */}
                  <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-sm border border-neutral-200 dark:border-neutral-600"
                          rows={6}
                        />

                        {/* Curated Tag Picker */}
                        <div className="mt-4">
                          <h3 className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                            Select dream tags:
                          </h3>

                          <div className="space-y-5">
                            {Object.entries(TAG_CATEGORIES).map(
                              ([category, tags]) => (
                                <div key={category}>
                                  <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
                                    {category}
                                  </div>

                                  {category === 'Archetype' && (
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-500 italic mb-1">
                                      Tap twice for meaning
                                    </p>
                                  )}

                                  {/* Tags with Tooltips */}
                                  <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => {
                                      const isSelected =
                                        editTags.includes(tag);
                                      const definition = TAG_DEFINITIONS[tag];

                                      return (
                                        <div
                                          key={tag}
                                          className="relative group"
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditTags((prev) =>
                                                prev.includes(tag)
                                                  ? prev.filter(
                                                      (t) => t !== tag
                                                    )
                                                  : [...prev, tag]
                                              )
                                            }
                                            className={`px-3 py-1 rounded-full text-xs border transition ${
                                              isSelected
                                                ? 'bg-neutral-800 text-white border-neutral-700 dark:bg-neutral-100 dark:text-neutral-900'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                            }`}
                                          >
                                            #{tag.replaceAll('_', ' ')}
                                          </button>

                                          {/* Tooltip */}
                                          {definition && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-xs text-neutral-200 bg-zinc-800 dark:bg-zinc-700 p-2 rounded-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300 z-20">
                                              {definition}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {editTags.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                              {editTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs rounded-full flex items-center gap-2"
                                >
                                  #{tag.replaceAll('_', ' ')}
                                  <button
                                    onClick={() =>
                                      setEditTags((prev) =>
                                        prev.filter((t) => t !== tag)
                                      )
                                    }
                                    className="text-neutral-400 hover:text-neutral-600"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : isExpanded || !needsExpansion ? (
                      <p className="whitespace-pre-wrap">{entry.text}</p>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {preview}
                        {needsExpansion && '...'}
                      </p>
                    )}
                  </div>

                  {/* Edit Controls */}
                  {isEditing ? (
                    <div className="flex flex-wrap gap-3 mt-3">
                      <button
                        onClick={() => handleSaveEdit(entry.id)}
                        className="px-4 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="px-4 py-1 text-sm bg-neutral-300 dark:bg-neutral-700 rounded-full hover:bg-neutral-400 dark:hover:bg-neutral-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    needsExpansion && (
                      <button
                        onClick={() => toggleExpanded(entry.id)}
                        className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                      >
                        {isExpanded ? '↑ Show less' : '↓ Read more'}
                      </button>
                    )
                  )}

                  {/* Tags display */}
                  {!isEditing && (entry.tags?.length ?? 0) > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags!.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs rounded-full"
                        >
                          #{tag.replaceAll('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Connected Symbols */}
                  {entry.nouns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
                        Connected symbols:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.nouns
                          .filter((noun) => noun !== symbol.toLowerCase())
                          .slice(0, 10)
                          .map((noun) => (
                            <Link
                              key={noun}
                              href={`/dreams?symbol=${encodeURIComponent(
                                noun
                              )}`}
                              className="text-xs px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                            >
                              {noun}
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
