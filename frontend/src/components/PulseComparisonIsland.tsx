import React, { useState, useEffect } from 'react';
import SkillPulseGraph from './SkillPulseGraph';

export default function PulseComparisonIsland({ currentUser, targetUser }: { currentUser: string, targetUser: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app we'd call /api/pulse/compare/{currentUser}/{targetUser}
    // Mocking the stats for now
    setTimeout(() => {
      setStats({
        currentUser: {
          skillsPublished: 8,
          totalSales: 42,
          avgRating: 4.2,
          currentStreak: 14,
          longestStreak: 21,
          rank: 45
        },
        targetUser: {
          skillsPublished: 23,
          totalSales: 187,
          avgRating: 4.7,
          currentStreak: 42,
          longestStreak: 89,
          rank: 3
        }
      });
      setLoading(false);
    }, 1000);
  }, [currentUser, targetUser]);

  if (loading) return <div style={{ color: 'var(--mute)', padding: '24px' }}>Loading comparison...</div>;

  return (
    <div style={{ background: 'var(--canvas)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '20px' }}>Compare Pulses</h2>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--accent-primary)', marginBottom: '16px' }}>@{currentUser} (You)</h3>
          <SkillPulseGraph username={currentUser} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--canvas-strong)', padding: '12px', borderRadius: '50%', fontWeight: 'bold', border: '1px solid var(--hairline-strong)' }}>VS</div>
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--warning)', marginBottom: '16px' }}>@{targetUser}</h3>
          <SkillPulseGraph username={targetUser} />
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Head-to-Head Stats</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
              <th style={{ padding: '12px 8px', color: 'var(--mute)', fontWeight: 500 }}>Metric</th>
              <th style={{ padding: '12px 8px', color: 'var(--mute)', fontWeight: 500 }}>You</th>
              <th style={{ padding: '12px 8px', color: 'var(--mute)', fontWeight: 500 }}>@{targetUser}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td style={{ padding: '12px 8px' }}>Skills Published</td>
              <td style={{ padding: '12px 8px' }}>{stats.currentUser.skillsPublished}</td>
              <td style={{ padding: '12px 8px' }}>{stats.targetUser.skillsPublished}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td style={{ padding: '12px 8px' }}>Total Sales</td>
              <td style={{ padding: '12px 8px' }}>{stats.currentUser.totalSales}</td>
              <td style={{ padding: '12px 8px' }}>{stats.targetUser.totalSales}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td style={{ padding: '12px 8px' }}>Avg Rating</td>
              <td style={{ padding: '12px 8px' }}>{stats.currentUser.avgRating} ★</td>
              <td style={{ padding: '12px 8px' }}>{stats.targetUser.avgRating} ★</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td style={{ padding: '12px 8px' }}>Current Streak</td>
              <td style={{ padding: '12px 8px' }}>{stats.currentUser.currentStreak} days</td>
              <td style={{ padding: '12px 8px' }}>{stats.targetUser.currentStreak} days</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
              <td style={{ padding: '12px 8px' }}>Longest Streak</td>
              <td style={{ padding: '12px 8px' }}>{stats.currentUser.longestStreak} days</td>
              <td style={{ padding: '12px 8px' }}>{stats.targetUser.longestStreak} days</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 8px' }}>Rank (This Month)</td>
              <td style={{ padding: '12px 8px' }}>#{stats.currentUser.rank}</td>
              <td style={{ padding: '12px 8px' }}>#{stats.targetUser.rank}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
