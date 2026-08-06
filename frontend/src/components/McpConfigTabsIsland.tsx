import React, { useState } from 'react';
import { showToast } from '../lib/toast';

interface Props {
  apiKey?: string;
  apiUrl?: string;
}

export default function McpConfigTabsIsland({ 
  apiKey = "YOUR_API_KEY", 
  apiUrl = import.meta.env.PUBLIC_API_URL || "https://bodhicai.onrender.com" 
}: Props) {
  const [activeTab, setActiveTab] = useState<'ide' | 'copilot' | 'web'>('ide');

  const cleanUrl = apiUrl.replace(/\/$/, "");

  const cursorClaudeSnippet = `{
  "mcpServers": {
    "bodhic-ai": {
      "url": "${cleanUrl}/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}`;

  const copilotSnippet = `{
  "mcpServers": {
    "bodhic-ai": {
      "type": "sse",
      "url": "${cleanUrl}/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}`;

  const webUrl = `${cleanUrl}/mcp/${apiKey}/sse`;

  const webAgentSnippet = `{
  "mcpServers": {
    "bodhic-web": {
      "url": "${webUrl}"
    }
  }
}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'success');
  };

  return (
    <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-1.5 text-zinc-100 flex items-center gap-2">
          Connect Your AI Agent Environment
        </h3>
        <p className="text-sm text-zinc-300">
          We provide separated configurations for desktop IDEs, VS Code Copilot, and cloud/web-based agents. Choose your setup:
        </p>
      </div>
      
      <div className="flex gap-2 mb-5 border-b border-zinc-800/50 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('ide')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${activeTab === 'ide' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'}`}
        >
          Cursor / Claude Desktop / Windsurf
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('copilot')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${activeTab === 'copilot' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'}`}
        >
          VS Code (GitHub Copilot)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('web')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${activeTab === 'web' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'}`}
        >
          Claude Web UI / Web Agents
        </button>
      </div>

      {activeTab === 'ide' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-100 font-semibold">
              Add to your editor's MCP JSON config (e.g., Cursor Settings → MCP or <code className="bg-black px-1 py-0.5 rounded">claude_desktop_config.json</code>):
            </span>
            <button 
              type="button" 
              onClick={() => copyToClipboard(cursorClaudeSnippet, 'Cursor / Claude setup')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-black text-zinc-300 p-4 rounded-xl text-sm overflow-x-auto border border-zinc-800 font-mono leading-relaxed">
            {cursorClaudeSnippet}
          </pre>
        </div>
      )}

      {activeTab === 'copilot' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-100 font-semibold">
              Add to your VS Code workspace <code className="bg-black px-1 py-0.5 rounded">.vscode/mcp.json</code> or global Settings under GitHub Copilot Chat:
            </span>
            <button 
              type="button" 
              onClick={() => copyToClipboard(copilotSnippet, 'GitHub Copilot setup')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-black text-zinc-300 p-4 rounded-xl text-sm overflow-x-auto border border-zinc-800 font-mono leading-relaxed">
            {copilotSnippet}
          </pre>
        </div>
      )}

      {activeTab === 'web' && (
        <div>
          <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
            For <strong>Claude Web UI</strong>, Custom GPTs, or cloud assistants where you cannot set HTTP authorization headers, your API key is securely authenticated via the URL path:
          </p>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Direct SSE Endpoint URL</span>
              <button 
                type="button" 
                onClick={() => copyToClipboard(webUrl, 'Direct Web URL')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Copy URL
              </button>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-sm break-all text-indigo-400 font-semibold font-mono">
              {webUrl}
            </div>
          </div>

          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Web Agent JSON Config</span>
            <button 
              type="button" 
              onClick={() => copyToClipboard(webAgentSnippet, 'Web Agent JSON')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-black text-zinc-300 p-4 rounded-xl text-sm overflow-x-auto border border-zinc-800 font-mono leading-relaxed">
            {webAgentSnippet}
          </pre>
        </div>
      )}
    </div>
  );
}
