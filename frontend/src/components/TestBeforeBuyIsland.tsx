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
    <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-xl)', background: 'var(--canvas-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--ink)' }}>Test Before You Buy</h3>
      <p style={{ color: 'var(--body)', fontSize: '14px', marginBottom: 'var(--space-md)' }}>
        Try out this skill to ensure it meets your needs. Testing consumes <strong>{creditCost} Bodhic Credits</strong> per interaction based on its Level {complexityLevel} complexity rating.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <a href={`/chat/${skillId}`} target="_blank" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', textDecoration: 'none' }}>
          Test with Bodhic LLM Web Chat
        </a>
        <McpTestIsland skillId={skillId} />
      </div>
    </div>
  );
}
