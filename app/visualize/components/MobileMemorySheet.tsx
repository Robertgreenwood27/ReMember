// MobileMemorySheet.tsx
import { Entry } from '@/lib/types';
import { X, Calendar, Tag } from 'lucide-react';

export function MobileMemorySheet({ 
  entry, 
  onClose 
}: { 
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-gradient-to-b from-black/95 to-black/98 backdrop-blur-xl text-white rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto border-t border-white/20">
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
          
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-2">
                {entry.anchor}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar size={14} />
                <span>
                  {new Date(entry.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={22} />
            </button>
          </div>
          
          <p className="text-base mb-6 leading-relaxed text-gray-200">
            {entry.text}
          </p>
          
          <div className="border-t border-white/10 pt-5">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
              <Tag size={16} />
              <span>Connected Anchors</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.nouns.map((noun, i) => (
                <span 
                  key={i}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 rounded-full text-sm font-medium border border-yellow-500/30"
                >
                  {noun}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}