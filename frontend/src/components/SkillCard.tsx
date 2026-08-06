import React, { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, Download, UserCircle2, FolderArchive } from 'lucide-react';
import { getReferralId } from '../lib/referral';
import SocialShareButtonsIsland from './SocialShareButtonsIsland';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface SkillCardProps {
  skill: any;
  isUpvoted?: boolean;
  isUpvoting?: boolean;
  onUpvote?: (e: React.MouseEvent, skillId: string) => void;
  showRank?: number | null;
}

const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    'frontend': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    'testing': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    'devops': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'docs': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'productivity': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'data': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'api': 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    'ai': 'text-purple-400 bg-purple-400/10 border-purple-400/20'
  };
  return map[category?.toLowerCase()] || 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
};

export default function SkillCard({ skill, isUpvoted = false, isUpvoting = false, onUpvote, showRank = null }: SkillCardProps) {
  const [refId, setRefId] = useState('REF-BODHIC');
  useEffect(() => {
    getReferralId().then(setRefId);
  }, []);

  const catStyles = getCategoryColor(skill.category);
  const isFree = skill.base_price_inr === 0 || skill.is_free;
  
  return (
    <Card 
      onClick={() => window.location.href = `/skill/${skill.id}`}
      className="group relative flex h-full min-h-[340px] cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:bg-indigo-900/40 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/20"
    >
      {/* 16:9 Thumbnail Header */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-white/5 bg-zinc-900/50">
        {skill.media_url ? (
          skill.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
            <video 
              src={skill.media_url} 
              autoPlay muted loop playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img 
              src={skill.media_url} 
              alt={skill.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { 
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('[data-fallback]') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
            />
          )
        ) : null}
        
        {/* Category pills shown when no media OR as fallback */}
        <div 
          data-fallback
          className={cn(
            "z-10 flex flex-wrap justify-center gap-2 px-4",
            skill.media_url ? "hidden" : "flex"
          )}
        >
          {((skill.category || 'AI').split(',').map((c: string) => c.trim()).filter(Boolean)).map((cat: string, index: number) => (
            <span 
              key={index}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase backdrop-blur-md",
                catStyles
              )}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Rank Badge */}
        {showRank && (
          <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 text-xs font-bold text-zinc-100 backdrop-blur-md">
            #{showRank}
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-1 text-lg font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
          {skill.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {skill.description}
        </p>

        {skill.item_type === 'agent-tool' && (
          <div className="mb-4 flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 w-fit px-2 py-1 rounded-md border border-indigo-500/20">
            <FolderArchive size={14} />
            {skill.total_files || 0} Files
          </div>
        )}

        {/* Creator Info */}
        {(() => {
          const profile = skill.seller || (Array.isArray(skill.profiles) ? skill.profiles[0] : skill.profiles);
          return (
            <a 
              href={`/profile/${profile?.username}`} 
              onClick={(e) => e.stopPropagation()}
              className="mt-auto flex items-center gap-2 border-t border-white/5 pt-4 hover:opacity-80 transition-opacity no-underline w-fit relative z-10"
            >
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-5 w-5 text-zinc-500" />
                )}
              </div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-indigo-200 transition-colors">
                @{profile?.username || 'Anonymous'}
                {/* Verified badge placeholder */}
                {profile?.is_verified && <span className="ml-1 text-indigo-400">✓</span>}
              </span>
            </a>
          );
        })()}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-white/5 bg-zinc-950/30 group-hover:bg-transparent transition-colors duration-300 p-4">
        {isFree ? (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
            Free
          </Badge>
        ) : (
          <Badge className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20">
            ₹{skill.base_price_inr}
          </Badge>
        )}
        
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Download size={14} />
            {skill.downloads || 0}
          </span>
          <button 
            onClick={(e) => onUpvote && onUpvote(e, skill.id)}
            disabled={isUpvoting}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 transition-colors",
              isUpvoted ? "bg-pink-500/10 text-pink-500" : "hover:bg-zinc-800 hover:text-zinc-300",
              isUpvoting && "opacity-50 cursor-not-allowed"
            )}
          >
            <TrendingUp size={14} />
            {skill.upvotes || 0}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
