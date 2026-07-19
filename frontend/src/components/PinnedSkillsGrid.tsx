import React from 'react';
import SkillCard from './SkillCard';

export default function PinnedSkillsGrid({ skills }: { skills: any[] }) {
  if (!skills || skills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--mute)' }}>This creator hasn't pinned any skills yet.</p>
      </div>
    );
  }

  // Find the skill with the most downloads for the "Most Popular" ribbon
  const mostPopularSkillId = skills.reduce((prev, current) => 
    (current.purchase_count > prev.purchase_count) ? current : prev
  , skills[0])?.id;

  return (
    <div>
      <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-lg)', color: 'var(--ink)' }}>
        Pinned Skills
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 'var(--space-xl)' 
      }}>
        {skills.map((skill) => (
          <div key={skill.id} style={{ position: 'relative' }}>
            {skill.id === mostPopularSkillId && skill.purchase_count > 0 && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '20px',
                background: 'linear-gradient(90deg, #6C3CE1, #a78bfa)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(108,60,225,0.4)',
                zIndex: 10
              }}>
                🔥 Most Popular
              </div>
            )}
            <SkillCard skill={skill} />
          </div>
        ))}
      </div>
    </div>
  );
}
