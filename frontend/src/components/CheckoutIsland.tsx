import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadRazorpay } from '../utils/razorpay';

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
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/credits`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCreditBalance(data.balance || 0);
        }
      } catch (e) {
        console.error('Failed to fetch credits', e);
      }
    };
    fetchCredits();
  }, []);

  const handleCreditPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to complete payment.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/credits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ skill_id: skillId })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Credit payment failed');
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/intent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session && { 'Authorization': `Bearer ${session.access_token}` })
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError('You must be logged in to complete payment.');
      setLoading(false);
      return;
    }

    const authHeader = { 'Authorization': `Bearer ${session.access_token}` };

    // 1. Mock Fallback Flow
    if (!intent.is_live) {
        try {
          const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
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
    
    let rzp: any;
    try {
      const options = {
        key: intent.razorpay_key_id,
        amount: Math.round(intent.amount_inr * 100),
        currency: "INR",
        name: "BodhicAI",
        description: "Skill License Purchase",
        order_id: intent.client_secret,
        handler: async function (response: any) {
          try {
            // Re-fetch session in case token refreshed during Razorpay modal
            const { data: { session: freshSession } } = await supabase.auth.getSession();
            const freshAuthHeader = freshSession
              ? { 'Authorization': `Bearer ${freshSession.access_token}` }
              : authHeader;

            const confirmRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...freshAuthHeader },
              body: JSON.stringify({ 
                skill_id: skillId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!confirmRes.ok) {
              const errData = await confirmRes.json().catch(() => ({}));
              throw new Error(errData.detail || 'Payment verification failed');
            }
            setSuccess(true);
          } catch (err: any) {
            setError(err.message);
          }
        },
        theme: { color: "#6C3CE1" }
      };
      rzp = await loadRazorpay(options);
    } catch (err) {
      setError('Failed to load Razorpay SDK. Please check your connection.');
      setLoading(false);
      return;
    }

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
          {creditBalance !== null && (
            <div style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-md)', background: 'linear-gradient(135deg, rgba(108, 60, 225, 0.1) 0%, rgba(74, 33, 175, 0.1) 100%)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Pay with Bodhic Credits</span>
                <span>Balance: {creditBalance} CR</span>
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--mute)', marginBottom: '16px' }}>
                Cost: <strong>{Math.round(Number(basePrice || 0) * 10)} CR</strong>
              </p>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%' }}
                onClick={handleCreditPayment}
                disabled={loading || creditBalance < Math.round(Number(basePrice || 0) * 10)}
              >
                {loading ? 'Processing...' : (creditBalance < Math.round(Number(basePrice || 0) * 10) ? 'Insufficient Credits' : `Pay ${Math.round(Number(basePrice || 0) * 10)} Credits`)}
              </button>
              {creditBalance < Math.round(Number(basePrice || 0) * 10) && (
                <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                  <a href="/dashboard/credits" style={{ color: 'var(--primary)' }}>Top up your wallet</a>
                </p>
              )}
            </div>
          )}
          
          <div style={{ position: 'relative', textAlign: 'center', margin: 'var(--space-lg) 0' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', padding: '0 12px', color: 'var(--mute)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>OR PAY WITH CASH</span>
          </div>

          <input type="hidden" value="IN" />
          
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
            {!intent.is_live && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                Mock Order: {intent.client_secret}
              </p>
            )}
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
