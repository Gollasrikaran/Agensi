import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ReferralShareCardIsland from './ReferralShareCardIsland';
import { Download, Star, ExternalLink, ArrowRight, PackageOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BuyerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  
  // Review State
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const submitReview = async (skillId: string) => {
    try {
      setSubmittingReview(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ skill_id: skillId, rating, comment: comment || null })
      });
      if (!res.ok) throw new Error('Failed to submit review');
      alert('Review submitted successfully!');
      setReviewingId(null);
      setRating(5);
      setComment('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not authenticated'); return; }

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/purchases`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch purchases');
      setPurchases(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium">Loading purchases...</p>
    </div>
  );
  if (error) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Your Purchases</h2>
          <p className="text-zinc-400 mt-1">Manage and download the skills you've acquired.</p>
        </div>
        <a 
          href="/dashboard/seller" 
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-700 shadow-sm"
        >
          <span>Switch to Creator Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      
      <ReferralShareCardIsland />
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <PackageOpen className="h-5 w-5 text-indigo-400" /> Collection
        </h3>
        {purchases.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <PackageOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-200 mb-2">No purchases yet</h3>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Discover powerful AI skills and prompts to supercharge your workflow.</p>
            <a href="/browse" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5">
              Browse Marketplace <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {purchases.map((purchase: any) => (
              <div key={purchase.id} className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {purchase.skills?.title || 'Unknown Skill'}
                  </h3>
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                    purchase.payment_status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}>
                    {purchase.payment_status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm mb-6 flex-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Paid</span>
                    <strong className="text-xl font-black text-zinc-200 font-mono">₹{purchase.amount}</strong>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Date</span>
                    <span className="text-zinc-400 font-medium">{new Date(purchase.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-4 border-t border-zinc-800/50">
                  <button 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-500 hover:shadow-indigo-500/20"
                    onClick={async () => {
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${purchase.skill_id}/download`, {
                          headers: { 'Authorization': `Bearer ${session?.access_token}` }
                        });
                        if (!res.ok) throw new Error('Download failed');
                        const data = await res.json();
                        const blob = new Blob([data.content], { type: 'text/markdown' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(purchase.skills?.title || 'skill').replace(/\s+/g, '_').toLowerCase()}.md`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  
                  {reviewingId !== purchase.skill_id && (
                    <button 
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
                      onClick={() => { setReviewingId(purchase.skill_id); setRating(5); setComment(''); }}
                    >
                      <Star className="h-4 w-4" /> Rate
                    </button>
                  )}
                </div>

                {reviewingId === purchase.skill_id && (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-center gap-2 mb-1">
                      {[1,2,3,4,5].map(star => (
                        <Star 
                          key={star} 
                          onClick={() => setRating(star)} 
                          className={cn("h-7 w-7 cursor-pointer transition-all hover:scale-110", rating >= star ? "fill-amber-400 text-amber-400" : "text-zinc-600 hover:text-zinc-500")}
                        />
                      ))}
                    </div>
                    <textarea 
                      placeholder="Share your experience (optional)..." 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full resize-none rounded-xl border border-zinc-700 bg-black/50 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setReviewingId(null)} className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors">Cancel</button>
                      <button onClick={() => submitReview(purchase.skill_id)} disabled={submittingReview} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20">Submit</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
