import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Terminal, Copy, CheckCircle2, Code2, ExternalLink } from 'lucide-react';
import { showToast } from '../lib/toast';

interface InstallationCardProps {
  installCommand: string;
  sourceUrl: string;
}

export default function InstallationCardIsland({ installCommand, sourceUrl }: InstallationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!installCommand) return;
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    showToast("Command copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-white/5">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2 flex items-center">
          <Terminal size={20} className="mr-2 text-indigo-400" />
          Installation
        </h3>
        <p className="text-sm text-zinc-400">
          Run the following command in your terminal to install this agent tool locally.
        </p>
      </div>
      
      <CardContent className="p-6 space-y-6">
        {installCommand ? (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center justify-between bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300">
              <span className="truncate mr-4 flex-1">$ {installCommand}</span>
              <button 
                onClick={handleCopy}
                className="flex-shrink-0 bg-white/5 hover:bg-white/10 p-2 rounded-md transition-colors"
                title="Copy command"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400 hover:text-white" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500 italic">No installation command provided for this tool.</div>
        )}
        
        {sourceUrl && (
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm text-zinc-400 flex items-center">
              <Code2 size={16} className="mr-2" /> Source Repository
            </span>
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
            >
              View on GitHub <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
