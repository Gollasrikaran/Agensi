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
          <div key={skill.id} className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden h-full">
            
            {skill.media_url && (
              <div className="w-full h-40 relative bg-zinc-950">
                {skill.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video 
                    src={skill.media_url} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={skill.media_url} 
                    alt={skill.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            )}

            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-xl mb-2 text-zinc-100 font-semibold">{skill.title}</h3>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                {skill.description.length > 120 ? skill.description.substring(0, 120) + '...' : skill.description}
              </p>
              
              <a href={`/profile/${(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles))?.username}`} className="flex items-center gap-3 mt-auto pt-6 border-t border-zinc-800/50 hover:opacity-80 transition-opacity no-underline">
                {(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles))?.avatar_url ? (
                  <img 
                    src={(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles)).avatar_url} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm">
                    ?
                  </div>
                )}
                <span className="text-sm text-zinc-100 font-medium group-hover:text-indigo-400 transition-colors">
                  @{(Array.isArray(skill.seller || (skill as any).profiles) ? (skill.seller || (skill as any).profiles)[0] : (skill.seller || (skill as any).profiles))?.username || 'Anonymous'}
                </span>
              </a>
            </div>

            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/50 flex justify-between items-center">
              <div className="font-semibold text-lg text-indigo-400">
                ₹{skill.base_price_inr}
              </div>
              <div className="flex gap-2 items-center">
                <SocialShareButtonsIsland 
                  url={`${origin}/skill/${skill.id}?ref=${refId}`}
                  title={skill.title}
                  text={audience === 'student' || skill.target_audience === 'student' ? `Bro, stop wasting hours on assignments... check out "${skill.title}"!` : `Hey, found this clean FastMCP marketplace for automating local dev workflows... check out "${skill.title}"!`}
                  compact={true}
                  label="Share"
                />
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
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
