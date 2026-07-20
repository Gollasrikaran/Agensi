import React, { useState } from 'react';

export default function McpTestIsland({ skillId }: { skillId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-secondary" onClick={() => setIsOpen(true)} style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
        Test via MCP (Credits)
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: 'var(--space-xl)', background: 'var(--canvas)', border: '1px solid var(--hairline)' }}>
            <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-md)' }}>Test with local AI Agent</h2>
            <p style={{ color: 'var(--body)', marginBottom: 'var(--space-md)' }}>
              You can test this skill directly from Cursor, Claude Desktop, or Windsurf before buying it outright. Testing costs <strong>10 Bodhic Credits</strong> per chat.
            </p>
            
            <div style={{ background: 'var(--canvas-soft)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              <ol style={{ marginLeft: '20px', color: 'var(--body)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Ensure you have Bodhic Credits. <a href="/dashboard/credits" style={{ color: 'var(--primary)' }}>Recharge Here</a>.</li>
                <li>Generate an API key in your <a href="/dashboard/developer" style={{ color: 'var(--primary)' }}>Developer Settings</a>.</li>
                <li>Add the Bodhic MCP server to your agent's config using your key.</li>
                <li>Ask your agent: <em>"Call chat_with_skill for {skillId}"</em></li>
              </ol>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="/dashboard/credits" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>Buy Credits</a>
              <button className="btn btn-secondary" onClick={() => setIsOpen(false)} style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
