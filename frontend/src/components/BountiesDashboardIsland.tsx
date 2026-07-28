import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import StrictAntiCopyView from './StrictAntiCopyView';

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
          color: "#6c3ce1"
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
    return <p style={{ color: 'var(--mute)' }}>Loading dashboard...</p>;
  }

  if (!session) {
    return (
      <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--mute)', marginBottom: 'var(--space-md)' }}>Please log in to view your bounty dashboard.</p>
        <a href="/login" className="btn btn-primary">Log In</a>
      </div>
    );
  }

  return (
    <>
      {/* Include Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--hairline)', paddingBottom: 'var(--space-sm)' }}>
        <button 
          onClick={() => setActiveTab('posted_bounties')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'posted_bounties' ? 'var(--ink)' : 'var(--mute)',
            fontWeight: activeTab === 'posted_bounties' ? '600' : '400',
            fontSize: '16px',
            cursor: 'pointer',
            padding: 'var(--space-xs) 0',
            borderBottom: activeTab === 'posted_bounties' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Bounties I Posted
        </button>
        <button 
          onClick={() => setActiveTab('my_claims')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'my_claims' ? 'var(--ink)' : 'var(--mute)',
            fontWeight: activeTab === 'my_claims' ? '600' : '400',
            fontSize: '16px',
            cursor: 'pointer',
            padding: 'var(--space-xs) 0',
            borderBottom: activeTab === 'my_claims' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          My Claims
        </button>
      </div>

      {activeTab === 'posted_bounties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {postedClaims.length === 0 ? (
            <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--mute)' }}>
              No claims submitted for your bounties yet.
            </div>
          ) : (
            postedClaims.map((claim) => (
              <div key={claim.id} className="card" style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: 'var(--space-xs)' }}>Bounty: {claim.bounty.title}</h3>
                  <p style={{ color: 'var(--mute)', fontSize: '14px', marginBottom: 'var(--space-sm)' }}>
                    Claimed by @{claim.claimer?.username || 'user'}
                  </p>
                  <span className={`badge ${claim.status === 'accepted' ? 'success' : 'warning'}`} style={{ textTransform: 'uppercase' }}>
                    {claim.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-xs)' }}>
                    ₹{claim.bounty.bounty_inr}
                  </div>
                  {claim.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setInspectClaim(claim)}
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        Inspect
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => handleRejectClaim(claim.id)}
                        style={{ padding: '6px 12px', fontSize: '14px', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
                      >
                        Reject
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleAcceptClaim(claim.id)}
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        Approve & Pay
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {myClaims.length === 0 ? (
            <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--mute)' }}>
              You haven't claimed any bounties yet.
            </div>
          ) : (
            myClaims.map((claim) => (
              <div key={claim.id} className="card" style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: 'var(--space-xs)' }}>{claim.bounty.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span className={`badge ${claim.status === 'accepted' ? 'success' : claim.status === 'rejected' ? 'error' : 'warning'}`} style={{ textTransform: 'uppercase' }}>
                      {claim.status}
                    </span>
                    {claim.status === 'rejected' && claim.rejection_reason && (
                      <span style={{ fontSize: '13px', color: 'var(--error)' }}>
                        <strong>Reason:</strong> {claim.rejection_reason}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                  ₹{claim.bounty.bounty_inr}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Inspect Modal */}
      {inspectClaim && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '900px', padding: 'var(--space-xl)', background: 'var(--nav-bg)', border: '1px solid var(--hairline-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Strict Non-Copy Inspection</h2>
              <button 
                onClick={() => setInspectClaim(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--body)', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <p style={{ color: 'var(--mute)', fontSize: '14px', marginBottom: 'var(--space-lg)' }}>
              Viewing solution submitted by @{inspectClaim.claimer?.username || 'user'}. 
              To prevent external camera leaks, a dynamic forensic watermark tracks your session.
            </p>
            
            <StrictAntiCopyView 
              code={inspectClaim.submitted_code || "// No code submitted."} 
              username={session.user.email || session.user.id} 
              ip="Client IP" 
            />

            <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }} onClick={() => {
                setInspectClaim(null);
                handleRejectClaim(inspectClaim.id);
              }}>
                Reject Claim
              </button>
              <button className="btn btn-primary" onClick={() => {
                setInspectClaim(null);
                handleAcceptClaim(inspectClaim.id);
              }}>
                Looks Good - Approve & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
