import React from 'react';

export type AvatarTier = 'free' | 'standard' | 'premium' | 'exclusive';

interface AvatarBadgeProps {
  url: string;
  tier?: AvatarTier;
  size?: number;
  alt?: string;
}

export default function AvatarBadge({ url, tier = 'free', size = 36, alt = 'Avatar' }: AvatarBadgeProps) {
  const getTierClasses = () => {
    switch (tier) {
      case 'exclusive':
        return 'p-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[spin_4s_linear_infinite]';
      case 'premium':
        return 'p-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]';
      case 'standard':
        return 'p-[2px] bg-zinc-500';
      case 'free':
      default:
        return 'p-0';
    }
  };

  return (
    <div className={`inline-flex rounded-full ${tier === 'exclusive' ? 'relative overflow-hidden' : getTierClasses()}`}>
      {tier === 'exclusive' && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[spin_4s_linear_infinite]"></div>
      )}
      <div className={tier === 'exclusive' ? 'p-[3px] relative z-10 rounded-full' : ''}>
         <img 
          src={url} 
          alt={alt}
          className="rounded-full object-cover bg-zinc-900"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </div>
    </div>
  );
}
