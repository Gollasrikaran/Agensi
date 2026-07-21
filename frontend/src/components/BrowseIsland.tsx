import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SkillCard from './SkillCard';

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
  const [upvoteStates, setUpvoteStates] = useState<Record<string, boolean>>({});
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = () => {
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills`)
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
        checkUpvoteStates(data);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const checkUpvoteStates = async (skillsData: any[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const states: Record<string, boolean> = {};
    for (const skill of skillsData) {
      try {
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${skill.id}/upvote/status`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          states[skill.id] = data.upvoted;
        }
      } catch (e) {
        // ignore
      }
    }
    setUpvoteStates(states);
  };

  const handleUpvote = async (e: React.MouseEvent, skillId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (upvotingIds.has(skillId)) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    setUpvotingIds(prev => new Set(prev).add(skillId));
    
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/${skillId}/upvote`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUpvoteStates(prev => ({...prev, [skillId]: data.upvoted}));
        setSkills((prev: any) => prev.map((s: any) => s.id === skillId ? {...s, upvotes: data.upvotes} : s));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpvotingIds(prev => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  let filteredSkills = skills.filter((skill: any) => {
    const matchesCategory = activeCategory === 'all' || (skill.category || '').toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch = skill.title.toLowerCase().includes(searchQuery.toLowerCase()) || skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  filteredSkills.sort((a: any, b: any) => {
    if ((b.upvotes || 0) === (a.upvotes || 0)) {
        return (b.purchase_count || 0) - (a.purchase_count || 0);
    }
    return (b.upvotes || 0) - (a.upvotes || 0);
  });

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
              background: 'var(--canvas)',
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
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: 'var(--canvas-soft-2)', borderRadius: 'var(--radius-md)', height: '250px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <p style={{ color: 'var(--mute)', fontSize: '16px' }}>No skills found in this domain.</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredSkills.map((skill: any, index: number) => {
              const isTopVoted = index === 0 && (skill.upvotes || 0) > 0 && searchQuery === '';
              const isUpvoted = upvoteStates[skill.id];
              
              return (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isUpvoted={isUpvoted}
                  isUpvoting={upvotingIds.has(skill.id)}
                  onUpvote={handleUpvote}
                  showRank={isTopVoted ? 1 : null}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
