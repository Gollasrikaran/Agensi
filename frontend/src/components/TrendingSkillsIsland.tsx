import React, { useEffect, useState, useRef } from 'react';
import SkillCard from './SkillCard';
import { supabase } from '../lib/supabase';

export default function TrendingSkillsIsland() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoteStates, setUpvoteStates] = useState<Record<string, boolean>>({});
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrendingSkills();
  }, []);

  const fetchTrendingSkills = () => {
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/skills`)
      .then(res => res.json())
      .then(data => {
        // Sort by upvotes (descending) and take top 8
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

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 320; // card width + gap
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-lg)', overflowX: 'hidden', padding: '10px 0' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ minWidth: '300px', height: '280px', background: 'var(--canvas-soft-2)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  if (skills.length === 0) {
    return <p style={{ color: 'var(--mute)' }}>No skills available right now.</p>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Navigation Controls */}
      <div style={{ position: 'absolute', top: '-60px', right: '160px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => scroll('left')}
          className="btn"
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', background: 'var(--canvas-soft)', border: '1px solid var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Scroll left"
        >
          ←
        </button>
        <button 
          onClick={() => scroll('right')}
          className="btn"
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', background: 'var(--canvas-soft)', border: '1px solid var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Scroll right"
        >
          →
        </button>
      </div>

      {/* CSS Snap Carousel */}
      <div 
        ref={carouselRef}
        style={{ 
          display: 'flex', 
          gap: 'var(--space-lg)', 
          overflowX: 'auto', 
          scrollSnapType: 'x mandatory',
          paddingBottom: '20px',
          paddingTop: '10px',
          scrollbarWidth: 'none', // hide scrollbar Firefox
          msOverflowStyle: 'none', // hide scrollbar IE/Edge
        }}
        className="hide-scrollbar"
      >
        {skills.map((skill: any, index: number) => (
          <div key={skill.id} style={{ scrollSnapAlign: 'start', flex: '0 0 auto', width: '320px' }}>
            <SkillCard 
              skill={skill}
              isUpvoted={upvoteStates[skill.id]}
              isUpvoting={upvotingIds.has(skill.id)}
              onUpvote={handleUpvote}
              showRank={index < 3 ? index + 1 : null}
            />
          </div>
        ))}
      </div>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
}
