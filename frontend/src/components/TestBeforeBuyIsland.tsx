import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE } from '../lib/config';
import McpTestIsland from './McpTestIsland';

interface Props {
  skillId: string;
  sellerId: string;
  complexityLevel: number;
}

export default function TestBeforeBuyIsland({ skillId, sellerId, complexityLevel }: Props) {
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not logged in — show the test section (they'll be prompted to log in when they click)
        setHidden(false);
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Hide if user is the creator/seller
      if (userId === sellerId) {
        setHidden(true);
        setLoading(false);
        return;
      }

      // Hide if user has already purchased this skill
      const res = await fetch(`${API_BASE}/api/skills/${skillId}/purchase-status`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.purchased) {
          setHidden(true);
          setLoading(false);
          return;
        }
      }

      setHidden(false);
    } catch (e) {
      console.error('Failed to check purchase status', e);
      setHidden(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || hidden) return null;

  const costMap: Record<number, number> = {1: 10, 2: 20, 3: 40, 4: 70, 5: 100};
  const creditCost = costMap[complexityLevel] || (complexityLevel * 10);

  return (
    <div className="mt-8 p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <h3 className="text-lg font-semibold mb-1 text-zinc-100">Test Before You Buy</h3>
      <p className="text-zinc-300 text-sm mb-4">
        Try out this skill to ensure it meets your needs. Testing consumes <strong className="text-indigo-400">{creditCost} Bodhic Credits</strong> per interaction based on its Level {complexityLevel} complexity rating.
      </p>
      
      <div className="flex flex-col gap-2">
        <a href={`/chat/${skillId}`} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 w-full no-underline">
          Test with Bodhic LLM Web Chat
        </a>
        <McpTestIsland skillId={skillId} />
      </div>
    </div>
  );
}
