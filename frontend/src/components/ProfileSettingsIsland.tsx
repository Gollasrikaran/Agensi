import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import AvatarPickerIsland from './AvatarPickerIsland';
import { UserCircle, Camera, Image as ImageIcon, ExternalLink, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProfileSettingsIsland() {
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [userId, setUserId] = useState('');
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
      setUserId(session.user.id);

      const { data } = await supabase
        .from('users')
        .select('username, bio, avatar_url, background_url, is_private')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        if (data.username) {
          setCurrentUsername(data.username);
          setUsername(data.username);
        }
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.background_url) setBackgroundUrl(data.background_url);
        if (data.is_private !== undefined) setIsPrivate(data.is_private);
      }
      if (data?.bio) setBio(data.bio);
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      } else {
        setAvatarUrl('');
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
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

      if (uploadError) throw uploadError;

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
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setMessage({ type: 'error', text: 'Username must be 3–30 characters, lowercase letters, numbers, or underscores only.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          username, 
          avatar_url: avatarUrl,
          background_url: backgroundUrl,
          bio,
          is_private: isPrivate
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
    return <div className="animate-pulse space-y-4 p-6"><div className="h-32 bg-zinc-800 rounded-xl"></div><div className="h-64 bg-zinc-800 rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Profile Header Preview */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none' }}
        />
        {backgroundUrl && <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />}
        
        <div className="relative flex flex-col sm:flex-row items-center gap-6 p-8">
          <div 
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white/20 text-3xl font-bold text-white shadow-xl bg-cover bg-center"
            style={{ 
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'linear-gradient(135deg, #6366f1, #a855f7)'
            }}
          >
            {!avatarUrl && (currentUsername ? currentUsername[0].toUpperCase() : '?')}
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className={cn("text-2xl font-bold", backgroundUrl ? "text-white" : "text-zinc-100")}>
              {currentUsername ? `@${currentUsername}` : 'No username set yet'}
            </h2>
            <p className={cn("mt-1 text-sm", backgroundUrl ? "text-white/70" : "text-zinc-400")}>
              {currentUsername ? 'This is how creators and buyers see you on the marketplace.' : 'Set a username so you appear on the marketplace!'}
            </p>
          </div>

          {currentUsername && (
            <div className="mt-4 sm:ml-auto sm:mt-0">
              <a 
                href={`/profile/${currentUsername}`} 
                target="_blank" 
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                View Public Profile <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 sm:p-8">
        <h3 className="mb-6 text-xl font-bold text-zinc-100">Edit Profile</h3>

        <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-zinc-500">
              3–30 characters. Lowercase letters, numbers, and underscores only. Must be unique.
            </p>
          </div>

          {/* Media Uploads */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-zinc-300">Profile Avatar</label>
              <input 
                type="file" 
                accept="image/*" 
                ref={avatarInputRef} 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'avatar')} 
              />
              <button 
                type="button" 
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {uploading ? 'Uploading...' : (avatarUrl ? 'Change Avatar' : 'Upload Avatar')}
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-zinc-300">Profile Background</label>
              <input 
                type="file" 
                accept="image/*" 
                ref={backgroundInputRef} 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'background')} 
              />
              <button 
                type="button" 
                onClick={() => backgroundInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                <ImageIcon className="h-4 w-4" />
                {uploading ? 'Uploading...' : (backgroundUrl ? 'Change Background' : 'Upload Background')}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Or Choose Avatar</label>
            <AvatarPickerIsland 
              userId={userId} 
              currentUsername={username} 
              onAvatarSelect={setAvatarUrl} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your skills..."
              rows={4}
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPrivate} 
                onChange={(e) => setIsPrivate(e.target.checked)} 
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" /> Private Profile
                </span>
                <span className="block mt-1 text-xs text-zinc-500">
                  If enabled, your public profile and Skill Pulse will be hidden from other users.
                </span>
              </div>
            </label>
          </div>

          {message && (
            <div className={cn(
              "rounded-xl p-4 text-sm font-medium",
              message.type === 'success' ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border border-red-500/20 bg-red-500/10 text-red-400"
            )}>
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
