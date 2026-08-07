import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, TrendingUp, Star } from 'lucide-react';
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
  downloads?: number;
  upvotes?: number;
  average_rating?: number;
  category?: string;
  target_audience?: string;
}


const CATEGORIES = [
  { id: 'all', label: 'All Domains' },
  { id: 'development', label: 'Development' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'design', label: 'Design' },
  { id: 'business', label: 'Business' },
  { id: 'data', label: 'Data Science' }
];

export default function BrowseMarketplaceIsland() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [itemType, setItemType] = useState<string>('all');
  const [refId, setRefId] = useState('REF-BODHIC');

  useEffect(() => {
    getReferralId().then(setRefId);
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bodhicai.onrender.com';

  useEffect(() => {
    setLoading(true);
    const apiBase = import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000';
    fetch(`${apiBase}/api/public/skills?audience=${audience}&item_type=${itemType}&category=${activeCategory}&q=${searchQuery}`)
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
      <div className="flex gap-2 mb-6 justify-center bg-zinc-900/50 p-1.5 rounded-full w-fit mx-auto border border-zinc-800 shadow-sm flex-wrap">
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${itemType === 'all' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setItemType('all')}
        >
          Everything
        </button>
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${itemType === 'skill' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setItemType('skill')}
        >
          AI Skills
        </button>
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${itemType === 'agent-tool' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setItemType('agent-tool')}
        >
          Agent Tools (MCP)
        </button>
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${itemType === 'prompt' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setItemType('prompt')}
        >
          Prompts
        </button>
      </div>

      <div className="flex gap-2 mb-16 justify-center bg-zinc-900/50 p-1.5 rounded-full w-fit mx-auto border border-zinc-800 shadow-sm flex-wrap">
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${audience === 'all' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setAudience('all')}
        >
          All Audiences
        </button>
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${audience === 'student' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setAudience('student')}
        >
          For Students
        </button>
        <button 
          className={`rounded-full border-none px-5 py-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${audience === 'professional' ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'}`}
          onClick={() => setAudience('professional')}
        >
          For Professionals
        </button>
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
                  className={`w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0">
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
            <div className="text-center p-16 text-zinc-300">Loading marketplace...</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-8">
      {skills.length === 0 ? (
        <div className="col-span-full text-center text-zinc-400">
          No skills available in the marketplace yet.
        </div>
      ) : (
        skills.map(skill => (
          <a href={`/skill/${skill.id}`} key={skill.id} className="group flex flex-col rounded-[20px] border border-zinc-800/60 bg-[#0c0c0e] hover:bg-[#111114] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 relative overflow-hidden h-full no-underline block text-inherit cursor-pointer">
            
            {/* TOP HALF - Image or Dark gradient + Categories */}
            <div className="relative w-full h-40 bg-gradient-to-b from-zinc-900/50 to-transparent flex-shrink-0 border-b border-zinc-800/30 flex items-center justify-center p-4 overflow-hidden">
              {skill.media_url ? (
                skill.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={skill.media_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:opacity-40 transition-opacity" />
                ) : (
                  <img src={skill.media_url} alt={skill.title} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:opacity-40 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-900/5 to-transparent opacity-50"></div>
              )}
              
              {/* Category Pills Overlay */}
              <div className="relative z-10 flex flex-wrap gap-2 justify-center">
                {(skill.category ? [skill.category] : ['EDUCATION', 'DEVELOPMENT']).map(cat => (
                  <span key={cat} className="rounded-full bg-zinc-900/90 px-3 py-1 text-[10px] font-bold text-zinc-400 border border-zinc-800/80 backdrop-blur-md uppercase tracking-widest">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* CONTENT HALF */}
            <div className="flex-grow flex flex-col p-6">
              <h3 className="text-[17px] mb-2 text-zinc-100 font-semibold leading-snug group-hover:text-indigo-300 transition-colors">{skill.title}</h3>
              <p className="text-zinc-400 text-[13px] leading-relaxed mb-6 flex-grow line-clamp-3">
                {skill.description}
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                {(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles))?.avatar_url ? (
                  <img 
                    src={(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles)).avatar_url} 
                    alt="avatar" 
                    className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-medium">
                    ?
                  </div>
                )}
                <span className="text-xs text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors">
                  @{(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles))?.username || 'Anonymous'}
                </span>
              </div>
            </div>

            {/* FOOTER SECTION */}
            <div className="px-6 py-4 bg-[#0a0a0c] flex justify-between items-center border-t border-zinc-800/40">
              <div className="font-semibold text-sm">
                {(skill.base_price_inr || 0) === 0 ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                    Free
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-indigo-400 border border-zinc-800">
                    ₹{skill.base_price_inr}
                  </span>
                )}
              </div>
              <div className="flex gap-4 items-center text-zinc-500 text-xs font-medium">
                <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors" title="Downloads">
                  <Download size={14} className="opacity-70" /> {skill.downloads || 0}
                </div>
                <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors" title="Upvotes">
                  <TrendingUp size={14} className="opacity-70" /> {skill.upvotes || 0}
                </div>
                {skill.average_rating ? (
                  <div className="flex items-center gap-1.5 text-amber-500/80 hover:text-amber-400 transition-colors" title="Rating">
                    <Star size={14} className="opacity-90 fill-current" /> {skill.average_rating}
                  </div>
                ) : null}
              </div>
            </div>
          </a>
        ))
      )}
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
