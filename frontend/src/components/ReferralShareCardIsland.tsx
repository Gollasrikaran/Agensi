import React, { useEffect, useState } from 'react';
import { getReferralId } from '../lib/referral';
import SocialShareButtonsIsland from './SocialShareButtonsIsland';

export default function ReferralShareCardIsland() {
  const [refId, setRefId] = useState('REF-LOADING');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    getReferralId().then(id => {
      setRefId(id);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bodhicai.tech';
      setShareUrl(`${origin}/?ref=${id}`);
    });
  }, []);

  const shareText = `Hey! I'm using BodhicAI — an incredible action-agent marketplace where AI agents directly edit code, run local commands, and automate your workflows. Use my unique invite code (${refId}) to explore and unlock advanced AI skills!`;
  const shareTitle = `BodhicAI — Action-Agent Marketplace (Invite: ${refId})`;

  return (
    <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-emerald-500/5 via-indigo-500/5 to-purple-500/10 hover:border-indigo-500/50 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden mb-8">
      <div className="flex justify-between items-start flex-wrap gap-5">
        <div className="flex-1 min-w-[320px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
            MULTI-CHANNEL VIRAL REFERRAL
          </div>
          <h3 className="text-xl font-bold mb-2 text-zinc-100">
            Refer Friends & Earn 20% Affiliate Kickbacks!
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed mb-3">
            Share your unique referral code <strong className="text-indigo-400 font-mono bg-black/30 px-1.5 py-0.5 rounded">{refId}</strong> via WhatsApp, LinkedIn, Reddit, X (Twitter), or Telegram. When someone visits and signs up using your link, you automatically earn a <strong className="text-emerald-500">20% Affiliate Kickback</strong> on all credits they utilize for life!
          </p>
          <div className="flex gap-2 flex-wrap text-xs text-zinc-500">
            <span>Free instant sharing</span>
            <span>•</span>
            <span>Automated 20% reward attribution</span>
          </div>
        </div>

        <div className="flex-1 min-w-[240px]">
          <SocialShareButtonsIsland 
            url={shareUrl || 'https://bodhicai.tech'} 
            title={shareTitle} 
            text={shareText} 
            compact={false} 
          />
        </div>
      </div>
    </div>
  );
}
