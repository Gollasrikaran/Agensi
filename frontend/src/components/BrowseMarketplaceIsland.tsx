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

  useEffect(() => {
    fetch(`${API_BASE}/api/public/skills`)
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching skills:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Loading marketplace...</div>;
  }

  return (
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
              <button className="btn btn-primary btn-sm">
                View Details
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
