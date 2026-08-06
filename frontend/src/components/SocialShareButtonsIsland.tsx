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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="currentColor" />
    <path fill="#FF4500" d="M16.67 13.13c0-.49-.39-.89-.89-.89-.26 0-.5.11-.66.29-.92-.62-2.18-.99-3.57-1.03l.61-2.88 2 .43c.02.63.54 1.14 1.17 1.14.65 0 1.18-.53 1.18-1.18 0-.65-.53-1.18-1.18-1.18-.55 0-1.01.37-1.14.88l-2.22-.47c-.06-.01-.12.01-.16.06-.03.05-.04.11-.02.17l.69 3.23c-1.41.04-2.69.42-3.61 1.05-.16-.18-.4-.29-.66-.29-.49 0-.89.4-.89.89 0 .36.21.67.51.81-.03.21-.05.42-.05.64 0 2.14 2.49 3.88 5.55 3.88s5.55-1.74 5.55-3.88c0-.22-.02-.43-.05-.64.3-.14.51-.45.51-.81zM10.12 14.5c.46 0 .83.37.83.83 0 .46-.37.83-.83.83-.46 0-.83-.37-.83-.83 0-.46.37-.83.83-.83zm3.76 2.76c-.63.63-1.85.67-1.88.67s-1.25-.04-1.88-.67c-.12-.12-.12-.31 0-.43.12-.12.31-.12.43 0 .42.42 1.31.49 1.45.49.14 0 1.03-.07 1.45-.49.12-.12.31-.12.43 0 .12.12.12.31 0 .43zm-.13-1.93c-.46 0-.83-.37-.83-.83 0-.46.37-.83.83-.83.46 0 .83.37.83.83 0 .46-.37.83-.83.83z" />
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
  title = "BodhicAI — Action-Agent Marketplace", 
  text = "Check out this AI agent skill on BodhicAI!", 
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
    { name: 'WhatsApp', icon: <WhatsAppIcon />, url: whatsappUrl, bgClass: 'bg-[#25D366]', textClass: 'text-white' },
    { name: 'LinkedIn', icon: <LinkedInIcon />, url: linkedinUrl, bgClass: 'bg-[#0a66c2]', textClass: 'text-white' },
    { name: 'Reddit', icon: <RedditIcon />, url: redditUrl, bgClass: 'bg-[#FF4500]', textClass: 'text-white' },
    { name: 'X / Twitter', icon: <TwitterIcon />, url: twitterUrl, bgClass: 'bg-[#14171a]', textClass: 'text-white' },
    { name: 'Telegram', icon: <TelegramIcon />, url: telegramUrl, bgClass: 'bg-[#0088cc]', textClass: 'text-white' },
  ];

  if (compact) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {label && <span className="text-xs font-semibold text-zinc-400 mr-0.5">{label}:</span>}
        {buttons.map((btn) => (
          <a
            key={btn.name}
            href={btn.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${btn.name}`}
            className={`inline-flex items-center justify-center min-w-[28px] h-[26px] px-2 py-1 rounded-md text-xs no-underline transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${btn.bgClass} ${btn.textClass}`}
          >
            <span className="inline-flex items-center">{btn.icon}</span>
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Link"
          className="inline-flex items-center justify-center h-[26px] px-2 py-1 rounded-md text-xs border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <span className="inline-flex items-center"><CopyIcon /></span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
        {buttons.map((btn) => (
          <a
            key={btn.name}
            href={btn.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold no-underline transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${btn.bgClass} ${btn.textClass}`}
          >
            <span className="inline-flex items-center">{btn.icon}</span> {btn.name}
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-[13px] font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <span className="inline-flex items-center"><CopyIcon /></span> Copy Referral Link ({url})
      </button>
    </div>
  );
}
