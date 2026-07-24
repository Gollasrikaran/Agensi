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

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;

  if (!clientId || !redirectUri) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
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
    <div className="card" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>Authorize Connection</h2>
      <p style={{ color: 'var(--mute)', marginBottom: '2rem' }}>
        <strong>{clientId}</strong> is requesting access to your Bodhic AI account.
      </p>

      <div style={{ textAlign: 'left', background: 'var(--surface-2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>This application will be able to:</h4>
        <ul style={{ color: 'var(--mute)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
          <li>Read your public creator profile and popular skills</li>
          <li>View your Bodhic Credit balance</li>
          <li>View your purchased skills and created skills</li>
          <li>Search the marketplace and browse skill requests</li>
          <li>Purchase and install skills using your credits</li>
          <li>Submit new skill requests on your behalf</li>
        </ul>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          onClick={() => window.history.back()}
          className="btn"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          disabled={processing}
        >
          Cancel
        </button>
        <button 
          onClick={handleAuthorize}
          className="btn"
          style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}
          disabled={processing}
        >
          {processing ? 'Authorizing...' : 'Authorize Access'}
        </button>
      </div>
    </div>
  );
}
