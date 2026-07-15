import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BuyerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not authenticated'); return; }

      const res = await fetch('http://localhost:8000/api/users/me/purchases', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch purchases');
      const data = await res.json();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (skillId: string, skillTitle: string) => {
    setDownloading(skillId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('Please log in.'); return; }

      const res = await fetch(`http://localhost:8000/api/skills/${skillId}/download`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) { alert('Download failed. Please try again.'); return; }

      const data = await res.json();

      // Trigger browser download of the .md file
      const blob = new Blob([data.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.title || skillTitle).replace(/\s+/g, '_')}_v${data.version}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('An error occurred during download.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div style={{ color: 'var(--mute)', padding: 'var(--space-xl)' }}>Loading your purchases...</div>;
  if (error) return <div style={{ color: 'var(--error)', padding: 'var(--space-xl)' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>

      {/* Purchased Skills */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Your Purchased Skills</h2>

        {purchases.length === 0 ? (
          <p style={{ color: 'var(--mute)', fontSize: '15px' }}>
            You haven't purchased any skills yet.{' '}
            <a href="/browse" style={{ color: 'var(--primary)' }}>Browse the marketplace →</a>
          </p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skill</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Paid</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase: any) => (
                <tr key={purchase.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {purchase.skills?.title || 'Unknown Skill'}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                    ₹{Number(purchase.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: purchase.payment_status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)',
                      color: purchase.payment_status === 'completed' ? '#10b981' : '#fbbf24'
                    }}>
                      {purchase.payment_status === 'completed' ? '✓ Paid' : purchase.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mute)', fontSize: '14px' }}>
                    {new Date(purchase.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    {purchase.payment_status === 'completed' && purchase.skill_id ? (
                      <button
                        onClick={() => handleDownload(purchase.skill_id, purchase.skills?.title || 'skill')}
                        disabled={downloading === purchase.skill_id}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '13px' }}
                      >
                        {downloading === purchase.skill_id ? 'Downloading...' : '↓ Download'}
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Disputes */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Disputes & Refunds</h2>
        <p style={{ color: 'var(--mute)', fontSize: '14px', marginBottom: 'var(--space-md)' }}>If something is wrong with a purchase, open a dispute.</p>
        <a href="/disputes" className="btn btn-secondary">Open a Dispute</a>
      </div>
    </div>
  );
}
