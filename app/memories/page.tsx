'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getEntriesForAnchor, updateEntry } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';
import Link from 'next/link';

function MemoriesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const anchor = searchParams.get('anchor') || '';

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    async function loadEntries() {
      if (anchor) {
        const data = await getEntriesForAnchor(anchor);
        setEntries(data);
      }
      setIsLoading(false);
    }
    loadEntries();
  }, [anchor]);

  const toggleExpanded = (id: string) => {
    setExpandedEntry(expandedEntry === id ? null : id);
  };

  const handleSaveEdit = async (entryId: string) => {
    try {
      await updateEntry(entryId, editText);
      const updated = await getEntriesForAnchor(anchor);
      setEntries(updated);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry. Please try again.');
    }
  };

  if (!anchor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">No anchor specified</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">Loading memories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-8 inline-block transition-colors"
          >
            ← Back to anchors
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-5xl font-light text-neutral-800 dark:text-neutral-100">
              {anchor}
            </h1>
            <Link
              href={`/write?anchor=${encodeURIComponent(anchor)}`}
              className="px-6 py-2 text-sm bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              + Write New
            </Link>
          </div>

          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {entries.length} {entries.length === 1 ? 'memory' : 'memories'}
          </p>
        </header>

        {/* Memories List */}
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">
              No memories yet for this anchor.
            </p>
            <Link
              href={`/write?anchor=${encodeURIComponent(anchor)}`}
              className="px-8 py-3 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors inline-block"
            >
              Write First Memory
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
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-sm border border-neutral-200 dark:border-neutral-600"
                        rows={6}
                      />
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
                    <div className="flex gap-3 mt-3">
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

                  {/* Connected Anchors */}
                  {entry.nouns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
                        Connected anchors:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.nouns
                          .filter((noun) => noun !== anchor.toLowerCase())
                          .slice(0, 10)
                          .map((noun) => (
                            <Link
                              key={noun}
                              href={`/memories?anchor=${encodeURIComponent(noun)}`}
                              className="text-xs px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                            >
                              {noun}
                            </Link>
                          ))}
                        {entry.nouns.filter((noun) => noun !== anchor.toLowerCase()).length >
                          10 && (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            +
                            {
                              entry.nouns.filter(
                                (noun) => noun !== anchor.toLowerCase()
                              ).length - 10
                            }{' '}
                            more
                          </span>
                        )}
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

export default function MemoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="text-neutral-500">Loading...</div>
        </div>
      }
    >
      <MemoriesPageContent />
    </Suspense>
  );
}
