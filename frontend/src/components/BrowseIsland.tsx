import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SkillCard from './SkillCard';
import { Search, Filter, Sparkles, FolderOpen, Blocks } from 'lucide-react';
import { cn } from '../lib/utils';

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
      } catch (e) {}
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold tracking-widest uppercase">
          Marketplace
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">{getTitle()}</h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Discover secure, verified prompts and agent workflows by domain.</p>
      </div>

      {/* Filters Container */}
      <div className="flex flex-col items-center gap-6 mb-16">
        {/* Item Type Segmented Pill Bar */}
        <div className="inline-flex rounded-full bg-zinc-900/80 p-1.5 border border-zinc-800 shadow-xl backdrop-blur-sm">
          {[
            { id: 'all', label: 'Everything', icon: Blocks },
            { id: 'skill', label: 'AI Skills', icon: Sparkles },
            { id: 'prompt', label: 'Prompts', icon: FolderOpen }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setItemType(type.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
                itemType === type.id 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <type.icon className="h-4 w-4" /> {type.label}
            </button>
          ))}
        </div>

        {/* Audience Segmented Pill Bar */}
        <div className="inline-flex rounded-full bg-zinc-900/50 p-1 border border-zinc-800/50">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'student', label: 'For Students' },
            { id: 'professional', label: 'For Professionals' }
          ].map(aud => (
            <button
              key={aud.id}
              onClick={() => setAudience(aud.id)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                audience === aud.id 
                  ? "bg-zinc-800 text-zinc-100" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {aud.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-start">
        {/* Sidebar */}
        <aside className="sticky top-24 hidden lg:block space-y-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Domains
            </h3>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                    activeCategory === cat.id
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Grid */}
        <main className="min-w-0">
          {/* Mobile Search/Filter */}
          <div className="lg:hidden mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search skills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-[340px] rounded-xl bg-zinc-800/50 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/20 py-24 px-6 text-center">
              <div className="rounded-full bg-zinc-800 p-4 mb-4">
                <Search className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-200 mb-2">No results found</h3>
              <p className="text-zinc-500">Try adjusting your filters or search query to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </main>
      </div>
    </div>
  );
}
