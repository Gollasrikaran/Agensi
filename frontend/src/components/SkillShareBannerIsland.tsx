import React, { useEffect, useState } from 'react';
import { getReferralId } from '../lib/referral';
import SocialShareButtonsIsland from './SocialShareButtonsIsland';

interface SkillShareProps {
  skillId: string;
  skillTitle: string;
}

export default function SkillShareBannerIsland({ skillId, skillTitle }: SkillShareProps) {
  const [refId, setRefId] = useState('REF-BODHIC');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    getReferralId().then(id => {
      setRefId(id);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bodhicai.onrender.com';
      setShareUrl(`${origin}/skill/${skillId}?ref=${id}`);
    });
  }, [skillId]);

  const shareText = `Check out "${skillTitle}" on Bodhic AI — an action-agent marketplace where AI agents directly edit code, run local commands, and automate your dev workflows!`;
  const shareTitle = `${skillTitle} — Bodhic AI Agent Skill`;

  return (
    <div className="card" style={{ 
      padding: 'var(--space-lg)', 
      background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(10, 102, 194, 0.08), rgba(108, 60, 225, 0.1))', 
      border: '1px solid rgba(108, 60, 225, 0.25)', 
      borderRadius: '16px', 
      marginBottom: 'var(--space-lg)',
      color: 'var(--ink)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(108, 60, 225, 0.15)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
              <span>🎁</span> INSTANT REFER & EARN
            </div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
              Share This Skill & Earn 50 Credits!
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--body)' }}>
              Share your invite link via WhatsApp, LinkedIn, Reddit, X (Twitter), or Telegram. When a friend signs up or buys, you both get 50 credits!
            </p>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--canvas-soft)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
            Code: <strong style={{ color: 'var(--primary)' }}>{refId}</strong>
          </div>
        </div>
        
        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--hairline)' }}>
          <SocialShareButtonsIsland 
            url={shareUrl || `https://bodhicai.onrender.com/skill/${skillId}`} 
            title={shareTitle} 
            text={shareText} 
            compact={false} 
          />
        </div>
      </div>
    </div>
  );
}
