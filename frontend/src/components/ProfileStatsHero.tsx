import React, { useState, useEffect } from 'react';
import AvatarBadge, { type AvatarTier } from './AvatarBadge';
import StreakBadge from './StreakBadge';
import SkillPulseGraph from './SkillPulseGraph';
import PulseComparisonIsland from './PulseComparisonIsland';
import { supabase } from '../lib/supabase';

interface UserProfile {
  username: string;
  avatar_url: string;
  avatar_tier: AvatarTier;
  streak: number;
  pulse_score: number;
  total_skills: number;
  total_sales: number;
  is_verified: boolean;
  is_private: boolean;
  join_date: string;
}

export default function ProfileStatsHero({ profile }: { profile: UserProfile }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').select('username').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data?.username) setCurrentUser(data.username);
          });
      }
    });
  }, []);

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '32px',
        background: 'var(--bg-secondary)',
        border: 'var(--glass-border)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--card-shadow)'
      }}>
        
        {/* Top: Identity Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          
          <AvatarBadge 
            url={profile.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${profile.username}`} 
            tier={profile.avatar_tier}
            size={120} 
          />
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '32px' }}>
                @{profile.username}
              </h1>
              {profile.is_verified && (
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '4px 10px', borderRadius: 'var(--border-radius-pill)', fontSize: '12px', fontWeight: 'bold' }}>
                  🛡️ Verified Creator
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <span>Joined {profile.join_date}</span>
              <span><strong>{profile.total_skills}</strong> Skills Published</span>
              <span><strong>{profile.total_sales}</strong> Total Sales</span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <StreakBadge streak={profile.streak} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-tertiary)',
                border: 'var(--glass-border)',
                padding: '4px 12px',
                borderRadius: 'var(--border-radius-pill)',
                color: 'var(--accent-primary)',
                fontSize: '13px',
                fontWeight: 'bold'
              }}>
                ⭐ {profile.pulse_score} Pulse Score
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ background: 'var(--bg-tertiary)', border: 'var(--glass-border)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer', fontWeight: 'bold' }}>
              Follow
            </button>
            <button style={{ background: 'var(--accent-gradient)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer', fontWeight: 'bold' }}>
              Sponsor ☕
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: 'var(--glass-border)', margin: '0' }} />

        {/* Bottom: Activity Graph */}
        {profile.is_private ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mute)' }}>
            🔒 Skill pulse activity is private
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Skill Pulse Activity</h3>
              {currentUser && currentUser !== profile.username && (
                <button 
                  onClick={() => setShowCompare(!showCompare)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  {showCompare ? 'Hide Comparison' : 'Compare with your Pulse →'}
                </button>
              )}
            </div>
            
            {showCompare && currentUser ? (
              <PulseComparisonIsland currentUser={currentUser} targetUser={profile.username} />
            ) : (
              <SkillPulseGraph username={profile.username} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
