import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Target, FileText, IndianRupee, Clock, CheckCircle2, ChevronRight, CheckSquare, XCircle, Search, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);

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
    setClaimError(null);
    setClaimSuccess(false);
  };

  const submitClaimBounty = async () => {
    if (!claimModalBounty) return;
    setClaimError(null);
    if (!claimCode.trim()) {
      setClaimError("You must provide the skill code to claim this bounty.");
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
        setClaimSuccess(true);
        fetchRequests();
        setTimeout(() => {
          setClaimModalBounty(null);
          setClaimSuccess(false);
        }, 2500);
      } else {
        const err = await res.json();
        setClaimError(err.detail || "Failed to claim bounty.");
      }
    } catch (e: any) {
      setClaimError(e.message || "Network error occurred.");
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
      
      {/* Left: Bounty List */}
      <div className="min-w-0">
        <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-px overflow-x-auto">
          {[
            { id: 'open', label: 'Open Bounties', icon: Target },
            { id: 'closed', label: 'Closed', icon: CheckCircle2 },
            { id: 'my-bounties', label: 'My Bounties', icon: CheckSquare }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all border-b-2",
                activeTab === tab.id 
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg" 
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-t-lg"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20 text-zinc-500 flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <p className="text-sm font-medium">Loading bounties...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/20 py-24 px-6 text-center">
            <div className="rounded-full bg-zinc-800/50 p-4 mb-4">
              <Search className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">No bounties found</h3>
            <p className="text-sm text-zinc-500">There are no bounties in this category right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredRequests.map((req: any) => (
              <div key={req.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-indigo-500/30 transition-colors shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                      req.status === 'closed' 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                      {req.status === 'closed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {req.status}
                    </span>
                    <span className="text-sm font-medium text-zinc-500">
                      {req.creator?.username ? `Posted by @${req.creator.username}` : 'Anonymous'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mb-2">{req.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl whitespace-pre-wrap line-clamp-3">{req.description}</p>
                </div>
                
                <div className="flex flex-col md:items-end justify-between min-w-[140px] shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center gap-1.5 text-2xl font-black font-mono text-zinc-100 mb-4 md:mb-0">
                    <IndianRupee className="h-5 w-5 text-zinc-500" />
                    {req.bounty_inr}
                  </div>
                  
                  {req.status === 'open' && req.buyer_id !== session?.user?.id && (
                    <button 
                      onClick={() => openClaimModal(req)}
                      className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
                    >
                      <CheckSquare className="h-4 w-4" /> Claim Bounty
                    </button>
                  )}
                  {req.buyer_id === session?.user?.id && req.status === 'open' && (
                     <a href="/dashboard/bounties" className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700">
                        Manage Claims <ChevronRight className="h-4 w-4" />
                     </a>
                  )}
                  {req.status === 'closed' && (
                     <div className="text-xs font-medium text-zinc-500 mt-2 text-left md:text-right">
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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 sticky top-24 shadow-xl">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">Post a Request</h3>
          <p className="text-sm text-zinc-400 mt-2">
            Need a highly specific agent workflow? Post a bounty and let our verified creators build it for you.
          </p>
        </div>

        {!session ? (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center">
            <p className="text-sm font-medium text-zinc-300 mb-4">You must be logged in to post.</p>
            <a href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-md transition-all hover:bg-white">
              Log In
            </a>
          </div>
        ) : (
          <form onSubmit={handlePostRequest} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" /> Skill Title / Need
              </label>
              <input 
                type="text" 
                required 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="E.g., Automated Invoice Processor"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" /> Detailed Description
              </label>
              <textarea 
                required 
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe exactly what the agent should do..."
                className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-zinc-500" /> Bounty Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium font-mono">₹</span>
                <input 
                  type="number" 
                  required 
                  min="100"
                  value={bountyInr}
                  onChange={e => setBountyInr(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-4 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPosting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50 mt-2"
            >
              {isPosting ? 'Posting...' : <><Sparkles className="h-4 w-4" /> Post Bounty</>}
            </button>
          </form>
        )}
      </div>

      {/* Claim Modal */}
      {claimModalBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl overflow-hidden">
            {claimSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-2">Claim Submitted!</h3>
                <p className="text-zinc-400 max-w-sm">The bounty owner has been notified. You can track this claim in your dashboard.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-zinc-100 mb-2">Submit Code for '{claimModalBounty.title}'</h3>
                  <p className="text-sm text-zinc-400">
                    Paste the completed skill code here. The bounty owner will review it in a protected environment.
                  </p>
                </div>
                
                {claimError && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    {claimError}
                  </div>
                )}
                
                <textarea 
                  rows={10} 
                  placeholder="Paste skill code here..." 
                  value={claimCode}
                  onChange={e => setClaimCode(e.target.value)}
                  disabled={isClaiming}
                  className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-6 disabled:opacity-50"
                />
                
                <div className="flex flex-wrap justify-end gap-3">
                  <button 
                    className="rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50" 
                    onClick={() => { setClaimModalBounty(null); setClaimError(null); }}
                    disabled={isClaiming}
                  >
                    Cancel
                  </button>
                  <button 
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-2" 
                    onClick={submitClaimBounty} 
                    disabled={isClaiming}
                  >
                    {isClaiming ? 'Submitting...' : <><CheckCircle2 className="h-4 w-4" /> Submit Claim</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
