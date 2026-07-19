import React from 'react';

export default function AchievementShowcase({ achievements }: { achievements: any[] }) {
  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-lg)', color: 'var(--ink)' }}>
        Achievements
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        {achievements.map((ach) => (
          <div 
            key={ach.id} 
            title={`${ach.title} - ${ach.description} (Unlocked: ${new Date(ach.unlocked_at).toLocaleDateString()})`}
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: ach.is_admin_awarded ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'default',
              boxShadow: ach.is_admin_awarded ? '0 0 15px rgba(251, 191, 36, 0.2)' : 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              if (!ach.is_admin_awarded) {
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (!ach.is_admin_awarded) {
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <span style={{ fontSize: '24px' }}>{ach.icon_url}</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>{ach.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
