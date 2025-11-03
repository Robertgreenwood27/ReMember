'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { extractNouns } from '@/lib/parser';
import { addEntry, getEntriesForAnchor } from '@/lib/storage-supabase';
import { Entry } from '@/lib/types';

function WritePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const anchor = searchParams.get('anchor') || '';

  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousEntries, setPreviousEntries] = useState<Entry[]>([]);
  const [showPrevious, setShowPrevious] = useState(false);

  useEffect(() => {
    async function loadPrevious() {
      if (anchor) {
        const entries = await getEntriesForAnchor(anchor);
        setPreviousEntries(entries);
      }
    }
    loadPrevious();
  }, [anchor]);

  const handleSave = async () => {
    if (!text.trim()) {
      alert('Please write something before saving.');
      return;
    }

    setIsSaving(true);

    try {
      // Extract nouns from the text
      const nouns = extractNouns(text);

      // Create new entry
      const entry: Entry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        anchor: anchor.toLowerCase(),
        text: text,
        nouns: nouns,
        is_private: false,
      };

      // Save (will use Supabase if configured and logged in, otherwise localStorage)
      await addEntry(entry);

      // Show success message
      setShowSuccess(true);
      setText('');

      // Redirect after a moment
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (!anchor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">No anchor specified</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-16 text-center">
          <button
            onClick={handleCancel}
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-8 transition-colors"
          >
            ← Back to anchors
          </button>
          <h1 className="text-6xl font-light text-neutral-800 dark:text-neutral-100 mb-2">
            {anchor}
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

          {/* Actions */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-sm text-neutral-400">
              {text.length} characters
            </div>
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
            ✓ Memory saved! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">Loading...</div>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}
