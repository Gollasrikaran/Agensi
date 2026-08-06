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

  const shareText = `Check out "${skillTitle}" on BodhicAI — an action-agent marketplace where AI agents directly edit code, run local commands, and automate your dev workflows!`;
  const shareTitle = `${skillTitle} — BodhicAI Agent Skill`;

  return (
    <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden mb-6">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1 border border-indigo-500/20">
              INSTANT REFER & EARN
            </div>
            <h4 className="m-0 text-lg font-bold text-zinc-100">
              Share This Skill & Earn 20% Kickbacks!
            </h4>
            <p className="m-0 mt-1 text-sm text-zinc-300">
              Share your invite link via WhatsApp, LinkedIn, Reddit, X (Twitter), or Telegram. When someone signs up, you automatically earn a <strong className="text-emerald-500">20% Affiliate Kickback</strong> on all credits they utilize for life!
            </p>
          </div>
          <div className="font-mono text-xs bg-black/50 px-2 py-1 rounded-md border border-zinc-800 text-zinc-300">
            Code: <strong className="text-indigo-400">{refId}</strong>
          </div>
        </div>
        
        <div className="pt-2 border-t border-zinc-800/50 mt-2">
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
