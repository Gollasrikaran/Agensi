import React from 'react';
import { ShieldCheck, Star, ShoppingCart, TrendingUp, Download } from 'lucide-react';

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
    'frontend': 'var(--cat-frontend, var(--accent))',
    'testing': 'var(--cat-testing, var(--primary))',
    'devops': 'var(--cat-devops, var(--warning))',
    'docs': 'var(--cat-docs, var(--success))',
    'productivity': 'var(--cat-productivity, var(--accent-deep))',
    'data': 'var(--cat-data, var(--primary-hover))',
    'api': 'var(--cat-api, var(--success))',
    'ai': 'var(--cat-ai, var(--primary))'
  };
  return map[category?.toLowerCase()] || 'var(--primary)';
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
        textDecoration: 'none', 
        position: 'relative',
        background: 'var(--canvas-elevated)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: '340px',
        transition: 'var(--transition-colors)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--ink)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = catColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--hairline)';
      }}
    >
      {/* 16:9 Thumbnail Header */}
      <div style={{ 
        height: '160px', 
        background: `linear-gradient(135deg, var(--canvas-soft-2) 0%, ${catColor}22 100%)`, 
        position: 'relative',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Clickable Category/Domain Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10, padding: '0 16px' }}>
          {((skill.category || 'AI').split(',').map((c: string) => c.trim()).filter(Boolean)).map((cat: string, index: number) => (
            <a 
              key={index}
              href={`/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: catColor,
                background: 'var(--canvas-elevated)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                textDecoration: 'none',
                letterSpacing: '1px',
                boxShadow: 'var(--shadow-sm)',
                border: `1px solid ${catColor}44`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = catColor;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'var(--canvas-elevated)';
                e.currentTarget.style.color = catColor;
              }}
            >
              {cat}
            </a>
          ))}
        </div>

        {/* Rank Badge */}
        {showRank && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'var(--canvas-elevated)',
            border: '1px solid var(--hairline)',
            color: 'var(--ink)',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            #{showRank}
          </div>
        )}

        {/* Price Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: isFree ? 'var(--success)' : 'var(--canvas-elevated)',
          color: isFree ? '#fff' : 'var(--ink)',
          border: isFree ? 'none' : '1px solid var(--hairline-strong)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {isFree ? 'Free' : `₹${skill.base_price_inr}`}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px' }}>
        
        {/* Creator Info */}
        <a 
          href={`/profile/${skill.seller?.username || 'bodhic'}`}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textDecoration: 'none', pointerEvents: 'auto', width: 'fit-content' }}
        >
          <img 
            src={skill.seller?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${skill.seller?.username || 'U'}`}
            style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--canvas-soft)', border: '1px solid var(--hairline)' }}
            alt={skill.seller?.username || 'Creator'}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mute)', fontWeight: 500 }}>
            by <span style={{ color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>@{skill.seller?.username || 'creator'}</span>
            {skill.seller?.is_verified && <ShieldCheck style={{ display: 'inline', width: '14px', height: '14px', marginLeft: '4px', color: 'var(--primary)', verticalAlign: 'text-bottom' }} />}
          </span>
        </a>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-lg)', color: 'var(--ink)', lineHeight: '1.3' }}>
          {skill.title}
        </h3>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {skill.moderation_status === 'approved' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', fontSize: '10px', fontWeight: 700, boxShadow: '0 0 8px rgba(16, 185, 129, 0.1)' }}>
              🛡️ Passed OWASP
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', fontSize: '10px', fontWeight: 700, boxShadow: '0 0 8px var(--primary-soft)' }}>
            🔌 MCP Ready
          </span>
        </div>

        {/* Description */}
        <p style={{ 
          fontSize: 'var(--text-sm)', 
          color: 'var(--body)', 
          margin: '0 0 16px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.5',
          flex: 1
        }}>
          {skill.description}
        </p>

        {/* Agent Compatibility */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
           {/* Fallback mock agents for now */}
           {['Cursor', 'Claude'].map(agent => (
             <span key={agent} style={{
               background: 'var(--canvas-soft)',
               border: '1px solid var(--hairline)',
               padding: '2px 8px',
               borderRadius: '4px',
               fontSize: 'var(--text-xs)',
               color: 'var(--mute)',
               fontWeight: 500
             }}>
               {agent}
             </span>
           ))}
        </div>
      </div>

      {/* Trust Signals & Engagement Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px 16px',
        background: 'var(--canvas-soft)',
        borderTop: '1px solid var(--hairline)',
        fontSize: 'var(--text-xs)',
        color: 'var(--mute)'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star style={{ width: '14px', height: '14px', color: 'var(--warning)' }} /> 
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{skill.rating !== null ? skill.rating : 'New'}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Download style={{ width: '14px', height: '14px' }} /> 
            {skill.purchase_count || 0}
          </span>
        </div>

        {/* Upvote Button */}
        <button 
          onClick={(e) => {
            if (onUpvote) onUpvote(e, skill.id);
          }}
          disabled={isUpvoting}
          style={{ 
            background: isUpvoted ? 'var(--primary-soft)' : 'transparent',
            border: `1px solid ${isUpvoted ? 'var(--primary)' : 'var(--hairline-strong)'}`,
            borderRadius: 'var(--radius-md)', 
            padding: '4px 10px', 
            color: isUpvoted ? 'var(--primary)' : 'var(--body)', 
            cursor: isUpvoting ? 'wait' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isUpvoted && !isUpvoting) {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isUpvoted && !isUpvoting) {
              e.currentTarget.style.borderColor = 'var(--hairline-strong)';
              e.currentTarget.style.color = 'var(--body)';
            }
          }}
        >
          <TrendingUp style={{ width: '14px', height: '14px' }} />
          {skill.upvotes || 0}
        </button>
      </div>
    </div>
  );
}
