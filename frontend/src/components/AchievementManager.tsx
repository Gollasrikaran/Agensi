import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/config';
import { supabase } from '../lib/supabase';

export default function AchievementManager() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_BASE}/api/users/me/achievements`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setAchievements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = async (id: string, currentPublic: boolean, is_admin_awarded: boolean) => {
    if (is_admin_awarded) {
      alert("Admin-awarded trust badges are permanently public and cannot be hidden.");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/api/users/me/achievements/${id}/privacy`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_public: !currentPublic })
      });
      fetchAchievements(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading achievements...</div>;

  return (
    <div className="glass-card" style={{ marginTop: 'var(--space-2xl)' }}>
      <h2 style={{ marginBottom: 'var(--space-xs)' }}>Your Achievements</h2>
      <p style={{ color: 'var(--mute)', marginBottom: 'var(--space-lg)' }}>
        Manage which achievements are visible on your public profile.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
        {achievements.map(ach => (
          <div 
            key={ach.id} 
            style={{ 
              padding: 'var(--space-md)', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-lg)',
              opacity: ach.is_unlocked ? 1 : 0.4,
              filter: ach.is_unlocked ? 'none' : 'grayscale(100%)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px' }}>{ach.icon_url}</span>
              <h3 style={{ fontSize: '16px', margin: 0 }}>{ach.title}</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--mute)', marginBottom: '16px', flexGrow: 1 }}>
              {ach.description}
            </p>
            
            {ach.is_unlocked ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hairline)', paddingTop: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--mute)' }}>
                  Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}
                </span>
                
                <button 
                  onClick={() => togglePrivacy(ach.id, ach.is_public, ach.is_admin_awarded)}
                  className={`btn btn-sm ${ach.is_public ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ opacity: ach.is_admin_awarded ? 0.5 : 1, padding: '4px 8px' }}
                >
                  {ach.is_admin_awarded ? '🔒 Public Only' : (ach.is_public ? '👁️ Public' : '🙈 Private')}
                </button>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '12px', fontSize: '12px', color: 'var(--mute)', textAlign: 'center' }}>
                Locked
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
