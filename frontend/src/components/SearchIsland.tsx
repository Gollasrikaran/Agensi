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
      <div className="text-center p-16">
        <p className="text-zinc-400">Searching...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center p-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
        <h3 className="text-xl font-semibold mb-2 text-zinc-100">Empty Query</h3>
        <p className="text-zinc-400">Enter a search term in the navbar to find skills.</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center p-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2 text-zinc-100">No skills found</h3>
        <p className="text-zinc-400">We couldn't find any skills matching "{query}". Try different keywords.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
      {skills.map((skill: any) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
