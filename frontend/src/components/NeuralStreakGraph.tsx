import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/config';

interface Props {
  username: string;
}

export default function NeuralStreakGraph({ username }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/users/${username}/activity`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [username]);

  if (loading || !data) return null;

  // Process activity into a map of YYYY-MM-DD -> count
  const activityMap: Record<string, number> = {};
  data.activity.forEach((act: any) => {
    const dateStr = new Date(act.created_at).toISOString().split('T')[0];
    activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
  });

  // Generate last 90 days grid
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: activityMap[dateStr] || 0
    });
  }

  const { streaks } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--ink)' }}>Neural Pulse</h2>
        <div style={{ display: 'flex', gap: 'var(--space-xl)', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)' }}>{streaks.current_streak} <span style={{fontSize: '16px'}}>days</span></div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '1px' }}>Longest</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)' }}>{streaks.longest_streak} <span style={{fontSize: '16px'}}>days</span></div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid var(--hairline)', 
        borderRadius: 'var(--radius-lg)', 
        padding: 'var(--space-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* The Graph */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(12px, 1fr))', 
          gap: '4px',
          alignItems: 'end',
          height: '60px'
        }}>
          {days.map((day, idx) => {
            const height = day.count === 0 ? '4px' : `${Math.min(100, Math.max(20, day.count * 20))}%`;
            const opacity = day.count === 0 ? 0.1 : Math.min(1, 0.4 + (day.count * 0.2));
            const isToday = idx === days.length - 1;
            
            return (
              <div 
                key={day.date}
                title={`${day.date}: ${day.count} activities`}
                style={{
                  height,
                  background: day.count > 0 ? 'linear-gradient(0deg, #6C3CE1, #a78bfa)' : 'var(--hairline)',
                  opacity,
                  borderRadius: '2px',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  borderBottom: isToday && day.count > 0 ? '2px solid #fbbf24' : 'none',
                  transition: 'height 0.3s ease'
                }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mute)' }}>
          <span>90 Days Ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
