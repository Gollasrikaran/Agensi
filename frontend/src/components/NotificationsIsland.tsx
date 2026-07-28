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
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mute)' }}>Loading notifications...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Notifications</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--hairline)',
              background: 'var(--canvas-soft)',
              color: 'var(--body)'
            }}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
          <button onClick={markAllAsRead} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Mark all read
          </button>
          <button onClick={() => setShowSettings(true)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifs.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--mute)' }}>
            No notifications to display.
          </div>
        ) : (
          filteredNotifs.map(n => (
            <div 
              key={n.id}
              onClick={() => markAsRead(n.id, n.link)}
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                cursor: 'pointer',
                borderLeft: n.is_read ? '1px solid var(--hairline)' : '4px solid var(--primary)',
                background: n.is_read ? 'var(--canvas)' : 'var(--canvas-soft-2)'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '24px' }}>
                  {n.type === 'success' ? '🟢' : n.type === 'error' ? '🔴' : n.type === 'bounty' ? '🏆' : '🔵'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: n.is_read ? '500' : '700' }}>{n.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--mute)' }}>{n.message}</p>
                  <span style={{ fontSize: '12px', color: 'var(--mute)', display: 'block', marginTop: '8px' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => deleteNotification(n.id, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--error)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                }}
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: 'var(--space-2xl)' }}>
            <h3 style={{ marginBottom: '24px' }}>Notification Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.email_notifications} 
                  onChange={e => setSettings({...settings, email_notifications: e.target.checked})} 
                />
                <span style={{ fontSize: '16px' }}>Email Notifications</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.push_notifications} 
                  onChange={e => setSettings({...settings, push_notifications: e.target.checked})} 
                />
                <span style={{ fontSize: '16px' }}>Desktop / Web Push Notifications</span>
              </label>

              <div style={{ padding: '16px', border: '1px solid var(--hairline)', borderRadius: '8px', background: 'var(--canvas-soft-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.dnd_enabled} 
                    onChange={e => setSettings({...settings, dnd_enabled: e.target.checked})} 
                  />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Do Not Disturb (Quiet Hours)</span>
                </label>
                
                {settings.dnd_enabled && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--mute)', marginBottom: '4px' }}>Start Time</label>
                      <input type="time" value={settings.dnd_start_time.substring(0,5)} onChange={e => setSettings({...settings, dnd_start_time: e.target.value + ':00'})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--hairline)', background: 'var(--canvas)', color: 'var(--ink)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--mute)', marginBottom: '4px' }}>End Time</label>
                      <input type="time" value={settings.dnd_end_time.substring(0,5)} onChange={e => setSettings({...settings, dnd_end_time: e.target.value + ':00'})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--hairline)', background: 'var(--canvas)', color: 'var(--ink)' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
