'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { addEntry, getEntriesForSymbol } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';

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
   📝 WRITE PAGE CONTENT
============================================ */
function WritePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get('symbol') || '';

  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousEntries, setPreviousEntries] = useState<Entry[]>([]);
  const [showPrevious, setShowPrevious] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadPrevious() {
      if (symbol) {
        const entries = await getEntriesForSymbol(symbol);
        setPreviousEntries(entries);
      }
    }
    loadPrevious();
  }, [symbol]);

  /* ---------- SAVE ENTRY ---------- */
  const handleSave = async () => {
    if (!text.trim()) {
      alert('Please write something before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/extract-symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to extract symbols');
      const data = await response.json();
      const nouns = data.symbols || [];

      const entry: Entry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        symbol: symbol.toLowerCase(),
        text,
        nouns,
        is_private: false,
        tags: selectedTags,
      };

      await addEntry(entry);

      setShowSuccess(true);
      setText('');
      setSelectedTags([]);
      setTimeout(() => router.push('/'), 1000);
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.push('/');

  if (!symbol) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">No symbol specified</div>
      </div>
    );
  }

  /* ============================================
     🧠 RENDER
  ============================================= */
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-16 text-center">
          <button
            onClick={handleCancel}
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-8 transition-colors"
          >
            ← Back to symbols
          </button>
          <h1 className="text-6xl font-light text-neutral-800 dark:text-neutral-100 mb-2">
            {symbol}
          </h1>

          {previousEntries.length > 0 && (
            <button
              onClick={() => setShowPrevious(!showPrevious)}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showPrevious ? 'Hide' : 'Show'} {previousEntries.length} previous{' '}
              {previousEntries.length === 1 ? 'entry' : 'entries'}
            </button>
          )}
        </header>

        {/* Previous Entries */}
        {showPrevious && previousEntries.length > 0 && (
          <div className="mb-8 space-y-4">
            {previousEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
              >
                <div className="text-xs text-neutral-400 mb-2">
                  {new Date(entry.date).toLocaleDateString()}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3">
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Writing Area */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write freely..."
            className="w-full h-96 p-4 text-neutral-800 dark:text-neutral-200 bg-transparent border-none outline-none resize-none text-lg leading-relaxed"
            autoFocus
          />

          {/* === TAG PICKER === */}
          <div className="mt-6">
            <h3 className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              Select dream tags:
            </h3>

            <div className="space-y-5">
              {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category}>
                  <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
                    {category}
                  </div>

                  {category === 'Archetype' && (
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-500 italic mb-1">
                      Tap twice for meaning
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      const definition = TAG_DEFINITIONS[tag];

                      return (
                        <div key={tag} className="relative group">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTags((prev) =>
                                prev.includes(tag)
                                  ? prev.filter((t) => t !== tag)
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

                          {/* Tooltip (hover/focus) */}
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
              ))}
            </div>

            {selectedTags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs rounded-full flex items-center gap-2"
                  >
                    #{tag.replaceAll('_', ' ')}
                    <button
                      onClick={() =>
                        setSelectedTags((prev) =>
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

          {/* Actions */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-sm text-neutral-400">{text.length} characters</div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !text.trim()}
                className="px-6 py-2 text-sm bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mt-6 text-center text-sm text-green-600 dark:text-green-400">
            ✓ Dream saved! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   EXPORT
============================================ */
export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="text-neutral-500">Loading...</div>
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}
