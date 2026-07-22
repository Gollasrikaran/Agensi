import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadRazorpay } from '../utils/razorpay';
import { showToast } from '../lib/toast';

export default function CreditWalletIsland() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customCredits, setCustomCredits] = useState<number | ''>(1000);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/credits`, {
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

  const buyCredits = async () => {
    if (customCredits === '' || customCredits < 100) return;
    const amountInr = customCredits * 0.10;
    
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast("Please log in to purchase credits.", "error");
        setProcessing(false);
        return;
      }
      
      // 1. Create order intent
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/credits/checkout`, {
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
        const successRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/credits/checkout/success`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ amount_inr: amountInr })
        });
        
        if (successRes.ok) {
          showToast('Credits added successfully (Mock Payment)!', 'success');
          fetchCredits();
        } else {
          showToast('Error verifying payment.', 'error');
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
          const successRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/credits/checkout/success`, {
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
            showToast('Credits added successfully!', 'success');
            fetchCredits();
          } else {
            showToast('Error verifying payment.', 'error');
          }
        },
        theme: { color: "#6C3CE1" }
      });
      
      rzp.open();
    } catch (e: any) {
      showToast("Error initiating checkout: " + e.message, "error");
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
        
        <div className="card" style={{ padding: 'var(--space-xl)', border: '1px solid var(--hairline)' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--mute)', marginBottom: '8px' }}>
            Number of Credits (Min 100)
          </label>
          <input 
            type="number" 
            min="100" 
            value={customCredits} 
            onChange={(e) => setCustomCredits(e.target.value === '' ? '' : parseInt(e.target.value))}
            style={{ width: '100%', padding: '12px 16px', fontSize: '18px', borderRadius: '8px', border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', marginBottom: '16px' }}
          />
          
          <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', marginBottom: 'var(--space-lg)' }}>
            Total: ₹{(typeof customCredits === 'number' ? customCredits * 0.10 : 0).toFixed(2)}
          </div>

          {(typeof customCredits === 'number' && customCredits < 100) && (
            <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>
              Minimum 100 credits required.
            </div>
          )}

          <button 
            disabled={processing || customCredits === '' || customCredits < 100} 
            onClick={() => buyCredits()} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px' }}
          >
            {processing ? 'Processing...' : 'Top Up →'}
          </button>
        </div>
        
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: 'var(--space-lg)', textAlign: 'center' }}>
          Payments processed securely via Razorpay UPI & Cards.
        </p>
      </div>
    </div>
  );
}
