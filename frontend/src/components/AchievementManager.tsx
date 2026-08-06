import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/config';
import { supabase } from '../lib/supabase';

export default function AchievementManager() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_BASE}/api/users/me/achievements`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setAchievements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = async (id: string, currentPublic: boolean, is_admin_awarded: boolean) => {
    if (is_admin_awarded) {
      alert("Admin-awarded trust badges are permanently public and cannot be hidden.");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/api/users/me/achievements/${id}/privacy`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_public: !currentPublic })
      });
      fetchAchievements(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-zinc-300">Loading achievements...</div>;

  return (
    <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden mt-16">
      <h2 className="text-zinc-100 mb-2">Your Achievements</h2>
      <p className="text-zinc-400 mb-8">
        Manage which achievements are visible on your public profile.
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
        {achievements.map(ach => (
          <div 
            key={ach.id} 
            className={`p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col ${ach.is_unlocked ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{ach.icon_url}</span>
              <h3 className="text-zinc-100 text-base m-0">{ach.title}</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4 flex-grow">
              {ach.description}
            </p>
            
            {ach.is_unlocked ? (
              <div className="flex justify-between items-center border-t border-zinc-800/50 pt-3">
                <span className="text-xs text-zinc-400">
                  Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}
                </span>
                
                <button 
                  onClick={() => togglePrivacy(ach.id, ach.is_public, ach.is_admin_awarded)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${ach.is_public ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg hover:-translate-y-0.5' : 'border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'} ${ach.is_admin_awarded ? 'opacity-50' : 'opacity-100'}`}
                >
                  {ach.is_admin_awarded ? 'Public Only' : (ach.is_public ? 'Public' : 'Private')}
                </button>
              </div>
            ) : (
              <div className="border-t border-zinc-800/50 pt-3 text-xs text-zinc-400 text-center">
                Locked
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
