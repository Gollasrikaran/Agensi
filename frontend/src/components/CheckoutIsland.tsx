import React, { useState } from 'react';

interface CheckoutIslandProps {
  skillId: string;
  basePrice: number;
}

export default function CheckoutIsland({ skillId, basePrice }: CheckoutIslandProps) {
  const [country, setCountry] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/checkout/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId, country_code: country })
      });
      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      setIntent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMockPay = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/checkout/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId })
      });
      if (!res.ok) throw new Error('Payment confirmation failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ marginTop: 'var(--space-xl)', textAlign: 'center', borderColor: 'var(--success)', background: 'var(--success-soft)', padding: 'var(--space-2xl)' }}>
        <h3 style={{ color: 'var(--success)', fontSize: '24px', marginBottom: 'var(--space-sm)' }}>✓ Payment Successful</h3>
        <p style={{ color: 'var(--body)', fontSize: '16px' }}>You now have access to this artifact. The creator has been credited.</p>
        <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-lg)' }} onClick={() => window.location.reload()}>View Artifact →</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Purchase License</h3>
      
      {!intent ? (
        <div className="form-group">
          <label>Payment Region (Defaulting to India for INR processing)</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="IN">India (Razorpay / UPI)</option>
            <option value="US">International (PayPal)</option>
          </select>
          
          <button 
            className="btn btn-primary btn-lg" 
            style={{ marginTop: 'var(--space-md)', width: '100%' }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Proceed to Checkout (₹${(basePrice || 0).toFixed(2)})`}
          </button>
          
          {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-sm)' }}>{error}</p>}
        </div>
      ) : (
        <div>
          <div style={{ background: 'var(--canvas-soft-2)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }}>
            <p style={{ margin: 0, color: 'var(--mute)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</p>
            <h2 style={{ margin: '8px 0 0 0', color: 'var(--ink)', fontSize: '48px', letterSpacing: '-2px' }}>
              ₹{intent.amount_inr?.toFixed(2)}
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
               <span className="badge" style={{ fontFamily: 'var(--font-mono)' }}>Platform Fee: ₹{intent.platform_fee_inr?.toFixed(2)}</span>
               <span className="badge success" style={{ fontFamily: 'var(--font-mono)' }}>Creator Earns: ₹{intent.seller_amount_inr?.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ padding: 'var(--space-md)', border: `1px solid var(--hairline)`, borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, color: 'var(--ink)', fontSize: '15px' }}>
              <strong>Payment Provider:</strong> {intent.provider}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
              Mock Client Secret: {intent.client_secret}
            </p>
          </div>
          
          <button 
            className="btn btn-primary btn-lg" 
            style={{ marginTop: 'var(--space-xl)', width: '100%' }}
            onClick={handleMockPay}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay Now with ${intent.provider} →`}
          </button>
          {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-sm)', fontSize: '14px' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
