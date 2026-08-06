import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import StrictAntiCopyView from './StrictAntiCopyView';
import { IndianRupee, CheckCircle2, XCircle, AlertCircle, FileCode, CheckSquare, X, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BountiesDashboardIsland() {
  const [session, setSession] = useState<any>(null);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [postedClaims, setPostedClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my_claims' | 'posted_bounties'>('posted_bounties');
  
  // Inspect Modal State
  const [inspectClaim, setInspectClaim] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData(session.access_token);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchData = async (token: string) => {
    setLoading(true);
    try {
      const [claimsRes, postedRes] = await Promise.all([
        fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/claims/my-claims`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/claims/my-posted`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (claimsRes.ok) setMyClaims(await claimsRes.json());
      if (postedRes.ok) setPostedClaims(await postedRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClaim = async (claimId: string) => {
    if (!session) return;
    try {
      // 1. Create order
      const orderRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/claims/${claimId}/order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!orderRes.ok) {
        const err = await orderRes.json();
        alert(err.detail || "Failed to create payment order.");
        return;
      }
      
      const { client_secret, amount_inr, razorpay_key_id } = await orderRes.json();
      
      // 2. Open Razorpay checkout
      const options = {
        key: razorpay_key_id,
        amount: amount_inr * 100,
        currency: "INR",
        name: "BodhicAI Bounties",
        description: "Bounty Payment",
        order_id: client_secret,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/claims/${claimId}/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            if (verifyRes.ok) {
              alert("Payment successful! Claim accepted.");
              fetchData(session.access_token);
            } else {
              alert("Payment verification failed.");
            }
          } catch (e) {
            console.error(e);
            alert("Network error during verification.");
          }
        },
        theme: {
          color: "#4f46e5"
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Error initiating payment.");
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    if (!session) return;
    const reason = window.prompt("Please provide a mandatory reason for rejecting this claim:");
    if (!reason || !reason.trim()) {
      alert("Rejection reason is mandatory.");
      return;
    }
    
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/claims/${claimId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert("Claim rejected.");
        fetchData(session.access_token);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to reject claim.");
      }
    } catch (e: any) {
      alert(e.message || "Network error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
        <p className="text-zinc-400 mb-6 text-sm">Please log in to view your bounty dashboard.</p>
        <a href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500">
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Include Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      
      <div className="flex gap-4 border-b border-zinc-800 pb-px overflow-x-auto">
        <button 
          onClick={() => setActiveTab('posted_bounties')}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === 'posted_bounties'
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg" 
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-t-lg"
          )}
        >
          <Upload className="h-4 w-4" /> Bounties I Posted
        </button>
        <button 
          onClick={() => setActiveTab('my_claims')}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === 'my_claims'
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg" 
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-t-lg"
          )}
        >
          <CheckSquare className="h-4 w-4" /> My Claims
        </button>
      </div>

      {activeTab === 'posted_bounties' && (
        <div className="space-y-4">
          {postedClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/20 py-20 px-6 text-center">
              <Upload className="h-8 w-8 text-zinc-600 mb-4" />
              <p className="text-sm font-medium text-zinc-400">No claims submitted for your bounties yet.</p>
            </div>
          ) : (
            postedClaims.map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">{claim.bounty.title}</h3>
                  <p className="text-sm font-medium text-zinc-500 mb-4">
                    Claimed by <span className="text-zinc-300">@{claim.claimer?.username || 'user'}</span>
                  </p>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                    claim.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                    claim.status === 'rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}>
                    {claim.status === 'accepted' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {claim.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                    {claim.status === 'pending' && <AlertCircle className="h-3.5 w-3.5" />}
                    {claim.status}
                  </span>
                </div>
                
                <div className="flex flex-col md:items-end justify-between min-w-[200px] shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center gap-1 text-2xl font-black font-mono text-zinc-100 mb-4 md:mb-0">
                    <IndianRupee className="h-5 w-5 text-zinc-500" />
                    {claim.bounty.bounty_inr}
                  </div>
                  
                  {claim.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 justify-end w-full">
                      <button 
                        onClick={() => setInspectClaim(claim)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
                      >
                        <FileCode className="h-4 w-4" /> Inspect
                      </button>
                      <button 
                        onClick={() => handleRejectClaim(claim.id)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAcceptClaim(claim.id)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-500"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve & Pay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'my_claims' && (
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/20 py-20 px-6 text-center">
              <CheckSquare className="h-8 w-8 text-zinc-600 mb-4" />
              <p className="text-sm font-medium text-zinc-400">You haven't claimed any bounties yet.</p>
            </div>
          ) : (
            myClaims.map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-3">{claim.bounty.title}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                      claim.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                      claim.status === 'rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                      {claim.status === 'accepted' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {claim.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                      {claim.status === 'pending' && <AlertCircle className="h-3.5 w-3.5" />}
                      {claim.status}
                    </span>
                    {claim.status === 'rejected' && claim.rejection_reason && (
                      <span className="text-xs font-medium text-red-400 bg-red-500/5 px-3 py-1 rounded-full border border-red-500/10 max-w-sm truncate">
                        <strong>Reason:</strong> {claim.rejection_reason}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xl font-black font-mono text-zinc-100 shrink-0">
                  <IndianRupee className="h-5 w-5 text-zinc-500" />
                  {claim.bounty.bounty_inr}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Inspect Modal */}
      {inspectClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="h-6 w-6 text-indigo-400" /> Strict Non-Copy Inspection
              </h2>
              <button 
                onClick={() => setInspectClaim(null)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-400/90 shrink-0 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                Viewing solution submitted by <strong className="text-amber-400">@{inspectClaim.claimer?.username || 'user'}</strong>. 
                To prevent external camera leaks, a dynamic forensic watermark tracks your session.
              </p>
            </div>
            
            <div className="flex-1 min-h-[300px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 mb-6 relative">
              <StrictAntiCopyView 
                code={inspectClaim.submitted_code || "// No code submitted."} 
                username={session.user.email || session.user.id} 
                ip="Client IP" 
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3 shrink-0">
              <button 
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20" 
                onClick={() => {
                  setInspectClaim(null);
                  handleRejectClaim(inspectClaim.id);
                }}
              >
                <XCircle className="h-4 w-4" /> Reject Claim
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500" 
                onClick={() => {
                  setInspectClaim(null);
                  handleAcceptClaim(inspectClaim.id);
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Looks Good - Approve & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
