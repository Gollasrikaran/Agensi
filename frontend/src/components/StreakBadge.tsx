import React from 'react';

export default function StreakBadge({ streak = 0 }: { streak: number }) {
  if (streak === 0) return null;

  const isHot = streak >= 30;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: isHot ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
      border: isHot ? '1px solid rgba(245, 158, 11, 0.4)' : 'var(--glass-border)',
      padding: '4px 12px',
      borderRadius: 'var(--border-radius-pill)',
      color: isHot ? 'var(--warning)' : 'var(--text-primary)',
      fontSize: '13px',
      fontWeight: 'bold',
      boxShadow: isHot ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none'
    }}>
      <span 
        style={{ 
          fontSize: '16px',
          animation: isHot ? 'flicker 1.5s infinite alternate' : 'none'
        }}
      >
        🔥
      </span>
      {streak} Day Streak

      {isHot && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes flicker {
            0% { transform: scale(1) rotate(-5deg); opacity: 0.9; }
            50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
            100% { transform: scale(1) rotate(-5deg); opacity: 0.9; }
          }
        `}} />
      )}
    </div>
  );
}
