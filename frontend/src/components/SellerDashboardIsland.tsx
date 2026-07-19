import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function SellerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    fetchListedSkills();
  }, []);

  const fetchListedSkills = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('http://localhost:8000/api/users/me/skills', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch listed skills');
      }
      
      const data = await res.json();
      setSkills(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading seller dashboard...</div>;
  if (error) return <div className="glass-card" style={{ color: 'var(--error)' }}>Error: {error}</div>;

  return (
    <div className="seller-dashboard">
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Your Listed Skills</h2>
        
        {skills.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            You haven't listed any skills yet. <a href="/sell" style={{ color: 'var(--accent-color)' }}>Sell your first skill</a>
          </p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Title</th>
                <th style={{ padding: '0.5rem' }}>Price</th>
                <th style={{ padding: '0.5rem' }}>Moderation Status</th>
                <th style={{ padding: '0.5rem' }}>Listed On</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill: any) => (
                <tr key={skill.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{skill.title}</td>
                  <td style={{ padding: '0.5rem' }}>₹{skill.base_price_inr ?? 0}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: skill.moderation_status === 'approved' ? 'var(--success-soft)' : (skill.moderation_status === 'rejected' ? '#7f1d1d' : 'var(--warning-soft)'),
                      color: skill.moderation_status === 'approved' ? 'var(--success)' : (skill.moderation_status === 'rejected' ? 'var(--error)' : 'var(--warning)')
                    }}>
                      {skill.moderation_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(skill.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Payouts & Earnings</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>You have no pending payouts.</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem', opacity: 0.5, cursor: 'not-allowed' }}>Request Payout</button>
      </div>
    </div>
  );
}
