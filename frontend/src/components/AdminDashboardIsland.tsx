import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('http://localhost:8000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Not authorized as admin or server error');
      }
      
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading admin dashboard...</div>;
  if (error) return <div className="glass-card" style={{ color: '#f87171' }}>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            {data.stats.total_users || 0}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3>Listed Skills</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            {data.stats.total_skills_listed || 0}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3>Total Sales Volume</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            ${(data.stats.total_sales_volume || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card">
          <h2>Recent Skills</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '0.5rem' }}>Title</th>
                <th style={{ padding: '0.5rem' }}>Price</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_skills?.map((skill: any) => (
                <tr key={skill.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.5rem' }}>{skill.title}</td>
                  <td style={{ padding: '0.5rem' }}>${skill.base_price_usd}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: skill.moderation_status === 'approved' ? '#064e3b' : '#78350f',
                      color: skill.moderation_status === 'approved' ? '#34d399' : '#fbbf24'
                    }}>
                      {skill.moderation_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card">
          <h2>Recent Purchases</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '0.5rem' }}>Amount</th>
                <th style={{ padding: '0.5rem' }}>Currency</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_purchases?.map((purchase: any) => (
                <tr key={purchase.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.5rem' }}>${purchase.amount}</td>
                  <td style={{ padding: '0.5rem' }}>{purchase.currency}</td>
                  <td style={{ padding: '0.5rem' }}>{purchase.payment_status}</td>
                </tr>
              ))}
              {(!data.recent_purchases || data.recent_purchases.length === 0) && (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                    No recent purchases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
