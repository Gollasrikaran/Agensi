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
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <p style={{ color: 'var(--mute)', fontSize: '16px' }}>No skills ranked yet.</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
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
