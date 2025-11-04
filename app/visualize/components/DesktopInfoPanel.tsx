// DesktopInfoPanel.tsx
import { Entry } from '@/lib/types';
import { X, Calendar, Tag } from 'lucide-react';

export function DesktopInfoPanel({ 
  entry, 
  onClose 
}: { 
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="absolute top-6 right-6 z-10 bg-gradient-to-br from-black/90 to-black/80 backdrop-blur-xl text-white p-6 rounded-2xl max-w-md border border-white/20 shadow-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-2">
            {entry.anchor}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={14} />
            <span>
              {new Date(entry.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90 duration-300"
        >
          <X size={18} />
        </button>
      </div>
      
      <p className="text-sm mb-5 leading-relaxed text-gray-200">
        {entry.text}
      </p>
      
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          <Tag size={14} />
          <span>Connected Anchors</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {entry.nouns.map((noun, i) => (
            <span 
              key={i}
              className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 rounded-full text-xs font-medium border border-yellow-500/30 hover:border-yellow-400/50 transition-colors"
            >
              {noun}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}