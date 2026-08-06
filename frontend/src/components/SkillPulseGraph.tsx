import React, { useState, useEffect } from 'react';
import { API_BASE } from '../lib/config';

type ActivityType = 'all' | 'upload' | 'sale' | 'purchase' | 'upvote' | 'bounty';

interface PulseData {
  date: string;
  intensity: number; // 0-4
  type: ActivityType;
  count: number;
  rawTypes?: Record<string, number>;
}

export default function SkillPulseGraph({ username }: { username: string }) {
  const [filter, setFilter] = useState<ActivityType>('all');
  const [pulseData, setPulseData] = useState<PulseData[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number, data: PulseData | null } | null>(null);

  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/api/public/users/${username}/activity`)
      .then(res => res.json())
      .then(data => {
        // Aggregate activity by date and type
        const activityMap: Record<string, { [key in ActivityType]?: number }> = {};
        if (data.activity) {
          data.activity.forEach((act: any) => {
            const date = new Date(act.created_at).toISOString().split('T')[0];
            const type = act.activity_type as ActivityType;
            if (!activityMap[date]) activityMap[date] = {};
            activityMap[date][type] = (activityMap[date][type] || 0) + 1;
            activityMap[date]['all'] = (activityMap[date]['all'] || 0) + 1;
          });
        }

        // Generate 364 days grid ending today
        const generatedData: PulseData[] = [];
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 364);

        for (let i = 0; i < 364; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayData = activityMap[dateStr] || {};
          
          generatedData.push({
            date: dateStr,
            intensity: dayData['all'] ? Math.min(dayData['all'], 4) : 0,
            type: 'all', // We store all in cell, filters handle visual later
            count: dayData['all'] || 0,
            rawTypes: dayData
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        setPulseData(generatedData);
        if (data.streaks) {
          setStreaks({ current: data.streaks.current_streak || 0, longest: data.streaks.longest_streak || 0 });
        }
      })
      .catch(err => console.error("Failed to fetch pulse activity", err));
  }, [username]);

  const getColorClassForType = (type: ActivityType, intensity: number) => {
    if (intensity === 0) return 'bg-zinc-800';
    
    const colors: Record<string, string> = {
      'upload': 'bg-emerald-500',
      'sale': 'bg-amber-500',
      'purchase': 'bg-amber-500',
      'upvote': 'bg-indigo-500',
      'bounty': 'bg-red-500',
      'all': 'bg-indigo-500'
    };
    
    return colors[type] || colors['all'];
  };
  
  const getBorderColorClassForType = (type: ActivityType) => {
    const colors: Record<string, string> = {
      'upload': 'border-emerald-500',
      'sale': 'border-amber-500',
      'purchase': 'border-amber-500',
      'upvote': 'border-indigo-500',
      'bounty': 'border-red-500',
      'all': 'border-indigo-500'
    };
    return colors[type] || colors['all'];
  };

  return (
    <div className="group flex flex-col p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 relative overflow-x-auto">
      
      {hoveredCell?.data && (
        <div style={{
          left: hoveredCell.x - 60,
          top: hoveredCell.y - 40,
        }} className="absolute bg-zinc-900 border border-indigo-500/20 px-3 py-1.5 rounded-md text-xs text-white z-10 shadow-lg whitespace-nowrap pointer-events-none">
          {hoveredCell.data.rawTypes?.[filter] || 0} {filter}s on {hoveredCell.data.date}
        </div>
      )}

      {/* Grid: 52 columns, 7 rows */}
      <div className="grid grid-flow-col gap-1 mb-5 min-w-max" style={{ gridTemplateColumns: 'repeat(52, 12px)', gridTemplateRows: 'repeat(7, 12px)' }}>
        {pulseData.map((cell, idx) => {
          const filterCount = cell.rawTypes?.[filter] || 0;
          const isVisible = filter === 'all' ? cell.count > 0 : filterCount > 0;
          
          let displayIntensity = 0;
          if (isVisible) {
             displayIntensity = Math.min(filterCount || cell.count, 4);
          }
          
          return (
            <div
              key={idx}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect = e.currentTarget.parentElement!.getBoundingClientRect();
                if (isVisible) {
                  setHoveredCell({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top,
                    data: cell
                  });
                }
              }}
              onMouseLeave={() => setHoveredCell(null)}
              className={`w-3 h-3 rounded-[3px] transition-transform duration-200 ${getColorClassForType(filter, displayIntensity)} ${displayIntensity > 0 ? 'cursor-pointer hover:scale-150' : 'cursor-default'} animate-[fadeIn_0.5s_ease-out_forwards]`}
              style={{
                opacity: displayIntensity === 0 ? 1 : (0.4 + displayIntensity * 0.15),
                animationDelay: `${(idx % 52) * 5}ms`
              }}
            />
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Footer Controls & Legend */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        
        <div className="flex gap-2">
          {(['all', 'upload', 'sale', 'purchase', 'upvote', 'bounty'] as ActivityType[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs cursor-pointer capitalize transition-all border ${
                filter === t 
                  ? `bg-zinc-800 text-white ${getBorderColorClassForType(t)}` 
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="text-right text-[13px]">
          <div className="text-zinc-400">Current Streak: <strong className="text-white">{streaks.current} days</strong></div>
          <div className="text-zinc-400">Longest Streak: <strong>{streaks.longest} days</strong></div>
        </div>

      </div>
    </div>
  );
}
