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
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

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

  const addTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim().toLowerCase())) {
      setEditTags([...editTags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleSaveEdit = async (entryId: string) => {
    try {
      await updateEntry(entryId, editText, editTags);
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-6 inline-block transition-colors"
          >
            ← Back to anchors
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl sm:text-5xl font-light text-neutral-800 dark:text-neutral-100 break-words">
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

                        {/* Tag editor */}
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs rounded-full flex items-center gap-2"
                              >
                                #{tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="text-neutral-400 hover:text-neutral-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === 'Enter' && (e.preventDefault(), addTag())
                              }
                              placeholder="Add a tag..."
                              className="flex-1 px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700"
                            />
                            <button
                              onClick={addTag}
                              className="px-3 py-2 text-sm bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200"
                            >
                              Add
                            </button>
                          </div>
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
                  {!isEditing && entry.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
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
