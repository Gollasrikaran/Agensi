import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Review {
  rating: number;
  comment: string | null;
  created_at: string;
  buyer: {
    username: string;
    avatar_url: string;
  } | null;
}

export default function ReviewsIsland({ skillId }: { skillId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Review Form State
  const [session, setSession] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills/${skillId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    fetchReviews();
  }, [skillId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setSubmitMessage({ type: 'error', text: 'You must be logged in to leave a review.' });
      return;
    }
    if (rating === 0) {
      setSubmitMessage({ type: 'error', text: 'Please select a star rating.' });
      return;
    }
    
    setSubmitting(true);
    setSubmitMessage(null);
    
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          skill_id: skillId,
          rating,
          comment: comment.trim() || null
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit review');
      }
      
      setSubmitMessage({ type: 'success', text: 'Review submitted successfully!' });
      setRating(0);
      setComment('');
      fetchReviews(); // Refresh list
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* WRITE REVIEW FORM (Only if logged in) */}
      {session && (
        <div className="mb-4 p-6 rounded-2xl border border-zinc-800 bg-[#0c0c0e] shadow-xl">
          <h4 className="text-zinc-100 font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" /> Write a Review
          </h4>
          
          {submitMessage && (
            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${submitMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {submitMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {submitMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer bg-transparent border-none"
                  >
                    <Star 
                      size={24} 
                      className={`transition-colors ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional: What did you think of this skill?"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-y"
            ></textarea>
            
            <button 
              type="submit"
              disabled={submitting}
              className="self-end px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-5 text-zinc-500 text-center">Loading reviews...</div>
      ) : error ? (
        <div className="p-5 text-red-500 text-center bg-red-500/10 rounded-xl border border-red-500/20">Failed to load reviews.</div>
      ) : reviews.length === 0 ? (
        <div className="p-5 text-zinc-400 text-center italic bg-zinc-900/50 rounded-xl border border-zinc-800">No reviews yet. Be the first to review!</div>
      ) : (
        <>
          {displayedReviews.map((review, i) => (
            <div key={i} className="group flex flex-col p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={review.buyer?.avatar_url || ''}
                    alt="avatar" 
                    className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                  />
                  <span className="font-bold text-zinc-100">{review.buyer?.username || 'Anonymous'}</span>
                </div>
                <div className="text-xs text-zinc-500 font-medium">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={14} 
                    className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-zinc-800 text-zinc-800'} 
                  />
                ))}
              </div>
              
              {review.comment && (
                <p className="text-zinc-300 text-sm leading-relaxed m-0">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
          
          {reviews.length > 5 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 bg-transparent border border-zinc-700 text-indigo-400 rounded-full cursor-pointer self-center text-sm font-semibold transition-all hover:bg-zinc-800 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              {showAll ? 'Show Less' : `View All ${reviews.length} Reviews`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
