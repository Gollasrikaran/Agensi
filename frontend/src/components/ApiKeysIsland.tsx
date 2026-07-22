import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';

export default function ApiKeysIsland() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const mcpConfigSnippet = `{
  "mcpServers": {
    "bodhic": {
      "command": "curl",
      "args": [
        "-H",
        "Authorization: Bearer YOUR_API_KEY",
        "${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/public/mcp/sse"
      ]
    }
  }
}`;

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/api_keys`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) setKeys(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedKey(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/api_keys`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName })
      });
      
      const data = await res.json();
      if (res.ok) {
        setGeneratedKey(data.raw_key);
        setNewKeyName('');
        fetchKeys();
      } else {
        setError(data.detail);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/api_keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        showToast('API key revoked.', 'success');
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to revoke API key.', 'error');
    } finally {
      setConfirmRevokeId(null);
    }
  };

  if (loading) return <div>Loading API keys...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-xl)' }}>
      <div>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginbottom: 'var(--space-md)' }}>Create New Key</h3>
          <form onSubmit={createKey} className="form-group">
            <div>
              <label>Key Name</label>
              <input 
                type="text" 
                value={newKeyName} 
                onChange={e => setNewKeyName(e.target.value)} 
                required 
                placeholder="e.g. Cursor IDE, Claude Desktop"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
              Generate Key
            </button>
            {error && <div style={{ color: 'var(--error)', marginTop: '8px', fontSize: '14px' }}>{error}</div>}
          </form>
        </div>
      </div>
      
      <div>
        {generatedKey && (
          <div className="card" style={{ padding: 'var(--space-xl)', background: 'var(--success-soft)', border: '1px solid var(--success)', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '8px' }}>API Key Generated!</h3>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>Please copy this key now. For security reasons, you will <strong>not be able to see it again</strong>.</p>
            <div style={{ background: '#000', color: '#0f0', padding: '12px', fontFamily: 'monospace', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{generatedKey}</span>
              <button onClick={() => navigator.clipboard.writeText(generatedKey)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>Copy</button>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Active API Keys</h3>
          {keys.length === 0 ? (
            <p style={{ color: 'var(--mute)' }}>You have no active API keys.</p>
          ) : (
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Prefix</th>
                  <th style={{ padding: '12px 8px' }}>Created</th>
                  <th style={{ padding: '12px 8px' }}>Last Used</th>
                  <th style={{ padding: '12px 8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map(key => (
                  <tr key={key.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{key.name}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{key.key_prefix}...</td>
                    <td style={{ padding: '12px 8px', color: 'var(--mute)', fontSize: '14px' }}>{new Date(key.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--mute)', fontSize: '14px' }}>
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      {confirmRevokeId === key.id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Are you sure?</span>
                          <button onClick={() => deleteKey(key.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: '#fff', background: 'var(--error)', borderColor: 'var(--error)' }}>Yes, Revoke</button>
                          <button onClick={() => setConfirmRevokeId(null)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRevokeId(key.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--error)', borderColor: 'var(--error-soft)' }}>Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-lg)', background: 'var(--canvas-soft)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>How to use with MCP</h3>
          <p style={{ fontSize: '14px', color: 'var(--body)', marginBottom: '16px' }}>
            To connect Cursor or Claude Desktop to Bodhic AI, add the following to your MCP configuration file (e.g., <code>cursor_mcp.json</code>):
          </p>
          <pre style={{ background: '#111', color: '#fff', padding: '16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto' }}>
            {mcpConfigSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}