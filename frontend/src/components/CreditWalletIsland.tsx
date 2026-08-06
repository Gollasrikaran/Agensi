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
        name: "BodhicAI",
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
        theme: { color: "#6366f1" } // indigo-500
      });
      
      rzp.open();
    } catch (e: any) {
      showToast("Error initiating checkout: " + e.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-zinc-300">Loading wallet...</div>;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
      {/* Balance Column */}
      <div>
        <div className="group flex flex-col p-6 md:p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 border-none text-white shadow-xl hover:-translate-y-1 transition-all">
          <h2 className="text-[13px] text-white/70 font-mono font-medium uppercase tracking-[1px]">Available Balance</h2>
          <div className="text-5xl font-bold tracking-tight mt-2">
            {balance.toLocaleString()} <span className="text-xl font-medium opacity-80">CR</span>
          </div>
          <p className="mt-4 text-sm text-white/80">
            Equivalent to ~{Math.floor(balance / 10)} chats.
          </p>
        </div>
      </div>
      
      {/* Top Up Column */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-zinc-100">Top up your wallet</h3>
        
        <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Number of Credits (Min 100)
          </label>
          <input 
            type="number" 
            min="100" 
            value={customCredits} 
            onChange={(e) => setCustomCredits(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-lg text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors mb-4"
          />
          
          <div className="text-[22px] font-semibold text-zinc-100 mb-8">
            Total: ₹{(typeof customCredits === 'number' ? customCredits * 0.10 : 0).toFixed(2)}
          </div>

          {(typeof customCredits === 'number' && customCredits < 100) && (
            <div className="text-red-500 text-[13px] mb-4">
              Minimum 100 credits required.
            </div>
          )}

          <button 
            disabled={processing || customCredits === '' || customCredits < 100} 
            onClick={() => buyCredits()} 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 w-full"
          >
            {processing ? 'Processing...' : 'Top Up →'}
          </button>
        </div>
        
        <p className="text-[13px] text-zinc-500 mt-6 text-center">
          Payments processed securely via Razorpay UPI & Cards.
        </p>
      </div>
    </div>
  );
}
