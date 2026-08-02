import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { captureReferralFromUrl } from '../lib/referral';

export default function NavbarIsland() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userData, setUserData] = useState<{username: string, avatar_url: string | null} | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const menuRef = useRef<HTMLElement>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureReferralFromUrl();
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
    
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
        fetchUserData(session.user.id);
        fetchNotifications(session.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
        fetchUserData(session.user.id);
        fetchNotifications(session.access_token);
      } else {
        setIsAdmin(false);
        setUserData(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    
    // Subscribe to realtime notifications
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${session.user.id}` 
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isMenuOpen || isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isNotifOpen]);

  const fetchNotifications = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationRead = async (notifId: string, link?: string) => {
    if (!session) return;
    try {
      fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (link) window.location.href = link;
    } catch (e) {
      console.error(e);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase.from('admins').select('id').eq('id', userId).maybeSingle();
      if (data) setIsAdmin(true);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data } = await supabase.from('users').select('username, avatar_url').eq('id', userId).maybeSingle();
      if (data) setUserData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const closeMenu = () => setIsMenuOpen(false);

  const navStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    boxSizing: 'border-box',
    background: (isScrolled || isMenuOpen) ? 'var(--nav-bg)' : 'transparent',
    backdropFilter: (isScrolled || isMenuOpen) ? 'saturate(180%) blur(12px)' : 'none',
    borderBottom: (isScrolled || isMenuOpen) ? '1px solid var(--hairline)' : '1px solid transparent',
    transition: 'var(--transition-colors)',
  };

  const innerContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <header style={navStyle} ref={menuRef}>
      <div style={innerContainerStyle}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a href="/" aria-label="BodhicAI" title="BodhicAI" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="BodhicAI Logo" style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              objectFit: 'cover',
              boxShadow: 'var(--shadow-glow)' 
            }} />
            <span aria-hidden="true" style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.5px' }}>
              Bodhic<span style={{ color: 'var(--primary)' }}>AI</span>
            </span>
          </a>
        </div>
        
        {/* Center: Links */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '24px', fontWeight: '500', fontSize: '14px' }}>
            <a href="/about" style={{ color: currentPath.startsWith('/about') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/about') ? '600' : '500' }}>About</a>
            <a href="/browse" style={{ color: currentPath.startsWith('/browse') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/browse') ? '600' : '500' }}>Browse</a>
            <a href="/requests" style={{ color: currentPath.startsWith('/requests') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/requests') ? '600' : '500' }}>Request for new skill</a>
            <a href="/sell" style={{ color: currentPath.startsWith('/sell') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/sell') ? '600' : '500' }}>Create a Skill</a>
            <a href="/guides" style={{ color: currentPath.startsWith('/guides') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/guides') ? '600' : '500' }}>Guides</a>
            <a href="/mcp" style={{ color: currentPath.startsWith('/mcp') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/mcp') ? '600' : '500' }}>MCP</a>
            <a href="/dashboard/buyer" style={{ color: currentPath.startsWith('/dashboard/buyer') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/dashboard/buyer') ? '600' : '500' }}>Dashboard</a>
            <a href="/dashboard/bounties" style={{ color: currentPath.startsWith('/dashboard/bounties') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/dashboard/bounties') ? '600' : '500' }}>Bounty Panel</a>
            {isAdmin && (
              <a href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Control Panel</a>
            )}
          </nav>
        )}

        {/* Right: Search & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Desktop Search & Auth */}
          {!isMobile && (
            <>
              {/* Search Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', color: 'var(--mute)' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search skills..." 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                      window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                    }
                  }}
                  style={{
                    background: 'var(--canvas-soft-2)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 12px 8px 36px',
                    color: 'var(--ink)',
                    outline: 'none',
                    width: '200px',
                    fontSize: '13px'
                  }}
                />
                <div style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  background: 'var(--canvas-soft)', 
                  border: '1px solid var(--hairline)',
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: 'var(--mute)'
                }}>
                  ⌘K
                </div>
              </div>

              {session ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Notification Bell */}
                  <div style={{ position: 'relative' }} ref={notifRef}>
                    <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', position: 'relative' }}
                    >
                      🔔
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'var(--error)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          boxShadow: '0 0 5px var(--error)'
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div className="glass-card" style={{
                        position: 'absolute',
                        top: '40px',
                        right: '-50px',
                        width: '320px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '16px',
                        zIndex: 999
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
                          <a href="/notifications" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>View All</a>
                        </div>
                        {notifications.length === 0 ? (
                          <p style={{ color: 'var(--mute)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No notifications yet.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {notifications.slice(0, 10).map((n: any) => (
                              <div 
                                key={n.id} 
                                onClick={() => markNotificationRead(n.id, n.link)}
                                style={{ 
                                  padding: '12px', 
                                  background: n.is_read ? 'transparent' : 'var(--canvas-soft-2)',
                                  border: '1px solid var(--hairline)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  gap: '12px'
                                }}
                              >
                                <div style={{ fontSize: '18px' }}>
                                  {n.type === 'success' ? '🟢' : n.type === 'error' ? '🔴' : n.type === 'bounty' ? '🏆' : '🔵'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: n.is_read ? 'normal' : 'bold', color: 'var(--ink)' }}>{n.title}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '4px' }}>{n.message}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <a href="/dashboard/profile">
                      <img 
                        src={userData?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${userData?.username || 'U'}`} 
                        alt="Avatar" 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%',
                          border: '2px solid var(--hairline-strong)',
                          background: 'var(--canvas-soft-2)'
                        }} 
                      />
                    </a>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    style={{
                      background: 'transparent', 
                      border: '1px solid var(--hairline)', 
                      color: 'var(--body)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <a href="/login" style={{ color: 'var(--body)', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }}>Log in</a>
                  <a href="/signup" style={{
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: 'var(--shadow-glow)'
                  }}>
                    Get Started
                  </a>
                </div>
              )}
            </>
          )}

          {/* Mobile Right Side (Avatar + Hamburger) */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {session && (
                <a href="/dashboard/profile" onClick={closeMenu} style={{ display: 'flex' }}>
                  <img 
                    src={userData?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${userData?.username || 'U'}`} 
                    alt="Avatar" 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%',
                      border: '2px solid var(--hairline-strong)',
                      background: 'var(--canvas-soft-2)'
                    }} 
                  />
                </a>
              )}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobile && isMenuOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          width: '100%', 
          background: 'var(--canvas-elevated)', 
          borderBottom: '1px solid var(--hairline)',
          boxShadow: 'var(--shadow-glow)',
          padding: '16px 24px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 200,
          boxSizing: 'border-box'
        }}>
          {/* Mobile Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--mute)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search skills..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                  window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                  closeMenu();
                }
              }}
              style={{
                background: 'var(--canvas-soft-2)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--radius-pill)',
                padding: '10px 12px 10px 36px',
                color: 'var(--ink)',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a href="/about" onClick={closeMenu} style={{ color: currentPath.startsWith('/about') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/about') ? '600' : '500', fontSize: '16px' }}>About</a>
            <a href="/browse" onClick={closeMenu} style={{ color: currentPath.startsWith('/browse') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/browse') ? '600' : '500', fontSize: '16px' }}>Browse</a>
            <a href="/requests" onClick={closeMenu} style={{ color: currentPath.startsWith('/requests') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/requests') ? '600' : '500', fontSize: '16px' }}>Request for new skill</a>
            <a href="/sell" onClick={closeMenu} style={{ color: currentPath.startsWith('/sell') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/sell') ? '600' : '500', fontSize: '16px' }}>Create a Skill</a>
            <a href="/guides" onClick={closeMenu} style={{ color: currentPath.startsWith('/guides') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/guides') ? '600' : '500', fontSize: '16px' }}>Guides</a>
            <a href="/mcp" onClick={closeMenu} style={{ color: currentPath.startsWith('/mcp') ? 'var(--primary)' : 'var(--body)', textDecoration: 'none', fontWeight: currentPath.startsWith('/mcp') ? '600' : '500', fontSize: '16px' }}>MCP</a>
            <a href="/dashboard/buyer" onClick={closeMenu} style={{ color: currentPath.startsWith('/dashboard/buyer') ? 'var(--primary)' : 'var(--ink)', textDecoration: 'none', fontWeight: '500', fontSize: '18px' }}>Dashboard</a>
            <a href="/dashboard/bounties" onClick={closeMenu} style={{ color: currentPath.startsWith('/dashboard/bounties') ? 'var(--primary)' : 'var(--ink)', textDecoration: 'none', fontWeight: '500', fontSize: '18px' }}>Bounty Panel</a>
            {isAdmin && (
              <a href="/admin" onClick={closeMenu} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', fontSize: '18px' }}>Control Panel</a>
            )}
          </nav>

          <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: '4px 0' }} />

          {session ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--mute)' }}>🔔 Notifications</span>
              </div>
              <button 
                onClick={(e) => { handleLogout(e); closeMenu(); }} 
                style={{
                  background: 'transparent', 
                  border: '1px solid var(--hairline)', 
                  color: 'var(--body)',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="/login" onClick={closeMenu} style={{ color: 'var(--body)', textDecoration: 'none', fontWeight: '500', fontSize: '16px', textAlign: 'center', padding: '10px' }}>Log in</a>
              <a href="/signup" onClick={closeMenu} style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: '600',
                fontSize: '16px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}>
                Get Started
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
