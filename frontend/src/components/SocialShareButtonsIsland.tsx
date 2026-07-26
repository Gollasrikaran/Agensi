import React from 'react';
import { showToast } from '../lib/toast';

interface SocialShareProps {
  url: string;
  title?: string;
  text?: string;
  compact?: boolean;
  label?: string;
}

const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.75a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z"/>
  </svg>
);

const RedditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.495.148l-2.597-.581-.975 4.595a6.669 6.669 0 0 1 3.515.998c.356-.51.95-.836 1.625-.836.995 0 1.802.808 1.802 1.803 0 .765-.483 1.421-1.166 1.691.012.16.02.321.02.484 0 3.233-3.805 5.856-8.502 5.856-4.697 0-8.502-2.623-8.502-5.856 0-.163.008-.324.02-.484-.683-.27-1.166-.926-1.166-1.691 0-.995.807-1.803 1.802-1.803.675 0 1.269.326 1.625.836a6.668 6.668 0 0 1 3.515-.998l1.096-5.161c.018-.088.083-.158.17-.176l3.036-.68c.036-.345.326-.615.68-.615zm-7.973 9.467c-.896 0-1.624.729-1.624 1.625 0 .896.728 1.624 1.624 1.624.896 0 1.625-.728 1.625-1.624 0-.896-.729-1.625-1.625-1.625zm9.926 0c-.896 0-1.624.729-1.624 1.625 0 .896.728 1.624 1.624 1.624.896 0 1.625-.728 1.625-1.624 0-.896-.729-1.625-1.625-1.625zm-4.963 3.667c-1.396 0-2.584.783-3.13 1.932a.152.152 0 1 0 .276.13c.46-.975 1.503-1.662 2.854-1.662 1.35 0 2.394.687 2.854 1.662a.152.152 0 1 0 .276-.13c-.546-1.149-1.734-1.932-3.13-1.932z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

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
    { name: 'WhatsApp', icon: <WhatsAppIcon />, url: whatsappUrl, bg: '#25D366', color: '#fff' },
    { name: 'LinkedIn', icon: <LinkedInIcon />, url: linkedinUrl, bg: '#0a66c2', color: '#fff' },
    { name: 'Reddit', icon: <RedditIcon />, url: redditUrl, bg: '#ff4500', color: '#fff' },
    { name: 'X / Twitter', icon: <TwitterIcon />, url: twitterUrl, bg: '#14171a', color: '#fff' },
    { name: 'Telegram', icon: <TelegramIcon />, url: telegramUrl, bg: '#0088cc', color: '#fff' },
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
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{btn.icon}</span>
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
          <span style={{ display: 'inline-flex', alignItems: 'center' }}><CopyIcon /></span>
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
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{btn.icon}</span> {btn.name}
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
        <span style={{ display: 'inline-flex', alignItems: 'center' }}><CopyIcon /></span> Copy Referral Link ({url})
      </button>
    </div>
  );
}
