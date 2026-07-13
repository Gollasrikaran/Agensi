import React, { useEffect, useState } from 'react';

export default function LeaderboardIsland() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/skills/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (e: React.MouseEvent, skillId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/skills/${skillId}/upvote`, { method: 'POST' });
      if (res.ok) {
        fetchLeaderboard(); // refresh order
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <p style={{ color: 'var(--mute)' }}>Loading leaderboard...</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <p style={{ color: 'var(--mute)', fontSize: '16px' }}>No skills ranked yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {skills.map((skill: any, index: number) => {
            const isTop3 = index < 3;
            return (
              <a 
                key={skill.id} 
                href={`/skill/${skill.id}`} 
                className="card" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '80px 1fr 100px', 
                  gap: 'var(--space-xl)', 
                  alignItems: 'center', 
                  textDecoration: 'none', 
                  padding: 'var(--space-xl)',
                  background: isTop3 ? 'var(--canvas-soft-2)' : 'var(--canvas)',
                  border: isTop3 ? '1px solid var(--primary)' : '1px solid var(--hairline-strong)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isTop3 && (
                  <div style={{ position: 'absolute', top: 0, left: 0, background: 'var(--primary)', color: 'white', padding: '4px 12px', fontSize: '12px', fontWeight: '700', borderBottomRightRadius: 'var(--radius-md)' }}>
                    #{index + 1} OVERALL
                  </div>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: isTop3 ? 'var(--primary)' : 'var(--mute)' }}>
                    {index + 1}
                  </div>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: 'var(--space-xs)', color: 'var(--ink)' }}>{skill.title}</h3>
                  <p style={{ color: 'var(--body)', fontSize: '14px', lineHeight: '1.5' }}>{skill.description}</p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={(e) => handleUpvote(e, skill.id)}
                    className="btn" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      background: 'var(--canvas-soft)', 
                      border: '1px solid var(--hairline-strong)',
                      padding: '12px 20px',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '20px', marginBottom: '4px' }}>▲</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{skill.upvotes || 0}</span>
                  </button>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
