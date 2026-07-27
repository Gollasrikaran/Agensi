import React, { useEffect, useState } from 'react';
import { getReferralId } from '../lib/referral';
import SocialShareButtonsIsland from './SocialShareButtonsIsland';

interface SellerProfile {
  username: string | null;
  avatar_url: string | null;
}

interface Skill {
  id: string;
  title: string;
  description: string;
  base_price_inr: number;
  seller: SellerProfile;
  media_url?: string | null;
}

export default function BrowseMarketplaceIsland() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<string>('all');
  const [itemType, setItemType] = useState<string>('all');
  const [refId, setRefId] = useState('REF-BODHIC');

  useEffect(() => {
    getReferralId().then(setRefId);
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bodhicai.onrender.com';

  useEffect(() => {
    setLoading(true);
    const apiBase = import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000';
    fetch(`${apiBase}/api/public/skills?audience=${audience}&item_type=${itemType}`)
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching skills:", err);
        setLoading(false);
      });
  }, [audience, itemType]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)', justifyContent: 'center', background: 'var(--canvas-soft)', padding: '6px', borderRadius: 'var(--radius-pill)', width: 'fit-content', margin: '0 auto var(--space-md) auto', border: '1px solid var(--hairline)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: itemType === 'all' ? 'var(--primary)' : 'transparent', color: itemType === 'all' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setItemType('all')}
        >
          ✨ Everything
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: itemType === 'skill' ? 'var(--primary)' : 'transparent', color: itemType === 'skill' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setItemType('skill')}
        >
          🤖 AI Skills
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: itemType === 'prompt' ? 'var(--primary)' : 'transparent', color: itemType === 'prompt' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setItemType('prompt')}
        >
          📝 Prompts
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-2xl)', justifyContent: 'center', background: 'var(--canvas-soft)', padding: '6px', borderRadius: 'var(--radius-pill)', width: 'fit-content', margin: '0 auto var(--space-2xl) auto', border: '1px solid var(--hairline)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: audience === 'all' ? 'var(--primary)' : 'transparent', color: audience === 'all' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setAudience('all')}
        >
          ✨ All Audiences
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: audience === 'student' ? 'var(--primary)' : 'transparent', color: audience === 'student' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setAudience('student')}
        >
          🎓 For Students
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: audience === 'professional' ? 'var(--primary)' : 'transparent', color: audience === 'professional' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setAudience('professional')}
        >
          💼 For Professionals
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Loading marketplace...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
      {skills.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--mute)' }}>
          No skills available in the marketplace yet.
        </div>
      ) : (
        skills.map(skill => (
          <div key={skill.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {skill.media_url && (
              <div style={{ width: '100%', height: '160px', position: 'relative', background: 'var(--canvas-elevated)' }}>
                {skill.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video 
                    src={skill.media_url} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img 
                    src={skill.media_url} 
                    alt={skill.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            )}

            <div style={{ padding: 'var(--space-lg)', flexGrow: 1 }}>
              <h3 style={{ fontSize: '20px', marginBottom: 'var(--space-xs)', color: 'var(--ink)' }}>{skill.title}</h3>
              <p style={{ color: 'var(--body)', fontSize: '14px', lineHeight: 1.5, marginBottom: 'var(--space-md)' }}>
                {skill.description.length > 120 ? skill.description.substring(0, 120) + '...' : skill.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--hairline)' }}>
                {skill.seller?.avatar_url ? (
                  <img 
                    src={skill.seller.avatar_url} 
                    alt="avatar" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--canvas-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', fontSize: '14px' }}>
                    ?
                  </div>
                )}
                <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 500 }}>
                  {skill.seller?.username || 'Anonymous'}
                </span>
              </div>
            </div>

            <div style={{ padding: 'var(--space-md) var(--space-lg)', background: 'var(--canvas-soft)', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 600, fontSize: '18px', color: 'var(--primary)' }}>
                ₹{skill.base_price_inr}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <SocialShareButtonsIsland 
                  url={`${origin}/skill/${skill.id}?ref=${refId}`}
                  title={skill.title}
                  text={audience === 'student' || skill.target_audience === 'student' ? `Bro, stop wasting hours on assignments... check out "${skill.title}"!` : `Hey, found this clean FastMCP marketplace for automating local dev workflows... check out "${skill.title}"!`}
                  compact={true}
                  label="Share"
                />
                <button className="btn btn-primary btn-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))
      )}
        </div>
      )}
    </div>
  );
}
