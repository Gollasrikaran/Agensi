import React from 'react';

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
  bio?: string;
  tier: string;
  memberSince: string;
  stats: Stats;
}

export default function ProfileStatsHero({ username, avatarUrl, bio, tier, memberSince, stats }: Props) {
  
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

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${isLegend ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-2xl)',
      boxShadow: isLegend ? '0 0 40px rgba(251, 191, 36, 0.1)' : '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2xl)', alignItems: 'center' }}>
        
        {/* Avatar and Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', flex: '1 1 300px' }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username} 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: `3px solid ${getTierColor(tier)}`
              }} 
            />
          ) : (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'var(--canvas-strong)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '32px',
              color: 'var(--mute)',
              border: `3px solid ${getTierColor(tier)}`
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <h1 style={{ fontSize: '36px', marginBottom: '8px', color: 'var(--ink)' }}>@{username}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '100px', 
                fontSize: '13px', 
                fontWeight: 600,
                background: `${getTierColor(tier)}22`,
                color: getTierColor(tier),
                border: `1px solid ${getTierColor(tier)}44`
              }}>
                {tier} Creator
              </span>
              <span style={{ color: 'var(--mute)', fontSize: '14px' }}>
                Joined {new Date(memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            {bio && (
              <p style={{ marginTop: '12px', marginBottom: 0, color: 'var(--body)', fontSize: '15px', lineHeight: 1.5, maxWidth: '500px' }}>
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
              <div style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--ink)', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
