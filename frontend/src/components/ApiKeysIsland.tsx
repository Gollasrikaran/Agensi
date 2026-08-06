import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import McpConfigTabsIsland from './McpConfigTabsIsland';

export default function ApiKeysIsland() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

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

  if (loading) return <div className="text-zinc-300">Loading API keys...</div>;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
      <div>
        <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">Create New Key</h3>
          <form onSubmit={createKey} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Key Name</label>
              <input 
                type="text" 
                value={newKeyName} 
                onChange={e => setNewKeyName(e.target.value)} 
                required 
                placeholder="e.g. Cursor IDE, Claude Desktop"
                className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 w-full mt-2">
              Generate Key
            </button>
            {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
          </form>
        </div>
      </div>
      
      <div>
        {generatedKey && (
          <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden mb-8">
            <h3 className="text-emerald-500 mb-2 font-semibold">API Key Generated!</h3>
            <p className="text-sm text-zinc-300 mb-4">Please copy this key now. For security reasons, you will <strong className="text-zinc-100">not be able to see it again</strong>.</p>
            <div className="bg-black text-emerald-400 p-3 font-mono rounded-xl flex items-center gap-3 overflow-hidden border border-emerald-500/20">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1">{generatedKey}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedKey); showToast('API key copied!', 'success'); }}
                className="shrink-0 bg-zinc-800/50 border border-zinc-700 text-zinc-100 cursor-pointer rounded-xl px-3 py-1 text-xs font-medium hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden mb-8">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">Active API Keys</h3>
          {keys.length === 0 ? (
            <p className="text-zinc-400">You have no active API keys.</p>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Prefix</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Last Used</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {keys.map(key => (
                    <tr key={key.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 text-zinc-100 font-medium">{key.name}</td>
                      <td className="px-6 py-4 text-zinc-300 font-mono">{key.key_prefix}...</td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">{new Date(key.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmRevokeId === key.id ? (
                          <div className="flex gap-2 justify-end items-center">
                            <span className="text-xs text-zinc-400">Are you sure?</span>
                            <button onClick={() => deleteKey(key.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">Yes, Revoke</button>
                            <button onClick={() => setConfirmRevokeId(null)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmRevokeId(key.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <McpConfigTabsIsland apiKey={generatedKey || "YOUR_API_KEY"} />
      </div>
    </div>
  );
}