import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SkillCard from './SkillCard';

const CATEGORIES = [
  { id: 'all', label: 'All Domains' },
  { id: 'automation', label: 'Automation' },
  { id: 'copywriting', label: 'Copywriting' },
  { id: 'customer-support', label: 'Customer Support' },
  { id: 'data-science', label: 'Data Science' },
  { id: 'design', label: 'Design' },
  { id: 'development', label: 'Development' },
  { id: 'education', label: 'Education' },
  { id: 'finance', label: 'Finance' },
  { id: 'general', label: 'General' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'legal', label: 'Legal' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'security', label: 'Security' }
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
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills`)
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
      <div className="mb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20 mb-6">category</span>
        <h1 className="text-4xl mb-2 text-zinc-100 font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{displayCategory}</span> AI Agent Skills
        </h1>
        <p className="text-zinc-300 text-base">Accelerate your workflow with verified {displayCategory.toLowerCase()} prompt artifacts.</p>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-16 items-start">
      
        {/* Sidebar */}
        <aside className="sticky top-16">
          <div className="mb-8">
            <input 
              type="text" 
              placeholder="Search skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <h3 className="text-xs uppercase tracking-widest text-zinc-400 mb-4 font-semibold">Domains</h3>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map(cat => (
              <a
                key={cat.id}
                href={cat.id === 'all' ? '/browse' : `/category/${cat.id}`}
                className={`text-left px-4 py-2.5 rounded-xl text-[15px] transition-all block ${cat.id === slug ? 'bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20' : 'bg-transparent text-zinc-300 font-normal hover:bg-zinc-800/50'}`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main Content Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-zinc-900/50 rounded-2xl h-[250px] animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all text-center">
              <p className="text-zinc-400 text-base">No {displayCategory.toLowerCase()} skills available yet. Be the first to <a href="/sell" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">publish one</a>.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8">
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
