import React from 'react';

export default function AchievementShowcase({ achievements }: { achievements: any[] }) {
  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl mb-8 text-zinc-100">
        Achievements
      </h2>
      <div className="flex flex-wrap gap-6">
        {achievements.map((ach) => (
          <div 
            key={ach.id} 
            title={`${ach.title} - ${ach.description} (Unlocked: ${new Date(ach.unlocked_at).toLocaleDateString()})`}
            className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-default transition-all duration-200 hover:-translate-y-0.5 ${ach.is_admin_awarded ? 'bg-amber-500/10 border border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 hover:shadow-lg hover:shadow-black/20'}`}
          >
            <span className="text-2xl">{ach.icon_url}</span>
            <span className="font-semibold text-zinc-100 text-sm">{ach.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
