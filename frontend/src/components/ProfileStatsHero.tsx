import React, { useMemo } from 'react';

interface Stats {
  total_skills: number;
  total_upvotes: number;
  total_downloads: number;
  tier: string;
  score: number;
}

interface Props {
  username: string;
  avatarUrl: string | null;
  backgroundUrl?: string | null;
  bio?: string;
  tier: string;
  memberSince: string;
  stats: Stats;
}

export default function ProfileStatsHero({ username, avatarUrl, backgroundUrl, bio, tier, memberSince, stats }: Props) {
  
  const getTierColor = (t: string) => {
    switch (t) {
      case 'Legend': return '#fbbf24'; // Gold
      case 'Elite': return '#a78bfa'; // Purple
      case 'Verified': return '#34d399'; // Green
      case 'Builder': return '#60a5fa'; // Blue
      default: return '#9ca3af'; // Grey
    }
  };

  const isLegend = tier === 'Legend';

  // Deterministic background generator based on username
  const generatedBackground = useMemo(() => {
    if (backgroundUrl) return null;
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40 + (Math.abs(hash) % 60)) % 360; 
    
    const color1 = `hsl(${h1}, 85%, 35%)`;
    const color2 = `hsl(${h2}, 95%, 20%)`;
    
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }, [username, backgroundUrl]);

  return (
    <div style={{
      position: 'relative',
      minHeight: '280px',
      borderRadius: 'var(--radius-xl)',
      marginBottom: 'var(--space-2xl)',
      overflow: 'hidden',
      background: backgroundUrl ? `url(${backgroundUrl}) center/cover no-repeat` : generatedBackground || 'var(--canvas)',
      border: `1px solid ${isLegend ? 'rgba(251, 191, 36, 0.4)' : 'var(--hairline-strong)'}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 'var(--space-2xl)',
      boxShadow: isLegend ? '0 0 40px rgba(251, 191, 36, 0.1)' : '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      {/* Dark gradient overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none'
      }}></div>
      
      {/* Abstract geometric overlay pattern if generated */}
      {!backgroundUrl && (
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none'
        }}></div>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2xl)', alignItems: 'center', width: '100%' }}>
        
        {/* Avatar and Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', flex: '1 1 300px' }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username} 
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: `3px solid ${getTierColor(tier)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }} 
            />
          ) : (
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'var(--canvas-strong)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '48px',
              fontWeight: 700,
              color: 'var(--mute)',
              border: `3px solid ${getTierColor(tier)}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div style={{ paddingBottom: 'var(--space-xs)' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '8px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>@{username}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '100px', 
                fontSize: '13px', 
                fontWeight: 600,
                background: `${getTierColor(tier)}44`,
                color: getTierColor(tier),
                border: `1px solid ${getTierColor(tier)}`
              }}>
                {tier} Creator
              </span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Joined {new Date(memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            {bio && (
              <p style={{ marginTop: '12px', marginBottom: 0, color: 'rgba(255,255,255,0.9)', fontSize: '15px', lineHeight: 1.5, maxWidth: '500px' }}>
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {[
            { label: 'Skills', value: stats.total_skills },
            { label: 'Downloads', value: stats.total_downloads },
            { label: 'Upvotes', value: stats.total_upvotes }
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '0 var(--space-md)' }}>
              <div style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'monospace', color: '#fff', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
