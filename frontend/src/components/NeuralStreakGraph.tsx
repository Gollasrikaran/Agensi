import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/config';

interface Props {
  username: string;
}

export default function NeuralStreakGraph({ username }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/users/${username}/activity`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [username]);

  if (loading || !data) return null;

  // Process activity into a map of YYYY-MM-DD -> count
  const activityMap: Record<string, number> = {};
  data.activity.forEach((act: any) => {
    const dateStr = new Date(act.created_at).toISOString().split('T')[0];
    activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
  });

  // Generate last 90 days grid
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: activityMap[dateStr] || 0
    });
  }

  const { streaks } = data;

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl m-0 text-zinc-100 font-bold">Neural Pulse</h2>
        <div className="flex gap-8 text-right">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Current Streak</div>
            <div className="text-2xl font-bold text-zinc-100">{streaks.current_streak} <span className="text-base font-normal">days</span></div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Longest</div>
            <div className="text-2xl font-bold text-zinc-100">{streaks.longest_streak} <span className="text-base font-normal">days</span></div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-2">
        {/* The Graph */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(12px,1fr))] gap-1 items-end h-[60px]">
          {days.map((day, idx) => {
            const height = day.count === 0 ? '4px' : `${Math.min(100, Math.max(20, day.count * 20))}%`;
            const opacity = day.count === 0 ? 0.1 : Math.min(1, 0.4 + (day.count * 0.2));
            const isToday = idx === days.length - 1;
            
            return (
              <div 
                key={day.date}
                title={`${day.date}: ${day.count} activities`}
                className={`rounded-sm rounded-t-md transition-all duration-300 ease-in-out ${isToday && day.count > 0 ? 'border-b-2 border-amber-500' : ''}`}
                style={{
                  height,
                  background: day.count > 0 ? 'linear-gradient(0deg, #4f46e5, #818cf8)' : '#27272a',
                  opacity
                }}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
          <span>90 Days Ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
