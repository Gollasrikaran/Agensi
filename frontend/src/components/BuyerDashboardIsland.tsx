import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BuyerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('http://localhost:8000/api/users/me/purchases', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const data = await res.json();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading buyer dashboard...</div>;
  if (error) return <div className="glass-card" style={{ color: '#f87171' }}>Error: {error}</div>;

  return (
    <div className="buyer-dashboard">
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Your Purchased Skills</h2>
        
        {purchases.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            You have not purchased any skills yet.
          </p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '0.5rem' }}>Skill</th>
                <th style={{ padding: '0.5rem' }}>Amount Paid</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase: any) => (
                <tr key={purchase.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                    {purchase.skills?.title || 'Unknown Skill'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>${purchase.amount} {purchase.currency}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: purchase.payment_status === 'completed' ? '#064e3b' : '#78350f',
                      color: purchase.payment_status === 'completed' ? '#34d399' : '#fbbf24'
                    }}>
                      {purchase.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="glass-card">
        <h2>Disputes & Refunds</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>No active disputes.</p>
        <a href="/disputes" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Open a Dispute</a>
      </div>
    </div>
  );
}
