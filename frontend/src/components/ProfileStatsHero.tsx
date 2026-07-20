import React, { useMemo } from 'react';

interface ProfileStatsHeroProps {
  user: {
    username: string;
    avatar_url?: string;
    background_url?: string;
    created_at?: string;
  };
  stats?: {
    totalSales: number;
    skillsCount: number;
  };
}

export default function ProfileStatsHero({ user, stats }: ProfileStatsHeroProps) {
  // Deterministic background generator based on username
  const generatedBackground = useMemo(() => {
    if (user.background_url) return null;
    
    let hash = 0;
    for (let i = 0; i < user.username.length; i++) {
      hash = user.username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate two colors based on the hash
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40 + (Math.abs(hash) % 60)) % 360; // analog/triadic-ish
    
    const color1 = `hsl(${h1}, 85%, 35%)`;
    const color2 = `hsl(${h2}, 95%, 20%)`;
    
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }, [user.username, user.background_url]);

  return (
    <div style={{
      position: 'relative',
      minHeight: '280px',
      borderRadius: 'var(--radius-xl)',
      marginBottom: 'var(--space-2xl)',
      overflow: 'hidden',
      background: user.background_url ? `url(${user.background_url}) center/cover no-repeat` : generatedBackground || 'var(--canvas)',
      border: '1px solid var(--hairline-strong)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 'var(--space-2xl)'
    }}>
      {/* Dark gradient overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
        pointerEvents: 'none'
      }}></div>
      
      {/* Abstract geometric overlay pattern if generated */}
      {!user.background_url && (
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none'
        }}></div>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div style={{
          width: '120px', 
          height: '120px', 
          borderRadius: '50%',
          background: user.avatar_url ? `url(${user.avatar_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary), #9b5cff)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '48px', 
          fontWeight: 700, 
          color: '#fff', 
          flexShrink: 0,
          border: '4px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          {!user.avatar_url && user.username[0].toUpperCase()}
        </div>
        
        <div style={{ flex: 1, paddingBottom: 'var(--space-xs)' }}>
          <h1 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '36px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            @{user.username}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-md)', color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
            {user.created_at && (
              <span>Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            )}
            {stats && (
              <>
                <span>•</span>
                <span><strong>{stats.skillsCount}</strong> Skills published</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
