import React, { useEffect, useState } from 'react';
import { getReferralId } from '../lib/referral';
import SocialShareButtonsIsland from './SocialShareButtonsIsland';

export default function ReferralShareCardIsland() {
  const [refId, setRefId] = useState('REF-LOADING');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    getReferralId().then(id => {
      setRefId(id);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bodhicai.onrender.com';
      setShareUrl(`${origin}/?ref=${id}`);
    });
  }, []);

  const shareText = `Hey! I'm using Bodhic AI — an incredible action-agent marketplace where AI agents directly edit code, run local commands, and automate your workflows. Use my unique invite code (${refId}) to unlock bonus credits!`;
  const shareTitle = `Bodhic AI — Action-Agent Marketplace (Invite: ${refId})`;

  return (
    <div className="card" style={{ 
      padding: 'var(--space-xl)', 
      background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(10, 102, 194, 0.1), rgba(108, 60, 225, 0.15))', 
      border: '1px solid rgba(108, 60, 225, 0.3)', 
      borderRadius: '16px', 
      marginBottom: 'var(--space-xl)',
      color: 'var(--ink)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(108, 60, 225, 0.2)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <span>🎁</span> MULTI-CHANNEL VIRAL REFERRAL
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
            Refer Friends & Earn Free AI Credits!
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            Share your unique referral code <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', background: 'var(--canvas-soft)', padding: '2px 6px', borderRadius: '4px' }}>{refId}</strong> via WhatsApp, LinkedIn, Reddit, X (Twitter), or Telegram. When someone visits and signs up using your link, both you and your friend get <strong style={{ color: '#10b981' }}>50 Bonus Bodhic Credits</strong>!
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--mute)' }}>
            <span>✨ Free instant sharing</span>
            <span>•</span>
            <span>⚡ Automated reward attribution</span>
          </div>
        </div>

        <div style={{ flex: '1 1 260px', minWidth: '240px' }}>
          <SocialShareButtonsIsland 
            url={shareUrl || 'https://bodhicai.onrender.com'} 
            title={shareTitle} 
            text={shareText} 
            compact={false} 
          />
        </div>
      </div>
    </div>
  );
}
