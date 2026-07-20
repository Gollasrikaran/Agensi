import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileSettingsIsland() {
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

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
        .select('username, avatar_url, background_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        if (data.username) {
          setCurrentUsername(data.username);
          setUsername(data.username);
        }
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.background_url) setBackgroundUrl(data.background_url);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // reset input
    event.target.value = '';

    setUploading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user_media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user_media')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
      } else {
        setBackgroundUrl(publicUrl);
      }
      setMessage({ type: 'success', text: `${type === 'avatar' ? 'Avatar' : 'Background'} uploaded! Don't forget to save.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

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
        body: JSON.stringify({ 
          username, 
          avatar_url: avatarUrl,
          background_url: backgroundUrl 
        })
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
      {/* Profile Header Preview */}
      <div style={{ 
        position: 'relative',
        marginBottom: 'var(--space-xl)', 
        background: backgroundUrl ? `url(${backgroundUrl}) center/cover no-repeat` : 'var(--canvas)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--hairline-strong)',
        overflow: 'hidden'
      }}>
        {/* Dark overlay if background exists for readability */}
        {backgroundUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.4))' }}></div>
        )}
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px', padding: 'var(--space-xl)' }}>
          {/* Avatar Preview */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary), #9b5cff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 700, color: '#fff', flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {!avatarUrl && (currentUsername ? currentUsername[0].toUpperCase() : '?')}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: backgroundUrl ? '#fff' : 'inherit' }}>
              {currentUsername ? `@${currentUsername}` : 'No username set yet'}
            </h2>
            <p style={{ margin: '4px 0 0', color: backgroundUrl ? 'rgba(255,255,255,0.7)' : 'var(--mute)', fontSize: '14px' }}>
              {currentUsername ? 'This is how sellers and buyers see you on the marketplace.' : 'Set a username so you appear on the marketplace!'}
            </p>
          </div>
        </div>
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

          {/* Media Uploads */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Profile Avatar
              </label>
              <input 
                type="file" 
                accept="image/*" 
                ref={avatarInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'avatar')} 
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                style={{ width: '100%' }}
              >
                {uploading ? 'Uploading...' : (avatarUrl ? 'Change Avatar' : 'Upload Avatar')}
              </button>
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Profile Background
              </label>
              <input 
                type="file" 
                accept="image/*" 
                ref={backgroundInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'background')} 
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => backgroundInputRef.current?.click()}
                disabled={uploading}
                style={{ width: '100%' }}
              >
                {uploading ? 'Uploading...' : (backgroundUrl ? 'Change Background' : 'Upload Background')}
              </button>
            </div>
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
            disabled={saving || uploading}
            style={{ minWidth: '120px' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
