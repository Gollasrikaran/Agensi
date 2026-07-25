import React, { useEffect, useState } from 'react';
import { getReferralId, getShareableUrl } from '../lib/referral';
import { showToast } from '../lib/toast';

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

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('🎉 Referral link copied to clipboard!', 'success');
  };

  const whatsappText = `Hey! I'm using Bodhic AI — an incredible action-agent marketplace where AI agents directly edit code, run local commands, and automate your workflows. Use my unique invite code (${refId}) to unlock bonus credits: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="card" style={{ 
      padding: 'var(--space-xl)', 
      background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(108, 60, 225, 0.15))', 
      border: '1px solid rgba(37, 211, 102, 0.3)', 
      borderRadius: '16px', 
      marginBottom: 'var(--space-xl)',
      color: 'var(--ink)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 211, 102, 0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <span>🚀</span> INSTANT WHATSAPP REFERRAL
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
            Refer Friends & Earn Free AI Credits!
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
            Share your unique referral code <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', background: 'var(--canvas-soft)', padding: '2px 6px', borderRadius: '4px' }}>{refId}</strong> via WhatsApp. When someone visits and signs up using your link, both you and your friend get <strong style={{ color: '#10b981' }}>50 Bonus Bodhic Credits</strong>!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn" 
            style={{ 
              background: '#25D366', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 16px', 
              borderRadius: '10px', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
              transition: 'transform 0.2s'
            }}
          >
            <span>💬</span> Share via WhatsApp
          </a>
          <button 
            type="button" 
            onClick={handleCopy} 
            className="btn btn-secondary" 
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <span>📋</span> Copy Link ({refId})
          </button>
        </div>
      </div>
    </div>
  );
}
