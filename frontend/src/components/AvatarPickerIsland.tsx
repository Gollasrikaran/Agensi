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
    <div style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: 'var(--border-radius-card)', padding: '24px' }}>
      <h2 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Choose Avatar</h2>
      

        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Left: Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AvatarBadge 
              url={`https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}`}
              size={120}
            />
            <button 
              onClick={handleRandomize}
              style={{ background: 'var(--bg-tertiary)', border: 'var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer' }}
            >
              🎲 Randomize
            </button>
            <button 
              onClick={handleSaveFree}
              disabled={loading}
              style={{ background: 'var(--accent-gradient)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {loading ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>
          
          {/* Right: Style Grid */}
          <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
            {FREE_STYLES.map(style => (
              <div 
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: selectedStyle === style.id ? 'var(--bg-tertiary)' : 'transparent',
                  border: selectedStyle === style.id ? '1px solid var(--accent-primary)' : '1px solid var(--bg-tertiary)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <img 
                  src={`https://api.dicebear.com/9.x/${style.id}/svg?seed=preview`} 
                  alt={style.label} 
                  style={{ width: '48px', height: '48px', marginBottom: '8px' }} 
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{style.label}</div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
