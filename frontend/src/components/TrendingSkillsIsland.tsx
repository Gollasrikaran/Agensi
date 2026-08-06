import React, { useEffect, useState } from 'react';
import SkillCard from './SkillCard';
import Marquee from './ui/marquee';
import { supabase } from '../lib/supabase';

export default function TrendingSkillsIsland() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoteStates, setUpvoteStates] = useState<Record<string, boolean>>({});
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTrendingSkills();
  }, []);

  const fetchTrendingSkills = () => {
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 8);
        setSkills(sorted);
        setLoading(false);
        checkUpvoteStates(sorted);
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

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden py-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-[340px] w-[320px] shrink-0 animate-pulse rounded-xl bg-zinc-900/50" />
        ))}
      </div>
    );
  }

  if (skills.length === 0) {
    return <p className="text-zinc-500">No skills available right now.</p>;
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
      <Marquee pauseOnHover className="[--duration:50s]">
        {skills.map((skill: any, index: number) => (
          <div key={skill.id} className="w-[300px] sm:w-[320px]">
            <SkillCard 
              skill={skill}
              isUpvoted={upvoteStates[skill.id]}
              isUpvoting={upvotingIds.has(skill.id)}
              onUpvote={handleUpvote}
              showRank={index < 3 ? index + 1 : null}
            />
          </div>
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/12 bg-gradient-to-r from-background dark:from-zinc-950"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/12 bg-gradient-to-l from-background dark:from-zinc-950"></div>
    </div>
  );
}
