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

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`http://localhost:8000/api/public/skills/${skillId}/reviews`);
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

  if (loading) return <div style={{ padding: '20px', color: 'var(--mute)' }}>Loading reviews...</div>;
  if (error) return <div style={{ padding: '20px', color: 'var(--error)' }}>Failed to load reviews.</div>;
  if (reviews.length === 0) return <div style={{ padding: '20px', color: 'var(--mute)' }}>No reviews yet. Be the first to review!</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {reviews.map((review, i) => (
        <div key={i} className="card" style={{ padding: 'var(--space-md)', background: 'var(--canvas)', border: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src={review.buyer?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(review.buyer?.username || 'user')}&backgroundColor=6C3CE1&textColor=ffffff`}
                alt="avatar" 
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontWeight: '600', color: 'var(--ink)' }}>{review.buyer?.username || 'Anonymous'}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mute)' }}>
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div style={{ display: 'flex', color: '#fbbf24', fontSize: '14px', marginBottom: 'var(--space-xs)' }}>
            {'★'.repeat(Math.round(review.rating))}
            <span style={{ color: 'var(--hairline-strong)' }}>
              {'★'.repeat(5 - Math.round(review.rating))}
            </span>
          </div>
          
          {review.comment && (
            <p style={{ color: 'var(--body)', fontSize: '14px', lineHeight: '1.5', marginTop: '4px' }}>
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
