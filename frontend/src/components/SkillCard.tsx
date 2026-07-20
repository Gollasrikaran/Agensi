import React from 'react';

interface SkillCardProps {
  skill: any;
  isUpvoted?: boolean;
  isUpvoting?: boolean;
  onUpvote?: (e: React.MouseEvent, skillId: string) => void;
  showRank?: number | null;
}

export default function SkillCard({ skill, isUpvoted = false, isUpvoting = false, onUpvote, showRank = null }: SkillCardProps) {
  return (
    <a 
      href={`/skill/${skill.id}`} 
      className="card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        textDecoration: 'none', 
        padding: 'var(--space-xl)',
        position: 'relative',
        border: showRank === 1 ? '1px solid var(--primary)' : '1px solid var(--hairline-strong)',
        background: showRank === 1 ? 'var(--canvas-soft-2)' : 'var(--canvas)',
        overflow: 'hidden',
        minHeight: '280px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {showRank && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'var(--canvas)', padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderBottomLeftRadius: 'var(--radius-md)', textTransform: 'uppercase' }}>
          #{showRank} TOP SKILL
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)', marginTop: showRank ? 'var(--space-sm)' : '0', flexWrap: 'wrap' }}>
          {skill.moderation_status === 'approved' ? (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none' }}>🛡️ Verified</span>
          ) : (
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'none' }}>Pending</span>
          )}
          {skill.category && (
            <span className="badge" style={{ textTransform: 'uppercase', background: 'var(--canvas-soft)', border: 'none', color: 'var(--mute)' }}>
              {skill.category}
            </span>
          )}
          {/* Agent Compatibility Tags */}
          {skill.compatible_agents && skill.compatible_agents.map((agent: string) => (
            <span key={agent} className="badge" style={{ background: 'rgba(108, 60, 225, 0.1)', color: 'var(--primary)', border: '1px solid rgba(108, 60, 225, 0.2)' }}>
              {agent}
            </span>
          ))}
        </div>
        
        {/* Title and Upvote */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-xs)' }}>
          <h3 style={{ fontSize: '22px', marginBottom: 0, color: 'var(--ink)', lineHeight: '1.2' }}>{skill.title}</h3>
          
          {onUpvote && (
            <button 
              onClick={(e) => onUpvote(e, skill.id)}
              className="btn" 
              aria-label="Upvote skill"
              disabled={isUpvoting}
              style={{ 
                padding: '4px 8px', 
                background: isUpvoted ? 'var(--primary-soft)' : 'var(--canvas-soft)', 
                border: '1px solid var(--hairline-strong)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                color: isUpvoted ? 'var(--primary)' : 'var(--ink)',
                marginLeft: '12px',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '12px' }}>▲</span>
              <span style={{ fontSize: '12px', fontWeight: '700' }}>{skill.upvotes || 0}</span>
            </button>
          )}
        </div>
        
        {/* Star Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', color: '#fbbf24', fontSize: '14px' }}>
            {'★'.repeat(Math.round(skill.average_rating || 0))}
            <span style={{ color: 'var(--hairline-strong)' }}>
              {'★'.repeat(5 - Math.round(skill.average_rating || 0))}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: '500' }}>
            {skill.average_rating ? skill.average_rating.toFixed(1) : 'New'} 
            {skill.review_count > 0 && ` (${skill.review_count})`}
          </span>
        </div>
        
        {/* Description */}
        <p style={{ color: 'var(--body)', fontSize: '15px', lineHeight: '1.6', marginBottom: 'var(--space-xl)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
          {skill.description}
        </p>
        
        {/* Footer: Price and Author */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-1px', color: 'var(--ink)' }}>
            {skill.base_price_inr === 0 ? 'Free' : `₹${(skill.base_price_inr || 0).toFixed(0)}`}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'var(--canvas-soft)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--hairline)' }}>
            <img 
              src={skill.seller?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(skill.seller?.username || 'user')}&backgroundColor=6C3CE1&textColor=ffffff`}
              alt="avatar" 
              style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--body)', fontWeight: '500' }}>
              {skill.seller?.username || 'Anonymous'}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
