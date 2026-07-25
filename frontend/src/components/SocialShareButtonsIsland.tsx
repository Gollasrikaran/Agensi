import React from 'react';
import { showToast } from '../lib/toast';

interface SocialShareProps {
  url: string;
  title?: string;
  text?: string;
  compact?: boolean;
  label?: string;
}

export default function SocialShareButtonsIsland({ 
  url, 
  title = "Bodhic AI — Action-Agent Marketplace", 
  text = "Check out this AI agent skill on Bodhic AI!", 
  compact = false,
  label
}: SocialShareProps) {
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(url);
    showToast('🎉 Link copied to clipboard!', 'success');
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  const buttons = [
    { name: 'WhatsApp', icon: '💬', url: whatsappUrl, bg: '#25D366', color: '#fff' },
    { name: 'LinkedIn', icon: '💼', url: linkedinUrl, bg: '#0a66c2', color: '#fff' },
    { name: 'Reddit', icon: '🤖', url: redditUrl, bg: '#ff4500', color: '#fff' },
    { name: 'X / Twitter', icon: '𝕏', url: twitterUrl, bg: '#14171a', color: '#fff' },
    { name: 'Telegram', icon: '✈️', url: telegramUrl, bg: '#0088cc', color: '#fff' },
  ];

  if (compact) {
    return (
      <div 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {label && <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600, marginRight: '2px' }}>{label}:</span>}
        {buttons.map((btn) => (
          <a
            key={btn.name}
            href={btn.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${btn.name}`}
            className="btn btn-sm"
            style={{
              background: btn.bg,
              color: btn.color,
              border: 'none',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '28px',
              height: '26px'
            }}
          >
            <span style={{ fontSize: '13px' }}>{btn.icon}</span>
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Link"
          className="btn btn-sm"
          style={{
            background: 'var(--canvas-soft-2, #333)',
            color: 'var(--ink)',
            border: '1px solid var(--hairline)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '26px',
            cursor: 'pointer'
          }}
        >
          <span>📋</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        {buttons.map((btn) => (
          <a
            key={btn.name}
            href={btn.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              background: btn.bg,
              color: btn.color,
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: `0 2px 8px ${btn.bg}44`,
              transition: 'transform 0.15s, opacity 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>{btn.icon}</span> {btn.name}
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="btn btn-secondary"
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer'
        }}
      >
        <span>📋</span> Copy Referral Link ({url})
      </button>
    </div>
  );
}
