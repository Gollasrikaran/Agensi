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

interface Props {
  slug: string;
  displayCategory: string;
}

export default function BrowseByCategoryIsland({ slug, displayCategory }: Props) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [upvoteStates, setUpvoteStates] = useState<Record<string, boolean>>({});
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSkills();
  }, [slug]);

  const fetchSkills = () => {
    setLoading(true);
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((s: any) => {
          if (!s.category) return false;
          const cats = s.category.split(',').map((c: string) => c.trim().toLowerCase().replace(/\s+/g, '-'));
          return cats.includes(slug?.toLowerCase());
        });
        setSkills(filtered);
        setLoading(false);
        checkUpvoteStates(filtered);
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
    return skill.title.toLowerCase().includes(searchQuery.toLowerCase()) || skill.description.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  filteredSkills.sort((a: any, b: any) => {
    if ((b.upvotes || 0) === (a.upvotes || 0)) {
      return (b.purchase_count || 0) - (a.purchase_count || 0);
    }
    return (b.upvotes || 0) - (a.upvotes || 0);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
        <span className="eyebrow" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px', padding: '6px 16px', background: 'var(--primary-soft)', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(108, 60, 225, 0.15)', display: 'inline-block', marginBottom: 'var(--space-md)' }}>category</span>
        <h1 style={{ fontSize: '36px', marginBottom: 'var(--space-xs)' }}>
          <span className="gradient-text">{displayCategory}</span> AI Agent Skills
        </h1>
        <p style={{ color: 'var(--body)', fontSize: '16px' }}>Accelerate your workflow with verified {displayCategory.toLowerCase()} prompt artifacts.</p>
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
              <a
                key={cat.id}
                href={cat.id === 'all' ? '/browse' : `/category/${cat.id}`}
                style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: cat.id === slug ? 'var(--primary-soft)' : 'transparent',
                  color: cat.id === slug ? 'var(--primary)' : 'var(--body)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: cat.id === slug ? '600' : '400',
                  transition: 'all 0.2s ease',
                  display: 'block',
                }}
              >
                {cat.label}
              </a>
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
              <p style={{ color: 'var(--mute)', fontSize: '16px' }}>No {displayCategory.toLowerCase()} skills available yet. Be the first to <a href="/sell" style={{ color: 'var(--link)', textDecoration: 'underline' }}>publish one</a>.</p>
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
