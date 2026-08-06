import React, { useState, useEffect } from 'react';
import SkillPulseGraph from './SkillPulseGraph';

export default function PulseComparisonIsland({ currentUser, targetUser }: { currentUser: string, targetUser: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app we'd call /api/pulse/compare/{currentUser}/{targetUser}
    // Mocking the stats for now
    setTimeout(() => {
      setStats({
        currentUser: {
          skillsPublished: 8,
          totalSales: 42,
          avgRating: 4.2,
          currentStreak: 14,
          longestStreak: 21,
          rank: 45
        },
        targetUser: {
          skillsPublished: 23,
          totalSales: 187,
          avgRating: 4.7,
          currentStreak: 42,
          longestStreak: 89,
          rank: 3
        }
      });
      setLoading(false);
    }, 1000);
  }, [currentUser, targetUser]);

  if (loading) return <div className="text-zinc-500 p-6 text-center">Loading comparison...</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <h2 className="mt-0 mb-6 text-xl font-bold text-zinc-100">Compare Pulses</h2>
      
      <div className="flex gap-6 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-base font-bold text-indigo-400 mb-4">@{currentUser} (You)</h3>
          <SkillPulseGraph username={currentUser} />
        </div>
        
        <div className="flex items-center justify-center">
          <div className="bg-zinc-950 p-3 rounded-full font-bold text-zinc-400 border border-zinc-800 shadow-inner">VS</div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <h3 className="text-base font-bold text-amber-500 mb-4">@{targetUser}</h3>
          <SkillPulseGraph username={targetUser} />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Head-to-Head Stats</h3>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Metric</th>
                <th className="px-6 py-4">You</th>
                <th className="px-6 py-4">@{targetUser}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-300 font-medium">Skills Published</td>
                <td className="px-6 py-4 text-zinc-100">{stats.currentUser.skillsPublished}</td>
                <td className="px-6 py-4 text-zinc-100 font-bold">{stats.targetUser.skillsPublished}</td>
              </tr>
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-300 font-medium">Total Sales</td>
                <td className="px-6 py-4 text-zinc-100">{stats.currentUser.totalSales}</td>
                <td className="px-6 py-4 text-zinc-100 font-bold">{stats.targetUser.totalSales}</td>
              </tr>
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-300 font-medium">Avg Rating</td>
                <td className="px-6 py-4 text-zinc-100">{stats.currentUser.avgRating} ★</td>
                <td className="px-6 py-4 text-zinc-100 font-bold">{stats.targetUser.avgRating} ★</td>
              </tr>
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-300 font-medium">Current Streak</td>
                <td className="px-6 py-4 text-zinc-100">{stats.currentUser.currentStreak} days</td>
                <td className="px-6 py-4 text-zinc-100 font-bold">{stats.targetUser.currentStreak} days</td>
              </tr>
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-300 font-medium">Longest Streak</td>
                <td className="px-6 py-4 text-zinc-100">{stats.currentUser.longestStreak} days</td>
                <td className="px-6 py-4 text-zinc-100 font-bold">{stats.targetUser.longestStreak} days</td>
              </tr>
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-300 font-medium">Rank (This Month)</td>
                <td className="px-6 py-4 text-zinc-100">#{stats.currentUser.rank}</td>
                <td className="px-6 py-4 text-zinc-100 font-bold text-indigo-400">#{stats.targetUser.rank}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
