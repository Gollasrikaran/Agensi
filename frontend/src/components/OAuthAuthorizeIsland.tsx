import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function OAuthAuthorizeIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // Parse URL params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  const handleAuthorize = async () => {
    if (!session) return;
    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/oauth/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to authorize');
      }

      // Redirect back to the client
      const url = new URL(redirectUri!);
      url.searchParams.append('code', data.code);
      if (data.state) {
        url.searchParams.append('state', data.state);
      }
      
      window.location.href = url.toString();
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-zinc-400">Loading...</div>;

  if (!clientId || !redirectUri) {
    return (
      <div className="text-center p-8 text-red-500 font-semibold bg-red-500/10 rounded-xl border border-red-500/20 max-w-lg mx-auto mt-10">
        Missing required OAuth parameters (client_id, redirect_uri).
      </div>
    );
  }

  if (!session) {
    // Save current URL to redirect back after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_redirect', window.location.href);
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="group flex flex-col p-8 rounded-2xl border border-zinc-800 bg-zinc-900 max-w-lg mx-auto text-center shadow-xl mt-10">
      <h2 className="text-2xl font-bold text-zinc-100 mb-4">Authorize Connection</h2>
      <p className="text-zinc-400 mb-8">
        <strong className="text-zinc-100">{clientId}</strong> is requesting access to your BodhicAI account.
      </p>

      <div className="text-left bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 mb-8 shadow-sm">
        <h4 className="mb-4 text-zinc-100 font-bold">This application will be able to:</h4>
        <ul className="text-zinc-300 list-disc pl-5 leading-relaxed space-y-2 marker:text-indigo-500">
          <li>Read your public creator profile and popular skills</li>
          <li>View your Bodhic Credit balance</li>
          <li>View your purchased skills and created skills</li>
          <li>Search the marketplace and browse skill requests</li>
          <li>Purchase and install skills using your credits</li>
          <li>Submit new skill requests on your behalf</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 border border-red-500/20 text-left font-medium">
          {error}
        </div>
      )}

      <div className="flex gap-4 justify-center mt-2">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          disabled={processing}
        >
          Cancel
        </button>
        <button 
          onClick={handleAuthorize}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50"
          disabled={processing}
        >
          {processing ? 'Authorizing...' : 'Authorize Access'}
        </button>
      </div>
    </div>
  );
}
