// components/MobileDreamSheet.tsx
import { Entry } from '@/lib/types';
import { X, Calendar, Tag, Brain } from 'lucide-react';

export function MobileDreamSheet({ 
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
        className="fixed inset-0 bg-black/70 z-40 animate-fade-in backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-gradient-to-b from-black/98 to-black/95 backdrop-blur-2xl text-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto border-t border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <div className="w-12 h-1 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 rounded-full mx-auto mb-6" />
          
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-cyan-400" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {entry.symbol}
                </h2>
              </div>
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
          
          {entry.tags && entry.tags.length > 0 && (
            <div className="border-t border-white/10 pt-5 mb-5">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                <Tag size={16} className="text-pink-400" />
                <span>Emotional Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-300 rounded-full text-sm font-medium border border-pink-500/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t border-white/10 pt-5">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
              <Brain size={16} className="text-yellow-400" />
              <span>Neural Symbols</span>
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