import React, { useState } from 'react';
import AvatarBadge from './AvatarBadge';

const FREE_STYLES = [
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'bottts', label: 'Bottts' },
  { id: 'avataaars', label: 'Avataaars' },
  { id: 'thumbs', label: 'Thumbs' },
  { id: 'fun-emoji', label: 'Fun Emoji' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'initials', label: 'Initials' },
  { id: 'identicon', label: 'Identicon' },
  { id: 'rings', label: 'Rings' },
  { id: 'glass', label: 'Glass' }
];

export default function AvatarPickerIsland({ userId, currentUsername, onAvatarSelect }: { userId: string, currentUsername: string, onAvatarSelect?: (url: string) => void }) {
  const [selectedStyle, setSelectedStyle] = useState('pixel-art');
  const [seed, setSeed] = useState(currentUsername || 'bodhic');
  const [loading, setLoading] = useState(false);


  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const handleSaveFree = async () => {
    const url = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}`;
    setLoading(true);
    if (onAvatarSelect) {
      onAvatarSelect(url);
    }
    setLoading(false);
  };

  return (
    <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
      <h2 className="text-zinc-100 mt-0 text-xl font-semibold mb-6">Choose Avatar</h2>
      

        <div className="flex gap-8 flex-col md:flex-row">
          {/* Left: Preview */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <AvatarBadge 
              url={`https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}`}
              size={120}
            />
            <button 
              onClick={handleRandomize}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              🎲 Randomize
            </button>
            <button 
              onClick={handleSaveFree}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>
          
          {/* Right: Style Grid */}
          <div className="flex-[2] grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
            {FREE_STYLES.map(style => (
              <div 
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-xl cursor-pointer text-center transition-all ${selectedStyle === style.id ? 'bg-indigo-500/10 border border-indigo-500/50' : 'bg-transparent border border-zinc-800 hover:bg-zinc-800/50'}`}
              >
                <img 
                  src={`https://api.dicebear.com/9.x/${style.id}/svg?seed=preview`} 
                  alt={style.label} 
                  className="w-12 h-12 mb-2 mx-auto"
                />
                <div className="text-xs text-zinc-400">{style.label}</div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
