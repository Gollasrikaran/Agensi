import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadRazorpay } from '../utils/razorpay';

export default function CreditWalletIsland() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch('http://localhost:8000/api/users/me/credits', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const buyCredits = async (amountInr: number) => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please log in to purchase credits.");
        return;
      }
      
      // 1. Create order intent
      const res = await fetch('http://localhost:8000/api/users/me/credits/checkout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ amount_inr: amountInr })
      });
      
      const orderData = await res.json();
      
      // 2. Mock Fallback Flow (if no Razorpay keys configured)
      if (!orderData.is_live) {
        const successRes = await fetch('http://localhost:8000/api/users/me/credits/checkout/success', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ amount_inr: amountInr })
        });
        
        if (successRes.ok) {
          alert('Credits added successfully (Mock Payment)!');
          fetchCredits();
        } else {
          alert('Error verifying payment.');
        }
        setProcessing(false);
        return;
      }
      
      // 3. Load Real Razorpay UI
      const rzp = await loadRazorpay({
        key: orderData.razorpay_key_id,
        amount: Math.round(orderData.amount_inr * 100),
        currency: orderData.currency,
        name: "Bodhic AI",
        description: `Purchase Bodhic Credits`,
        order_id: orderData.client_secret,
        handler: async function (response: any) {
          // 4. Confirm success
          const successRes = await fetch('http://localhost:8000/api/users/me/credits/checkout/success', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              amount_inr: amountInr,
              razorpay_payment_id: response.razorpay_payment_id,
            })
          });
          
          if (successRes.ok) {
            alert('Credits added successfully!');
            fetchCredits();
          } else {
            alert('Error verifying payment.');
          }
        },
        theme: { color: "#6C3CE1" }
      });
      
      rzp.open();
    } catch (e: any) {
      alert("Error initiating checkout: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading wallet...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-xl)' }}>
      {/* Balance Column */}
      <div>
        <div className="card" style={{ padding: 'var(--space-xl)', background: 'linear-gradient(135deg, var(--primary) 0%, #4a21af 100%)', color: '#fff', border: 'none' }}>
          <h2 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</h2>
          <div style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-2px', marginTop: 'var(--space-xs)' }}>
            {balance.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: 500, opacity: 0.8 }}>CR</span>
          </div>
          <p style={{ marginTop: 'var(--space-sm)', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            Equivalent to ~{Math.floor(balance / 10)} chats.
          </p>
        </div>
      </div>
      
      {/* Top Up Column */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Top up your wallet</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          
          <div className="card" style={{ padding: 'var(--space-lg)', border: '1px solid var(--hairline)', cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative' }} onClick={() => buyCredits(100)}>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: 'var(--ink)' }}>1,000 Credits</div>
            <div style={{ fontSize: '16px', color: 'var(--mute)', marginBottom: 'var(--space-lg)' }}>₹100</div>
            <button disabled={processing} className="btn btn-secondary" style={{ width: '100%' }}>Buy Now</button>
          </div>

          <div className="card" style={{ padding: 'var(--space-lg)', border: '2px solid var(--primary)', cursor: 'pointer', position: 'relative' }} onClick={() => buyCredits(499)}>
            <div style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--primary)', color: '#fff', fontSize: '11px', padding: '4px 12px', borderRadius: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Most Popular
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: 'var(--ink)' }}>
              5,500 Credits
            </div>
            <div style={{ fontSize: '16px', color: 'var(--mute)', marginBottom: 'var(--space-lg)' }}>
              ₹499 <span style={{ fontSize: '12px', color: 'var(--success)' }}>(500 Bonus)</span>
            </div>
            <button disabled={processing} className="btn btn-primary" style={{ width: '100%' }}>Buy Now</button>
          </div>
          
        </div>
        
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: 'var(--space-lg)', textAlign: 'center' }}>
          Payments processed securely via Razorpay UPI & Cards.
        </p>
      </div>
    </div>
  );
}
