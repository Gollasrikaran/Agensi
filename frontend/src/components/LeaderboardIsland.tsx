import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SkillCard from './SkillCard';

export default function LeaderboardIsland() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());
  const [upvoteStates, setUpvoteStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
        checkUpvoteStates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        console.error(e);
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
        setSkills(prev => prev.map(s => s.id === skillId ? {...s, upvotes: data.upvotes} : s).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)));
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

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <p style={{ color: 'var(--mute)' }}>Loading leaderboard...</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center backdrop-blur-sm max-w-2xl mx-auto">
          <svg className="mx-auto h-16 w-16 text-indigo-500/50 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-2xl font-bold text-zinc-100 mb-3">Opening Soon</h3>
          <p className="text-zinc-400 text-lg mb-8">The leaderboard is currently empty. Start voting on skills to see them ranked here, or upload your own to compete for the Creator Fund!</p>
          <a href="/browse" className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
            Browse Skills to Vote
          </a>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {skills.map((skill: any, index: number) => {
            return (
              <SkillCard
                key={skill.id}
                skill={skill}
                isUpvoted={upvoteStates[skill.id] || false}
                isUpvoting={upvotingIds.has(skill.id)}
                onUpvote={handleUpvote}
                showRank={index + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
