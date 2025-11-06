'use client';

import { Entry } from '@/lib/types';
import { X, Calendar, Tag, Link as LinkIcon } from 'lucide-react';

export function MobileMemorySheet({
  entry,
  onClose,
}: {
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <>
      {/* Semi-transparent backdrop - you can see the viz through it! */}
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-up sheet - translucent so connections show through */}
      <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
        <div className="bg-gradient-to-b from-black/85 via-black/90 to-black/95 backdrop-blur-xl rounded-t-3xl border-t border-cyan-500/30 shadow-2xl">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-cyan-500/30 rounded-full" />
          </div>

          {/* Content */}
          <div className="px-6 pb-8 pt-2 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  {entry.anchor}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar size={14} className="text-cyan-400" />
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Memory text */}
            <div className="mb-6">
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                {entry.text}
              </p>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-pink-400" />
                  <span className="text-sm font-semibold text-gray-300">
                    Emotional Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded-full text-sm border border-pink-500/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Anchors/Nouns */}
            {entry.nouns && entry.nouns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon size={16} className="text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-300">
                    Neural Anchors
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.nouns.slice(0, 8).map((noun) => (
                    <span
                      key={noun}
                      className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-full text-sm border border-yellow-500/30"
                    >
                      {noun}
                    </span>
                  ))}
                  {entry.nouns.length > 8 && (
                    <span className="px-3 py-1.5 text-gray-400 text-sm">
                      +{entry.nouns.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                💡 Close this sheet to see the highlighted connections
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}