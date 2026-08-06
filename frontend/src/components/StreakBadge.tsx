import React from 'react';

export default function StreakBadge({ streak = 0 }: { streak: number }) {
  if (streak === 0) return null;

  const isHot = streak >= 30;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-bold rounded-full ${isHot ? 'bg-amber-500/15 border border-amber-500/40 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-zinc-800/50 border border-zinc-700 text-zinc-300'}`}>
      <span className={`text-base ${isHot ? 'animate-pulse' : ''}`}>
        🔥
      </span>
      {streak} Day Streak
    </div>
  );
}
