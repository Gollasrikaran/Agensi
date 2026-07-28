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
  const [audience, setAudience] = useState('all');
  const [itemType, setItemType] = useState('all');
  const [upvoteStates, setUpvoteStates] = useState<Record<string, boolean>>({});
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSkills();
  }, [itemType]);

  const fetchSkills = () => {
    setLoading(true);
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills?item_type=${itemType}`)
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
    const matchesAudience = audience === 'all' || (skill.target_audience || 'professional') === audience;
    return matchesCategory && matchesSearch && matchesAudience;
  });
  
  filteredSkills.sort((a: any, b: any) => {
    if ((b.upvotes || 0) === (a.upvotes || 0)) {
        return (b.purchase_count || 0) - (a.purchase_count || 0);
    }
    return (b.upvotes || 0) - (a.upvotes || 0);
  });

  const getTitle = () => {
    if (itemType === 'skill') return 'Browse AI Agent Skills';
    if (itemType === 'prompt') return 'Browse AI Prompts';
    return 'Browse AI Skills & Prompts';
  };

  return (
    <div>
      {/* Dynamic Header */}
      <div style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
        <span className="eyebrow" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px', padding: '6px 16px', background: 'var(--primary-soft)', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(108, 60, 225, 0.15)', display: 'inline-block', marginBottom: 'var(--space-md)' }}>marketplace</span>
        <h1 style={{ fontSize: '36px', marginBottom: 'var(--space-xs)' }}>{getTitle()}</h1>
        <p style={{ color: 'var(--body)', fontSize: '16px' }}>Discover secure, verified prompts and agent workflows by domain.</p>
      </div>

      {/* Item Type Segmented Pill Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)', justifyContent: 'center', background: 'var(--canvas-soft)', padding: '6px', borderRadius: 'var(--radius-pill)', width: 'fit-content', margin: '0 auto var(--space-md) auto', border: '1px solid var(--hairline)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: itemType === 'all' ? 'var(--primary)' : 'transparent', color: itemType === 'all' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setItemType('all')}
        >
          Everything
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: itemType === 'skill' ? 'var(--primary)' : 'transparent', color: itemType === 'skill' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setItemType('skill')}
        >
          AI Skills
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: itemType === 'prompt' ? 'var(--primary)' : 'transparent', color: itemType === 'prompt' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setItemType('prompt')}
        >
          Prompts
        </button>
      </div>

      {/* Audience Segmented Pill Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-2xl)', justifyContent: 'center', background: 'var(--canvas-soft)', padding: '6px', borderRadius: 'var(--radius-pill)', width: 'fit-content', margin: '0 auto var(--space-2xl) auto', border: '1px solid var(--hairline)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: audience === 'all' ? 'var(--primary)' : 'transparent', color: audience === 'all' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setAudience('all')}
        >
          All Skills
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: audience === 'student' ? 'var(--primary)' : 'transparent', color: audience === 'student' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setAudience('student')}
        >
          For Students
        </button>
        <button 
          className="btn"
          style={{ borderRadius: 'var(--radius-pill)', border: 'none', background: audience === 'professional' ? 'var(--primary)' : 'transparent', color: audience === 'professional' ? '#fff' : 'var(--ink)', padding: '8px 20px', fontWeight: 500, transition: 'all 0.2s' }}
          onClick={() => setAudience('professional')}
        >
          For Professionals
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-2xl)', alignItems: 'start' }}>
      
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
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-xl)' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: 'var(--canvas-soft-2)', borderRadius: 'var(--radius-md)', height: '250px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
            <p style={{ color: 'var(--mute)', fontSize: '16px' }}>No skills found in this domain.</p>
          </div>
        ) : (
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-xl)' }}>
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
    </div>
  );
}
