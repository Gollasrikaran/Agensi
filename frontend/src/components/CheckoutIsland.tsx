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

  const getSessionToken = () => {
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('sb-localhost-auth-token') || localStorage.getItem('supabase.auth.token');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          return session?.currentSession?.access_token || session?.access_token;
        } catch(e) {}
      }
    }
    return null;
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    const token = getSessionToken();
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/intent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
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

  const handlePayment = async () => {
    setLoading(true);
    const token = getSessionToken();
    
    // 1. Mock Fallback Flow
    if (!intent.is_live) {
        try {
          const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/success`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ skill_id: skillId })
          });
          if (!res.ok) throw new Error('Payment confirmation failed');
          setSuccess(true);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
        return;
    }
    
    // 2. Real Razorpay SDK Flow
    const loadScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const isLoaded = await loadScript();
    if (!isLoaded) {
      setError('Failed to load Razorpay SDK. Please check your connection.');
      setLoading(false);
      return;
    }

    const options = {
      key: intent.razorpay_key_id,
      amount: Math.round(intent.amount_inr * 100),
      currency: "INR",
      name: "Bodhic AI",
      description: "Skill License Purchase",
      order_id: intent.client_secret,
      handler: async function (response: any) {
        try {
          const confirmRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/success`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ 
              skill_id: skillId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          if (!confirmRes.ok) throw new Error('Payment verification failed');
          setSuccess(true);
        } catch (err: any) {
          setError(err.message);
        }
      },
      theme: { color: "#6C3CE1" }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      setError(response.error.description);
    });
    
    rzp.open();
    setLoading(false);
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
            {loading ? 'Processing...' : `Proceed to Checkout (₹${Number(basePrice || 0).toFixed(2)})`}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span style={{ color: 'var(--mute)' }}>Base Price</span>
                <span style={{ fontWeight: '600' }}>
                  ₹{(intent.base_price_inr || 0).toFixed(2)} {intent.billing_type === 'monthly' ? '/ month' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span style={{ color: 'var(--mute)' }}>Buyer Fee</span>
                <span style={{ fontWeight: '600', color: 'var(--success)' }}>₹0.00</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 'var(--space-lg) 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700' }}>
                <span>Total</span>
                <span>
                  ₹{(intent.amount_inr || 0).toFixed(2)} {intent.billing_type === 'monthly' ? '/ month' : ''}
                </span>
              </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
              Mock Client Secret: {intent.client_secret}
            </p>
          </div>
          
          <button 
            className="btn btn-primary btn-lg" 
            style={{ marginTop: 'var(--space-xl)', width: '100%' }}
            onClick={handlePayment}
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
