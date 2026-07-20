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
      const res = await fetch('http://localhost:8000/api/users/me/reviews', {
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
  if (error) return <div className="glass-card" style={{ color: 'var(--error)' }}>Error: {error}</div>;

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
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Skill</th>
                <th style={{ padding: '0.5rem' }}>Amount Paid</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Date</th>
                <th style={{ padding: '0.5rem' }}>Review</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase: any) => (
                <tr key={purchase.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                    {purchase.skills?.title || 'Unknown Skill'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>₹{purchase.amount}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: purchase.payment_status === 'completed' ? 'var(--success-soft)' : 'var(--warning-soft)',
                      color: purchase.payment_status === 'completed' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {purchase.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {reviewingId === purchase.skill_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--canvas-soft)', padding: '12px', borderRadius: '8px', minWidth: '200px' }}>
                        <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
                          {[1,2,3,4,5].map(star => (
                            <span key={star} onClick={() => setRating(star)} style={{ color: rating >= star ? '#fbbf24' : 'var(--hairline-strong)', fontSize: '24px' }}>★</span>
                          ))}
                        </div>
                        <textarea 
                          placeholder="Leave a comment (optional)..." 
                          value={comment} 
                          onChange={(e) => setComment(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--hairline)', background: 'var(--canvas)', color: 'var(--ink)' }}
                          rows={2}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary" onClick={() => submitReview(purchase.skill_id)} disabled={submittingReview} style={{ padding: '4px 12px', fontSize: '12px' }}>Submit</button>
                          <button className="btn btn-secondary" onClick={() => setReviewingId(null)} style={{ padding: '4px 12px', fontSize: '12px' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => { setReviewingId(purchase.skill_id); setRating(5); setComment(''); }} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Rate Skill
                      </button>
                    )}
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
