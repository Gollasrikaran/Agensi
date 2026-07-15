import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SellerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not authenticated'); return; }

      const token = session.access_token;

      const [skillsRes, salesRes] = await Promise.all([
        fetch('http://localhost:8000/api/users/me/skills', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8000/api/users/me/sales',  { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (!skillsRes.ok) throw new Error('Failed to fetch skills');

      const skillsData = await skillsRes.json();
      const salesData  = salesRes.ok ? await salesRes.json() : [];

      setSkills(skillsData);
      setSales(salesData);
      setTotalEarnings(salesData.reduce((sum: number, s: any) => sum + Number(s.seller_share), 0));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--mute)', padding: 'var(--space-xl)' }}>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'var(--error)', padding: 'var(--space-xl)' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)' }}>
        {[
          { label: 'Total Skills', value: skills.length },
          { label: 'Total Sales', value: sales.length },
          { label: 'Total Earned', value: `₹${totalEarnings.toFixed(2)}` },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', color: 'var(--ink)' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Listed skills */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Your Listed Skills</h2>
        {skills.length === 0 ? (
          <p style={{ color: 'var(--mute)', fontSize: '15px' }}>
            No skills yet.{' '}<a href="/sell" style={{ color: 'var(--primary)' }}>Upload your first skill →</a>
          </p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                {['Title', 'Price', 'Status', 'Listed On'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((skill: any) => {
                const statusColor =
                  skill.moderation_status === 'approved' ? { bg: 'rgba(16,185,129,0.15)', text: '#10b981' } :
                  skill.moderation_status === 'rejected' ? { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' } :
                                                           { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' };
                return (
                  <tr key={skill.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--ink)' }}>{skill.title}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)' }}>₹{skill.base_price_inr ?? 0}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: statusColor.bg, color: statusColor.text }}>
                        {skill.moderation_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontSize: '14px' }}>
                      {new Date(skill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sales notifications */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Recent Sales</h2>
        {sales.length === 0 ? (
          <p style={{ color: 'var(--mute)', fontSize: '15px' }}>No sales yet. Once someone buys your skill, it will appear here.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                {['Skill Sold', 'Sale Price', 'Your Earnings (80%)', 'Date'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--ink)' }}>{sale.skill_title}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)' }}>₹{Number(sale.amount_inr).toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 600 }}>
                    ₹{Number(sale.seller_share).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontSize: '14px' }}>
                    {new Date(sale.sold_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
