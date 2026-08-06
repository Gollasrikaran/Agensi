import React, { useState, useEffect } from 'react';
import AvatarBadge, { type AvatarTier } from './AvatarBadge';
import StreakBadge from './StreakBadge';
import SkillPulseGraph from './SkillPulseGraph';
import PulseComparisonIsland from './PulseComparisonIsland';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Share2, Activity, ShieldAlert, Award } from 'lucide-react';
import { cn } from '../lib/utils';

interface UserProfile {
  username: string;
  avatar_url: string;
  avatar_tier: AvatarTier;
  streak: number;
  pulse_score: number;
  total_skills: number;
  total_sales: number;
  is_verified: boolean;
  is_private: boolean;
  join_date: string;
}

export default function ProfileStatsHero({ profile }: { profile: UserProfile }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').select('username').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data?.username) setCurrentUser(data.username);
          });
      }
    });
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col gap-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-sm">
        
        {/* Top: Identity Row */}
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
          
          <div className="shrink-0">
            <AvatarBadge 
              url={profile.avatar_url || ''}
              tier={profile.avatar_tier}
              size={120} 
            />
          </div>
          
          <div className="flex-1 flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100 m-0">
                @{profile.username}
              </h1>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Creator
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
              <span>Joined {profile.join_date}</span>
              <span className="flex items-center gap-1"><strong className="text-zinc-200">{profile.total_skills}</strong> Skills</span>
              <span className="flex items-center gap-1"><strong className="text-zinc-200">{profile.total_sales}</strong> Sales</span>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-1">
              <StreakBadge streak={profile.streak} />
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs font-bold text-indigo-400">
                <Activity className="h-3.5 w-3.5" /> {profile.pulse_score} Pulse Score
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
            <button 
              onClick={handleShare}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700"
            >
              {copied ? <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Copied!</> : <><Share2 className="h-4 w-4" /> Share Profile</>}
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-800" />

        {/* Bottom: Activity Graph */}
        {profile.is_private ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <ShieldAlert className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">Skill pulse activity is private</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" /> Skill Pulse Activity
              </h3>
              {currentUser && currentUser !== profile.username && (
                <button 
                  onClick={() => setShowCompare(!showCompare)}
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showCompare ? 'Hide Comparison' : 'Compare with your Pulse →'}
                </button>
              )}
            </div>
            
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 sm:p-6">
              {showCompare && currentUser ? (
                <PulseComparisonIsland currentUser={currentUser} targetUser={profile.username} />
              ) : (
                <SkillPulseGraph username={profile.username} />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
