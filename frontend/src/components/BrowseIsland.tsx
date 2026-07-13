import React, { useEffect, useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Domains' },
  { id: 'development', label: 'Development' },
  { id: 'copywriting', label: 'Copywriting' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'data-science', label: 'Data Science' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'finance', label: 'Finance' },
  { id: 'design', label: 'Design' },
  { id: 'automation', label: 'Automation' },
  { id: 'customer-support', label: 'Customer Support' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'security', label: 'Security' },
  { id: 'legal', label: 'Legal' },
  { id: 'general', label: 'General' }
];

export default function BrowseIsland() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = () => {
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleUpvote = async (e: React.MouseEvent, skillId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/skills/${skillId}/upvote`, { method: 'POST' });
      if (res.ok) {
        fetchSkills(); // refresh upvotes
      }
    } catch (e) {
      console.error(e);
    }
  };

  let filteredSkills = skills.filter((skill: any) => {
    const matchesCategory = activeCategory === 'all' || (skill.category || '').toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch = skill.title.toLowerCase().includes(searchQuery.toLowerCase()) || skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Sort by upvotes descending
  filteredSkills.sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 'var(--space-2xl)', alignItems: 'start' }}>
      
      {/* Sidebar */}
      <aside style={{ position: 'sticky', top: 'var(--space-2xl)' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <input 
            type="text" 
            placeholder="Search skills..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--hairline-strong)',
              background: 'var(--canvas-soft)',
              color: 'var(--ink)',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--mute)', marginBottom: 'var(--space-md)' }}>Domains</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                textAlign: 'left',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: activeCategory === cat.id ? 'var(--primary-soft)' : 'transparent',
                color: activeCategory === cat.id ? 'var(--primary)' : 'var(--body)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeCategory === cat.id ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Grid */}
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <p style={{ color: 'var(--mute)' }}>Loading skills...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <p style={{ color: 'var(--mute)', fontSize: '16px' }}>No skills found in this domain.</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredSkills.map((skill: any, index: number) => {
              const isTopVoted = index === 0 && (skill.upvotes || 0) > 0 && searchQuery === '';
              
              return (
                <a 
                  key={skill.id} 
                  href={`/skill/${skill.id}`} 
                  className="card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    textDecoration: 'none', 
                    padding: 'var(--space-lg)',
                    position: 'relative',
                    border: isTopVoted ? '1px solid var(--primary)' : '1px solid var(--hairline-strong)',
                    background: isTopVoted ? 'var(--canvas-soft-2)' : 'var(--canvas)',
                    overflow: 'hidden'
                  }}
                >
                  {isTopVoted && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'white', padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderBottomLeftRadius: 'var(--radius-md)', textTransform: 'uppercase' }}>
                      TOP IN {activeCategory === 'all' ? 'OVERALL' : activeCategory}
                    </div>
                  )}
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-xs)', marginTop: isTopVoted ? 'var(--space-sm)' : '0' }}>
                      <h4 style={{ fontSize: '18px', marginBottom: 0, color: 'var(--ink)' }}>{skill.title}</h4>
                      <button 
                        onClick={(e) => handleUpvote(e, skill.id)}
                        className="btn" 
                        style={{ padding: '4px 8px', background: 'var(--canvas-soft)', border: '1px solid var(--hairline-strong)', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span style={{ fontSize: '12px' }}>▲</span>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{skill.upvotes || 0}</span>
                      </button>
                    </div>
                    <p style={{ color: 'var(--body)', fontSize: '14px', lineHeight: '20px', marginBottom: 'var(--space-lg)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {skill.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      {skill.scan_summary_json?.passed ? (
                        <span className="badge success">Verified</span>
                      ) : (
                        <span className="badge warning">Pending</span>
                      )}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '16px', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                      {skill.base_price_inr === 0 ? 'Free' : `₹${(skill.base_price_inr || 0).toFixed(0)}`}
                      {skill.billing_type === 'monthly' && <span style={{ fontSize: '12px', color: 'var(--mute)' }}>/mo</span>}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
