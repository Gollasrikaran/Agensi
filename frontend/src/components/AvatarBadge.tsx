import React from 'react';

export type AvatarTier = 'free' | 'standard' | 'premium' | 'exclusive';

interface AvatarBadgeProps {
  url: string;
  tier?: AvatarTier;
  size?: number;
  alt?: string;
}

export default function AvatarBadge({ url, tier = 'free', size = 36, alt = 'Avatar' }: AvatarBadgeProps) {
  
  const getRingStyle = (): React.CSSProperties => {
    switch (tier) {
      case 'exclusive':
        return {
          background: 'var(--ring-exclusive)',
          padding: '3px',
          animation: 'shimmer 2s infinite linear'
        };
      case 'premium':
        return {
          background: 'var(--ring-premium)',
          padding: '2px',
          boxShadow: '0 0 10px var(--ring-premium)'
        };
      case 'standard':
        return {
          background: 'var(--ring-standard)',
          padding: '2px'
        };
      case 'free':
      default:
        return {
          padding: '0px'
        };
    }
  };

  return (
    <div 
      className={`avatar-badge-container tier-${tier}`}
      style={{
        display: 'inline-flex',
        borderRadius: '50%',
        ...getRingStyle()
      }}
    >
      <img 
        src={url} 
        alt={alt}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          background: 'var(--bg-tertiary)'
        }}
      />
      {tier === 'exclusive' && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { filter: hue-rotate(0deg) brightness(1); }
            50% { filter: hue-rotate(30deg) brightness(1.3); }
            100% { filter: hue-rotate(0deg) brightness(1); }
          }
        `}} />
      )}
    </div>
  );
}
