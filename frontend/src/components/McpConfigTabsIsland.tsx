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
    <div className="card" style={{ padding: 'var(--space-xl)', background: 'var(--canvas-soft)', border: '1px solid var(--border)', borderRadius: '16px', marginTop: 'var(--space-md)' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔌</span> Connect Your AI Agent Environment
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--body)' }}>
          We provide separated configurations for desktop IDEs, VS Code Copilot, and cloud/web-based agents. Choose your setup:
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--hairline-strong)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ide')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            background: activeTab === 'ide' ? 'var(--primary)' : 'var(--bg-tertiary)', 
            color: activeTab === 'ide' ? '#fff' : 'var(--text-secondary)', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: '13px',
            boxShadow: activeTab === 'ide' ? '0 4px 12px rgba(108, 60, 225, 0.3)' : 'none',
            transition: 'all 0.2s' 
          }}
        >
          💻 Cursor / Claude Desktop / Windsurf
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('copilot')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            background: activeTab === 'copilot' ? 'var(--primary)' : 'var(--bg-tertiary)', 
            color: activeTab === 'copilot' ? '#fff' : 'var(--text-secondary)', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: '13px',
            boxShadow: activeTab === 'copilot' ? '0 4px 12px rgba(108, 60, 225, 0.3)' : 'none',
            transition: 'all 0.2s' 
          }}
        >
          🤖 VS Code (GitHub Copilot)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('web')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            background: activeTab === 'web' ? 'var(--primary)' : 'var(--bg-tertiary)', 
            color: activeTab === 'web' ? '#fff' : 'var(--text-secondary)', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: '13px',
            boxShadow: activeTab === 'web' ? '0 4px 12px rgba(108, 60, 225, 0.3)' : 'none',
            transition: 'all 0.2s' 
          }}
        >
          🌐 Claude Web UI / Web Agents
        </button>
      </div>

      {activeTab === 'ide' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600 }}>
              Add to your editor's MCP JSON config (e.g., Cursor Settings → MCP or <code>claude_desktop_config.json</code>):
            </span>
            <button 
              type="button" 
              onClick={() => copyToClipboard(cursorClaudeSnippet, 'Cursor / Claude setup')}
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
            >
              📋 Copy JSON
            </button>
          </div>
          <pre style={{ background: '#0d0d12', color: '#e2e8f0', padding: '16px', borderRadius: '10px', fontSize: '13px', overflowX: 'auto', border: '1px solid #222', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
            {cursorClaudeSnippet}
          </pre>
        </div>
      )}

      {activeTab === 'copilot' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600 }}>
              Add to your VS Code workspace <code>.vscode/mcp.json</code> or global Settings under GitHub Copilot Chat:
            </span>
            <button 
              type="button" 
              onClick={() => copyToClipboard(copilotSnippet, 'GitHub Copilot setup')}
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
            >
              📋 Copy JSON
            </button>
          </div>
          <pre style={{ background: '#0d0d12', color: '#e2e8f0', padding: '16px', borderRadius: '10px', fontSize: '13px', overflowX: 'auto', border: '1px solid #222', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
            {copilotSnippet}
          </pre>
        </div>
      )}

      {activeTab === 'web' && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--body)', marginBottom: '12px', lineHeight: 1.6 }}>
            For <strong>Claude Web UI</strong>, Custom GPTs, or cloud assistants where you cannot set HTTP authorization headers, your API key is securely authenticated via the URL path:
          </p>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase' }}>Direct SSE Endpoint URL</span>
              <button 
                type="button" 
                onClick={() => copyToClipboard(webUrl, 'Direct Web URL')}
                className="btn btn-secondary" 
                style={{ padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
              >
                📋 Copy URL
              </button>
            </div>
            <div style={{ background: 'rgba(108, 60, 225, 0.1)', border: '1px solid var(--primary)', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', wordBreak: 'break-all', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>
              {webUrl}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase' }}>Web Agent JSON Config</span>
            <button 
              type="button" 
              onClick={() => copyToClipboard(webAgentSnippet, 'Web Agent JSON')}
              className="btn btn-secondary" 
              style={{ padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
            >
              📋 Copy JSON
            </button>
          </div>
          <pre style={{ background: '#0d0d12', color: '#e2e8f0', padding: '16px', borderRadius: '10px', fontSize: '13px', overflowX: 'auto', border: '1px solid #222', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
            {webAgentSnippet}
          </pre>
        </div>
      )}
    </div>
  );
}
