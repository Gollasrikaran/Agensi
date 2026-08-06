import React from 'react';
import SkillCard from './SkillCard';

export default function PinnedSkillsGrid({ skills }: { skills: any[] }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="text-center p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
        <p className="text-zinc-400">This creator hasn't pinned any skills yet.</p>
      </div>
    );
  }

  // Find the skill with the most downloads for the "Most Popular" ribbon
  const mostPopularSkillId = skills.reduce((prev, current) => 
    (current.purchase_count > prev.purchase_count) ? current : prev
  , skills[0])?.id;

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">
        Pinned Skills
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className="relative">
            {skill.id === mostPopularSkillId && skill.purchase_count > 0 && (
              <div className="absolute -top-3 right-5 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/40 z-10">
                Most Popular
              </div>
            )}
            <SkillCard skill={skill} />
          </div>
        ))}
      </div>
    </div>
  );
}
