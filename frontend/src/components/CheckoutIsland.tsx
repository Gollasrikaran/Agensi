import React, { useState } from 'react';

interface CheckoutIslandProps {
  skillId: string;
  basePrice: number;
}

export default function CheckoutIsland({ skillId, basePrice }: CheckoutIslandProps) {
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<any>(null);
  const [error, setError] = useState('');

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

  return (
    <div className="glass-card" style={{ marginTop: '2rem' }}>
      <h3>Purchase License</h3>
      
      {!intent ? (
        <div className="form-group">
          <label>Select Your Country (For Localized Pricing)</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="US">United States (USD)</option>
            <option value="IN">India (INR)</option>
            <option value="UK">United Kingdom (GBP)</option>
            <option value="NG">Nigeria (NGN)</option>
            <option value="BR">Brazil (BRL)</option>
          </select>
          
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1rem' }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
          
          {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
        </div>
      ) : (
        <div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Amount:</p>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
              {intent.amount.toLocaleString()} {intent.currency}
            </h2>
          </div>
          
          <div style={{ padding: '1rem', border: '1px solid var(--accent-color)', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)' }}>
            <p style={{ margin: 0 }}>
              <strong>Payment Provider:</strong> {intent.provider}
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              (Mock Client Secret: {intent.client_secret})
            </p>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={() => alert('Mock Payment Successful!')}
          >
            Pay Now with {intent.provider}
          </button>
        </div>
      )}
    </div>
  );
}
