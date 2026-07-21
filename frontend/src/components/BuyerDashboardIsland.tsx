import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function BuyerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  
  // Review State
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const submitReview = async (skillId: string) => {
    try {
      setSubmittingReview(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ skill_id: skillId, rating, comment: comment || null })
      });
      if (!res.ok) throw new Error('Failed to submit review');
      alert('Review submitted successfully!');
      setReviewingId(null);
      setRating(5);
      setComment('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

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

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/purchases`, {
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
  if (error) return <div className="glass-card" style={{ color: 'var(--error)' }}>Error: {error}</div>;

  return (
    <div className="buyer-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>Buyer Dashboard</h1>
        <a 
          href="/dashboard/seller" 
          style={{ 
            background: 'var(--bg-tertiary)', 
            border: '1px solid var(--accent-deep)', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            color: 'var(--accent)',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
        >
          <span>Switch to Seller Dashboard</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
      
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Your Purchased Skills</h2>
        
        {purchases.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            You have not purchased any skills yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '1.5rem' }}>
            {purchases.map((purchase: any) => (
              <div key={purchase.id} style={{ 
                background: 'var(--bg-tertiary)', 
                border: 'var(--glass-border)', 
                borderRadius: '16px', 
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                    {purchase.skills?.title || 'Unknown Skill'}
                  </h3>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: 'var(--radius-pill)', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    background: purchase.payment_status === 'completed' ? 'var(--success-soft)' : 'var(--warning-soft)',
                    color: purchase.payment_status === 'completed' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {purchase.payment_status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <span>Price Paid: <strong style={{ color: 'var(--text-primary)' }}>₹{purchase.amount}</strong></span>
                  <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: '4px 0' }} />

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={async () => {
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${purchase.skill_id}/download`, {
                          headers: { 'Authorization': `Bearer ${session?.access_token}` }
                        });
                        if (!res.ok) throw new Error('Download failed');
                        const data = await res.json();
                        const blob = new Blob([data.content], { type: 'text/markdown' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(purchase.skills?.title || 'skill').replace(/\s+/g, '_').toLowerCase()}.md`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    ↓ Download
                  </button>
                  
                  {reviewingId === purchase.skill_id ? (
                    null // handled below
                  ) : (
                    <button className="btn btn-secondary" onClick={() => { setReviewingId(purchase.skill_id); setRating(5); setComment(''); }} style={{ flex: 1, justifyContent: 'center' }}>
                      Rate Skill
                    </button>
                  )}
                </div>

                {reviewingId === purchase.skill_id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--canvas-soft)', padding: '16px', borderRadius: '12px', border: '1px solid var(--primary-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      {[1,2,3,4,5].map(star => (
                        <span key={star} onClick={() => setRating(star)} style={{ color: rating >= star ? '#fbbf24' : 'var(--hairline-strong)', fontSize: '28px', transition: 'color 0.2s' }}>★</span>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Leave a review..." 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--hairline)', background: 'var(--canvas)', color: 'var(--ink)', resize: 'vertical' }}
                      rows={2}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={() => submitReview(purchase.skill_id)} disabled={submittingReview} style={{ flex: 1 }}>Submit</button>
                      <button className="btn btn-secondary" onClick={() => setReviewingId(null)} style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
