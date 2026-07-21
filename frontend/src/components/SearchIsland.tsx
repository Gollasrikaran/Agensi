import React, { useEffect, useState } from 'react';
import SkillCard from './SkillCard';

export default function SearchIsland() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Extract query param from URL
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setQuery(q);

    // Update the subtitle text in the parent astro file
    const subtitleElement = document.getElementById('search-subtitle');
    if (subtitleElement) {
      subtitleElement.textContent = q ? `Results for "${q}"` : 'Please enter a search query';
    }

    if (!q) {
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => {
        setSkills(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Searching...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Empty Query</h3>
        <p style={{ color: 'var(--text-muted)' }}>Enter a search term in the navbar to find skills.</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No skills found</h3>
        <p style={{ color: 'var(--text-muted)' }}>We couldn't find any skills matching "{query}". Try different keywords.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: '24px' 
    }}>
      {skills.map((skill: any) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
