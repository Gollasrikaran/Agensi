import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadRazorpay } from '../utils/razorpay';
import { CheckCircle2, Download, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [hasPurchased, setHasPurchased] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchCreditsAndStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Fetch credits
        const resCredits = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/credits`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (resCredits.ok) {
          const data = await resCredits.json();
          setCreditBalance(data.balance || 0);
        }

        // Fetch purchase status
        const resStatus = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${skillId}/purchase-status`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (resStatus.ok) {
          const statusData = await resStatus.json();
          if (statusData.purchased) {
            setHasPurchased(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user data', e);
      }
    };
    fetchCreditsAndStatus();
  }, [skillId]);

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Must be logged in');

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${skillId}/download`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `skill_${skillId}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      setHasPurchased(true);
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

    if (!intent.is_live) {
        try {
          const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/checkout/success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({ skill_id: skillId })
          });
          if (!res.ok) throw new Error('Payment confirmation failed');
          setSuccess(true);
          setHasPurchased(true);
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
            setHasPurchased(true);
          } catch (err: any) {
            setError(err.message);
          }
        },
        theme: { color: "#4f46e5" }
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

  if (hasPurchased) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center backdrop-blur-sm shadow-[0_0_40px_rgba(16,185,129,0.05)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-emerald-400">Access Granted</h3>
        <p className="mb-8 text-zinc-400">You own this skill and can download its instructions.</p>
        <button 
          className="mx-auto flex w-full max-w-[300px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-500/25 disabled:opacity-50"
          onClick={handleDownload}
          disabled={loading}
        >
          <Download className="h-4 w-4" />
          {loading ? 'Downloading...' : 'Download Instructions (.md)'}
        </button>
        {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm">
      <h3 className="mb-6 text-xl font-bold text-zinc-100">Purchase License</h3>
      
      {!intent ? (
        <div className="space-y-6">
          {Number(basePrice || 0) === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-center">
              <h4 className="mb-2 text-lg font-bold text-emerald-400">Free Skill</h4>
              <p className="mb-6 text-sm text-zinc-400">This skill is available for free.</p>
              <button 
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-50"
                onClick={handleCreditPayment}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                {loading ? 'Processing...' : 'Download for Free'}
              </button>
            </div>
          ) : (
            <>
              {creditBalance !== null && (
                <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-base font-bold text-indigo-400 flex items-center gap-2">
                      <Wallet className="h-4 w-4" /> Pay with Bodhic Credits
                    </h4>
                    <span className="rounded-full bg-zinc-950/50 px-3 py-1 text-xs font-semibold text-zinc-300 border border-zinc-800">
                      Balance: {creditBalance} CR
                    </span>
                  </div>
                  <p className="mb-6 text-sm text-zinc-400">
                    Cost: <strong className="text-zinc-200">{Math.round(Number(basePrice || 0) * 10)} CR</strong>
                  </p>
                  <button 
                    className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                    onClick={handleCreditPayment}
                    disabled={loading || creditBalance < Math.round(Number(basePrice || 0) * 10)}
                  >
                    <Wallet className="h-4 w-4" />
                    {loading ? 'Processing...' : (creditBalance < Math.round(Number(basePrice || 0) * 10) ? 'Insufficient Credits' : `Pay ${Math.round(Number(basePrice || 0) * 10)} Credits`)}
                  </button>
                  {creditBalance < Math.round(Number(basePrice || 0) * 10) && (
                    <p className="mt-4 text-center text-xs text-zinc-500">
                      <a href="/dashboard/credits" className="text-indigo-400 hover:text-indigo-300 hover:underline">Top up your wallet</a>
                    </p>
                  )}
                </div>
              )}
              
              <div className="relative py-4 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                <div className="relative flex justify-center"><span className="bg-zinc-900 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Or pay with cash</span></div>
              </div>

              <input type="hidden" value="IN" />
              
              <button 
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-zinc-100 px-6 py-4 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:bg-white disabled:opacity-50"
                onClick={handleCheckout}
                disabled={loading}
              >
                <CreditCard className="h-4 w-4" />
                {loading ? 'Processing...' : `Proceed to Checkout (₹${Number(basePrice || 0).toFixed(2)})`}
              </button>
            </>
          )}
          
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm font-medium text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Total Amount</p>
            <h2 className="mb-8 text-5xl font-black tracking-tight text-zinc-100">
              ₹{intent.amount_inr?.toFixed(2)}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Base Price</span>
                <span className="font-semibold text-zinc-200">
                  ₹{(intent.base_price_inr || 0).toFixed(2)} {intent.billing_type === 'monthly' ? '/ month' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Buyer Fee</span>
                <span className="font-semibold text-emerald-400">₹0.00</span>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-zinc-200">Total</span>
                  <span className="text-zinc-100">
                    ₹{(intent.amount_inr || 0).toFixed(2)} {intent.billing_type === 'monthly' ? '/ month' : ''}
                  </span>
                </div>
              </div>
            </div>
            {!intent.is_live && (
              <div className="mt-6 flex items-center justify-center rounded-lg bg-amber-500/10 px-4 py-2 border border-amber-500/20">
                <p className="font-mono text-xs text-amber-400 break-all">
                  Mock Order: {intent.client_secret}
                </p>
              </div>
            )}
          </div>
          
          <button 
            className="w-full flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay Now with ${intent.provider} →`}
          </button>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm font-medium text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
