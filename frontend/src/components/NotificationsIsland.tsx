import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NotificationsIsland() {
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: false,
    dnd_enabled: false,
    dnd_start_time: '22:00:00',
    dnd_end_time: '08:00:00'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchNotifications(session.access_token);
        fetchSettings(session.user.id);
        registerServiceWorker();
      } else {
        window.location.href = '/login';
      }
    });
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.error('SW registration failed:', e);
      }
    }
  };

  const fetchSettings = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
      if (data) {
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async () => {
    if (!session) return;
    setSavingSettings(true);
    try {
      await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        ...settings,
        updated_at: new Date().toISOString()
      });
      
      // Request push permissions if enabled
      if (settings.push_notifications && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          // Subscribe to push via PushManager (requires VAPID keys in production)
          // For now, we just save the intent.
        } else {
          setSettings(prev => ({ ...prev, push_notifications: false }));
          alert("Please enable notifications in your browser settings.");
        }
      }
      
      setShowSettings(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchNotifications = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: string, link?: string) => {
    if (!session) return;
    try {
      await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      if (link) window.location.href = link;
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!session) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    for (const id of unreadIds) {
      await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifs = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  if (loading) {
    return <div className="text-center p-10 text-zinc-400">Loading notifications...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-100 m-0">Notifications</h1>
        <div className="flex gap-3">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900/50 text-zinc-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
          <button onClick={markAllAsRead} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
            Mark all read
          </button>
          <button onClick={() => setShowSettings(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredNotifs.length === 0 ? (
          <div className="group flex flex-col p-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-center text-zinc-400 shadow-sm relative overflow-hidden">
            No notifications to display.
          </div>
        ) : (
          filteredNotifs.map(n => (
            <div 
              key={n.id}
              onClick={() => markAsRead(n.id, n.link)}
              className={`flex justify-between items-center p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg rounded-2xl border ${n.is_read ? 'border-zinc-800 bg-zinc-900 border-l border-l-zinc-800' : 'border-zinc-800 bg-zinc-900/50 border-l-4 border-l-indigo-500'}`}
            >
              <div className="flex gap-4 items-center">
                <div className="text-2xl">
                  {n.type === 'success' ? '🟢' : n.type === 'error' ? '🔴' : n.type === 'bounty' ? '🏆' : '🔵'}
                </div>
                <div>
                  <h3 className={`m-0 mb-1 text-base ${n.is_read ? 'font-medium text-zinc-300' : 'font-bold text-zinc-100'}`}>{n.title}</h3>
                  <p className="m-0 text-sm text-zinc-400">{n.message}</p>
                  <span className="block mt-2 text-xs text-zinc-500">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => deleteNotification(n.id, e)}
                className="bg-transparent border-none text-red-500/80 hover:text-red-500 hover:bg-red-500/10 cursor-pointer p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                title="Delete Notification"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-5">
          <div className="group flex flex-col p-8 rounded-2xl border border-zinc-800 bg-zinc-900 w-full max-w-lg shadow-xl relative overflow-hidden">
            <h3 className="text-2xl font-bold text-zinc-100 mb-6">Notification Settings</h3>
            
            <div className="flex flex-col gap-6">
              <label className="flex items-center gap-3 cursor-pointer group/label">
                <input 
                  type="checkbox" 
                  checked={settings.email_notifications} 
                  onChange={e => setSettings({...settings, email_notifications: e.target.checked})}
                  className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 bg-zinc-950" 
                />
                <span className="text-base text-zinc-300 group-hover/label:text-zinc-100 transition-colors">Email Notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group/label">
                <input 
                  type="checkbox" 
                  checked={settings.push_notifications} 
                  onChange={e => setSettings({...settings, push_notifications: e.target.checked})} 
                  className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 bg-zinc-950" 
                />
                <span className="text-base text-zinc-300 group-hover/label:text-zinc-100 transition-colors">Desktop / Web Push Notifications</span>
              </label>

              <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
                <label className="flex items-center gap-3 cursor-pointer mb-4 group/label">
                  <input 
                    type="checkbox" 
                    checked={settings.dnd_enabled} 
                    onChange={e => setSettings({...settings, dnd_enabled: e.target.checked})} 
                    className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 bg-zinc-950" 
                  />
                  <span className="text-base font-bold text-zinc-100 group-hover/label:text-white transition-colors">Do Not Disturb (Quiet Hours)</span>
                </label>
                
                {settings.dnd_enabled && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-500 font-semibold mb-1">Start Time</label>
                      <input type="time" value={settings.dnd_start_time.substring(0,5)} onChange={e => setSettings({...settings, dnd_start_time: e.target.value + ':00'})} className="w-full rounded-xl border border-zinc-700 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-500 font-semibold mb-1">End Time</label>
                      <input type="time" value={settings.dnd_end_time.substring(0,5)} onChange={e => setSettings({...settings, dnd_end_time: e.target.value + ':00'})} className="w-full rounded-xl border border-zinc-700 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-8">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50" onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
