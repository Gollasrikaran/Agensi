import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
export default function ProfileSettingsIsland() {
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Fetch current profile from users table
      const { data } = await supabase
        .from('users')
        .select('username, bio, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data?.username) {
        setCurrentUsername(data.username);
        setUsername(data.username);
      }
      if (data?.bio) {
        setBio(data.bio);
      }
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      } else {
        // Assign a random default bot avatar if none is set
        setAvatarUrl(`https://api.dicebear.com/9.x/bottts/svg?seed=${session.user.id}`);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }
    // Validate username (alphanumeric + underscore only)
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setMessage({ type: 'error', text: 'Username must be 3–30 characters, lowercase letters, numbers, or underscores only.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('http://localhost:8000/api/users/me/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ username, avatar_url: avatarUrl, bio })
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentUsername(username);
        setMessage({ type: 'success', text: '✓ Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-xl)', color: 'var(--mute)' }}>Loading profile...</div>;
  }

  return (
    <div>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 'var(--space-xl)', padding: 'var(--space-xl)', background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline-strong)' }}>
        {/* Avatar Initials */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--canvas-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 700, color: '#fff', flexShrink: 0,
          overflow: 'hidden', border: '1px solid var(--hairline-strong)'
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            currentUsername ? currentUsername[0].toUpperCase() : '?'
          )}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px' }}>
            {currentUsername ? `@${currentUsername}` : 'No username set yet'}
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--mute)', fontSize: '14px' }}>
            {currentUsername ? 'This is how sellers and buyers see you on the marketplace.' : 'Set a username so you appear on the marketplace!'}
          </p>
        </div>
        
        {currentUsername && (
          <div style={{ marginLeft: 'auto' }}>
            <a 
              href={`/profile/${currentUsername}`} 
              target="_blank" 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              View Public Profile ↗
            </a>
          </div>
        )}
      </div>

      {/* Form */}
      <div style={{ padding: 'var(--space-xl)', background: 'var(--canvas)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--hairline-strong)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--space-lg)', fontSize: '18px' }}>Edit Profile</h3>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--mute)', fontSize: '15px', pointerEvents: 'none'
              }}>@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 28px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--hairline-strong)',
                  background: 'var(--canvas-soft)',
                  color: 'var(--ink)',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--mute)' }}>
              3–30 characters. Lowercase letters, numbers, and underscores only. Must be unique.
            </p>
          </div>

          {/* Avatar Picker */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
              Choose your AI Avatar (or enter a custom URL)
            </label>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {/* Predefined Dicebear Bottts array */}
              {['Nexus', 'Nova', 'Cyber', 'Neon', 'Byte', 'Glitch', 'Spark'].map((seed) => {
                const url = `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;
                const isSelected = avatarUrl === url;
                return (
                  <div 
                    key={seed}
                    onClick={() => setAvatarUrl(url)}
                    style={{
                      width: '48px', height: '48px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--hairline-strong)',
                      background: 'var(--canvas-strong)',
                      padding: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={url} alt={seed} style={{ width: '100%', height: '100%' }} />
                  </div>
                );
              })}
            </div>
            
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/my-avatar.png"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--hairline-strong)',
                background: 'var(--canvas-soft)',
                color: 'var(--ink)',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--mute)' }}>
              Select a predefined bot or paste a direct image URL.
            </p>
          </div>
          
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your skills..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--hairline-strong)',
                background: 'var(--canvas-soft)',
                color: 'var(--ink)',
                fontSize: '15px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-md)',
              background: message.type === 'success' ? 'var(--success-soft)' : 'var(--error-soft)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
              fontSize: '14px'
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ minWidth: '120px' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
