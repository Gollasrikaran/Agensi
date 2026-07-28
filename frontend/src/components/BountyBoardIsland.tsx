import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BountyBoardIsland() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // open, closed, my-bounties
  
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
    setLoading(true);
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
        fetchRequests(); 
        setActiveTab('my-bounties');
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

  const filterRequests = () => {
    switch(activeTab) {
      case 'open':
        return requests.filter(r => r.status === 'open');
      case 'closed':
        return requests.filter(r => r.status === 'closed');
      case 'my-bounties':
        return requests.filter(r => r.buyer_id === session?.user?.id);
      default:
        return requests;
    }
  };

  const filteredRequests = filterRequests();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'start' }}>
      
      {/* Left: Bounty List */}
      <div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)' }}>
          {['open', 'closed', 'my-bounties'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: activeTab === tab ? '600' : '500',
                color: activeTab === tab ? 'var(--primary)' : 'var(--mute)',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
        
        {loading ? (
          <p style={{ color: 'var(--mute)' }}>Loading bounties...</p>
        ) : filteredRequests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <p style={{ color: 'var(--mute)' }}>No bounties found in this tab.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {filteredRequests.map((req: any) => (
              <div key={req.id} className="card" style={{ padding: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)', alignItems: 'center' }}>
                    <span className={`badge ${req.status === 'closed' ? 'success' : 'warning'}`} style={{ textTransform: 'uppercase' }}>
                      {req.status}
                    </span>
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
                  {req.status === 'open' && req.buyer_id !== session?.user?.id && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => openClaimModal(req)}
                    >
                      Claim Bounty
                    </button>
                  )}
                  {req.buyer_id === session?.user?.id && req.status === 'open' && (
                     <a href="/dashboard/bounties" className="btn btn-secondary">Manage Claims</a>
                  )}
                  {req.status === 'closed' && (
                     <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '8px' }}>
                       Closed on {new Date(req.created_at).toLocaleDateString()}
                     </div>
                  )}
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
                placeholder="Describe exactly what the agent should do..."
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)', resize: 'vertical' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: 'var(--space-xs)' }}>Bounty Amount (₹)</label>
              <input 
                type="number" 
                required 
                min="100"
                value={bountyInr}
                onChange={e => setBountyInr(e.target.value)}
                placeholder="e.g. 500"
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }} 
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isPosting}>
              {isPosting ? 'Posting...' : 'Post Bounty'}
            </button>
          </form>
        )}
      </div>

      {/* Claim Modal */}
      {claimModalBounty && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: 'var(--space-2xl)' }}>
            <h3 style={{ marginBottom: '16px' }}>Submit Code for '{claimModalBounty.title}'</h3>
            <p style={{ fontSize: '14px', color: 'var(--mute)', marginBottom: '24px' }}>
              Paste the completed skill code here. The bounty owner will review it in a protected environment.
            </p>
            <textarea 
              rows={10} 
              placeholder="Paste skill code here..." 
              value={claimCode}
              onChange={e => setClaimCode(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--canvas-soft)', color: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: '8px', marginBottom: '24px', fontFamily: 'var(--font-mono)' }}
            />
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setClaimModalBounty(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitClaimBounty} disabled={isClaiming}>
                {isClaiming ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
