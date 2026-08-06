import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    async function fetchReviews() {
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
    }
    fetchReviews();
  }, [skillId]);

  if (loading) return <div className="p-5 text-zinc-500 text-center">Loading reviews...</div>;
  if (error) return <div className="p-5 text-red-500 text-center bg-red-500/10 rounded-xl border border-red-500/20">Failed to load reviews.</div>;
  if (reviews.length === 0) return <div className="p-5 text-zinc-400 text-center italic bg-zinc-900/50 rounded-xl border border-zinc-800">No reviews yet. Be the first to review!</div>;

  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
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
          
          <div className="flex text-amber-500 text-sm mb-3">
            {'★'.repeat(Math.round(review.rating))}
            <span className="text-zinc-700">
              {'★'.repeat(5 - Math.round(review.rating))}
            </span>
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
    </div>
  );
}
