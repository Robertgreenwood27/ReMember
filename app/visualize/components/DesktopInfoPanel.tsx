import { Entry } from '@/lib/types';
import { X } from 'lucide-react';

export function DesktopInfoPanel({ 
  entry, 
  onClose 
}: { 
  entry: Entry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="absolute top-6 right-6 z-10 bg-black/90 backdrop-blur-md text-white p-5 rounded-lg max-w-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-blue-300 mb-1">{entry.anchor}</h2>
          <p className="text-xs text-gray-400">
            {new Date(entry.date).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <p className="text-sm mb-3 leading-relaxed">{entry.text}</p>
      
      <div className="flex flex-wrap gap-1.5">
        {entry.nouns.map((noun, i) => (
          <span 
            key={i}
            className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs"
          >
            {noun}
          </span>
        ))}
      </div>
    </div>
  );
}