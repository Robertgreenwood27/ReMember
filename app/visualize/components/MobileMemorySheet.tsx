import { Entry } from '@/lib/types';
import { X } from 'lucide-react';

export function MobileMemorySheet({ 
  entry, 
  onClose 
}: { 
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="bg-black/95 backdrop-blur-lg text-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-blue-300 mb-1">{entry.anchor}</h2>
            <p className="text-sm text-gray-400">
              {new Date(entry.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-base mb-4 leading-relaxed">{entry.text}</p>
        
        <div className="flex flex-wrap gap-2">
          {entry.nouns.map((noun, i) => (
            <span 
              key={i}
              className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm"
            >
              {noun}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}