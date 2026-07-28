import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function BountyBoardIsland() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Post state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bountyInr, setBountyInr] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Claim Modal State
  const [claimModalBounty, setClaimModalBounty] = useState<any>(null);
  const [claimCode, setClaimCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openClaimModal = (req: any) => {
    if (!session) {
      alert("Please login to claim a bounty.");
      return;
    }
    if (session.user.id === req.buyer_id) {
      alert("You cannot claim your own bounty.");
      return;
    }
    setClaimModalBounty(req);
    setClaimCode('');
  };

  const submitClaimBounty = async () => {
    if (!claimModalBounty) return;
    if (!claimCode.trim()) {
      alert("You must provide the skill code to claim this bounty.");
      return;
    }

    setIsClaiming(true);
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/${claimModalBounty.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ submitted_code: claimCode })
      });
      if (res.ok) {
        alert("Bounty claim submitted successfully! You can track it in your dashboard.");
        setClaimModalBounty(null);
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to claim bounty.");
      }
    } catch (e: any) {
      alert(e.message || "Network error occurred.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      alert("Please login to post a bounty.");
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          bounty_inr: parseFloat(bountyInr)
        })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setBountyInr('');
        fetchRequests(); // refresh
      } else {
        const errText = await res.text();
        let errMsg = "Failed to post request.";
        try {
          const errJson = JSON.parse(errText);
          if (errJson.detail) errMsg = errJson.detail;
        } catch(e) {}
        alert(errMsg);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Network error occurred.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'start' }}>
      
      {/* Left: Bounty List */}
      <div>
        <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-md)' }}>Open Bounties</h2>
        
        {loading ? (
          <p style={{ color: 'var(--mute)' }}>Loading bounties...</p>
        ) : requests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <p style={{ color: 'var(--mute)' }}>No open bounties right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {requests.map((req: any) => (
              <div key={req.id} className="card" style={{ padding: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)', alignItems: 'center' }}>
                    <span className="badge warning" style={{ textTransform: 'uppercase' }}>{req.status}</span>
                    <span style={{ fontSize: '12px', color: 'var(--mute)' }}>
                      {req.creator?.username ? `Posted by @${req.creator.username}` : ''}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', marginBottom: 'var(--space-xs)' }}>{req.title}</h3>
                  <p style={{ color: 'var(--body)', fontSize: '14px', lineHeight: '1.5' }}>{req.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-sm)' }}>
                    ₹{req.bounty_inr}
                  </div>
                  <button 
                    className="btn btn-primary" 
                    disabled={req.status !== 'open'}
                    onClick={() => openClaimModal(req)}
                  >
                    {req.status === 'open' ? 'Claim Bounty' : 'Closed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Post a Bounty */}
      <div className="card" style={{ padding: 'var(--space-xl)', position: 'sticky', top: 'var(--space-2xl)' }}>
        <h3 style={{ fontSize: '20px', marginBottom: 'var(--space-sm)' }}>Post a Request</h3>
        <p style={{ color: 'var(--body)', fontSize: '14px', marginBottom: 'var(--space-lg)' }}>
          Need a highly specific agent workflow? Post a bounty and let our verified creators build it for you.
        </p>

        {!session ? (
          <div style={{ padding: 'var(--space-md)', background: 'var(--canvas-soft)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--mute)', marginBottom: 'var(--space-sm)' }}>You must be logged in to post.</p>
            <a href="/login" className="btn btn-secondary" style={{ width: '100%' }}>Log In</a>
          </div>
        ) : (
          <form onSubmit={handlePostRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: 'var(--space-xs)' }}>Skill Title / Need</label>
              <input 
                type="text" 
                required 
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: 'var(--space-xs)' }}>Detailed Description</label>
              <textarea 
                required 
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }} 
              ></textarea>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: 'var(--space-xs)' }}>Bounty Amount (INR)</label>
              <input 
                type="number" 
                required 
                min="100"
                value={bountyInr}
                onChange={e => setBountyInr(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }} 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={isPosting}>
              {isPosting ? 'Posting...' : 'Post Bounty'}
            </button>
          </form>
        )}
      </div>

      {/* Claim Submission Modal */}
      {claimModalBounty && (
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
          <div className="card" style={{ width: '90%', maxWidth: '700px', padding: 'var(--space-xl)', background: 'var(--nav-bg)', border: '1px solid var(--hairline-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Submit Skill Solution</h2>
              <button 
                onClick={() => setClaimModalBounty(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--body)', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <p style={{ color: 'var(--mute)', fontSize: '14px', marginBottom: 'var(--space-md)' }}>
              You are claiming the bounty <strong>{claimModalBounty.title}</strong>. 
              Please paste your completed skill code below. This code will only be visible to the bounty creator and will not be published publicly.
            </p>

            <textarea 
              value={claimCode}
              onChange={e => setClaimCode(e.target.value)}
              placeholder="Paste your skill code here..."
              style={{
                width: '100%',
                height: '300px',
                padding: 'var(--space-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                background: 'var(--canvas)',
                color: 'var(--ink)',
                border: '1px solid var(--hairline-strong)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-md)',
                resize: 'vertical'
              }}
            />

            <div style={{ textAlign: 'right' }}>
              <button 
                className="btn btn-primary" 
                onClick={submitClaimBounty}
                disabled={isClaiming || !claimCode.trim()}
              >
                {isClaiming ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
