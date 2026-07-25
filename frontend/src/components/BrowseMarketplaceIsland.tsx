import React, { useEffect, useState } from 'react';
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
}

export default function BrowseMarketplaceIsland() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000'}/api/public/skills?audience=${audience}`)
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching skills:", err);
        setLoading(false);
      });
  }, [audience]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', justifyContent: 'center' }}>
        <button 
          className={`btn ${audience === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setAudience('all')}
        >
          All Skills
        </button>
        <button 
          className={`btn ${audience === 'student' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setAudience('student')}
        >
          For Students
        </button>
        <button 
          className={`btn ${audience === 'professional' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setAudience('professional')}
        >
          For Professionals
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
          <div key={skill.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(
                    audience === 'student' || skill.target_audience === 'student'
                      ? `Bro, stop wasting hours on assignments... bodhicai.tech/?ref=YOUR_ID`
                      : `Hey, found this clean FastMCP marketplace for automating local dev workflows... bodhicai.tech/?ref=YOUR_ID`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{ background: '#25D366', color: '#fff', border: 'none' }}
                >
                  Share 🚀
                </a>
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
