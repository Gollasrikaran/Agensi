import React from 'react';

interface SkillCardProps {
  skill: any;
  isUpvoted?: boolean;
  isUpvoting?: boolean;
  onUpvote?: (e: React.MouseEvent, skillId: string) => void;
  showRank?: number | null;
}

// Map categories to CSS variables
const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    'frontend': 'var(--cat-frontend)',
    'testing': 'var(--cat-testing)',
    'devops': 'var(--cat-devops)',
    'docs': 'var(--cat-docs)',
    'productivity': 'var(--cat-productivity)',
    'data': 'var(--cat-data)',
    'api': 'var(--cat-api)',
    'ai': 'var(--cat-ai)'
  };
  return map[category?.toLowerCase()] || 'var(--accent-primary)';
};

export default function SkillCard({ skill, isUpvoted = false, isUpvoting = false, onUpvote, showRank = null }: SkillCardProps) {
  const catColor = getCategoryColor(skill.category);
  const isFree = skill.base_price_inr === 0 || skill.is_free;
  
  return (
    <div
      className="skill-card" 
      onClick={() => window.location.href = `/skill/${skill.id}`}
      style={{ 
        cursor: 'pointer',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        textDecoration: 'none', 
        padding: '20px',
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: 'var(--glass-border)',
        borderLeft: `4px solid ${catColor}`,
        borderRadius: 'var(--border-radius-card)',
        overflow: 'hidden',
        minHeight: '280px',
        transition: 'var(--transition-smooth)',
        boxShadow: 'var(--card-shadow)',
        color: 'var(--text-primary)',
        marginTop: '10px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
        e.currentTarget.style.borderColor = catColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      {/* Price Badge */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: isFree ? 'var(--price-free)' : 'var(--price-paid)',
        color: '#fff',
        padding: '6px 14px',
        borderRadius: 'var(--border-radius-pill)',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: isFree ? '0 0 10px rgba(16, 185, 129, 0.3)' : '0 0 10px rgba(245, 158, 11, 0.3)',
        zIndex: 2,
        pointerEvents: 'none'
      }}>
        {isFree ? 'Free' : `₹${skill.base_price_inr}`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '80px', zIndex: 2, position: 'relative', pointerEvents: 'none' }}>
        
        {/* Creator Info */}
        <a 
          href={`/profile/${skill.seller?.username || 'bodhic'}`}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textDecoration: 'none', pointerEvents: 'auto', width: 'fit-content', position: 'relative', zIndex: 3 }}
        >
          <img 
            src={skill.seller?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${skill.seller?.username || 'U'}`}
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-tertiary)' }}
            alt={skill.seller?.username || 'Creator'}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            by <span style={{ color: 'var(--primary)', fontWeight: 500 }}>@{skill.seller?.username || 'creator'}</span> {skill.seller?.is_verified && '✅'}
          </span>
        </a>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
          {skill.title}
        </h3>

        {/* Description */}
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--text-muted)', 
          margin: '0 0 16px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.5'
        }}>
          {skill.description}
        </p>

        {/* Agent Compatibility */}
        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', marginBottom: '16px' }}>
           {/* Fallback mock agents for now */}
           {['Cursor', 'Claude'].map(agent => (
             <span key={agent} style={{
               background: 'var(--bg-tertiary)',
               border: 'var(--glass-border)',
               padding: '4px 8px',
               borderRadius: '4px',
               fontSize: '11px',
               color: 'var(--text-secondary)'
             }}>
               {agent}
             </span>
           ))}
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid var(--bg-tertiary)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {skill.created_at && (
            <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
              Uploaded {new Date(skill.created_at).toLocaleDateString()}
            </span>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills/${skill.id}/vote`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'upvote' })
                });
                skill.upvotes = (skill.upvotes || 0) + 1; // Optimistic update
              }}
              style={{ background: 'var(--success-soft)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ▲ {skill.upvotes || 0}
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills/${skill.id}/vote`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'downvote' })
                });
                skill.downvotes = (skill.downvotes || 0) + 1; // Optimistic update
              }}
              style={{ background: 'var(--error-soft)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ▼ {skill.downvotes || 0}
            </button>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--pulse-sale)' }}>↓</span> {skill.purchase_count || 0}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--warning)' }}>★</span> {skill.rating !== null ? skill.rating : 'No reviews'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 500, fontSize: '12px' }}>
          🛡️ Verified
        </div>
      </div>
    </div>
  );
}
