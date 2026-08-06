import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserCircle2, Bell, Search, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NavbarIsland() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        fetchUserData(s.user.id);
        checkAdminStatus(s.user.id);
        fetchNotifications(s.access_token);
      }
    });

    const subscription = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        setSession(s);
        fetchUserData(s.user.id);
        checkAdminStatus(s.user.id);
        fetchNotifications(s.access_token);
      } else {
        setSession(null);
        setUserData(null);
        setIsAdmin(false);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.data.subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${session.user.id}` 
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      }).subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    if (isMenuOpen || isNotifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    } catch (e) {}
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
    } catch (e) {}
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase.from('admins').select('id').eq('id', userId).maybeSingle();
      if (data) setIsAdmin(true);
    } catch (err) {}
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data } = await supabase.from('users').select('username, avatar_url').eq('id', userId).maybeSingle();
      if (data) setUserData(data);
    } catch (err) {}
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header 
      ref={menuRef}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled || isMenuOpen ? "border-b border-white/10 bg-zinc-950/80 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Logo */}
        <div className="flex items-center">
          <a href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <img src="/logo.png" alt="BodhicAI" className="h-8 w-8 rounded-lg object-cover shadow-lg shadow-indigo-500/20" />
            <span className="text-xl font-bold tracking-tight text-zinc-100">
              Bodhic<span className="text-indigo-500">AI</span>
            </span>
          </a>
        </div>

        {/* Center: Desktop Links */}
        <nav className="hidden items-center gap-6 md:flex">
          {[
            { label: 'Browse', path: '/browse' },
            { label: 'Create Skill', path: '/sell' },
            { label: 'Requests', path: '/requests' },
            { label: 'Guides', path: '/guides' },
            { label: 'MCP', path: '/mcp' }
          ].map(item => (
            <a 
              key={item.path} 
              href={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-indigo-400",
                currentPath.startsWith(item.path) ? "text-indigo-400" : "text-zinc-400"
              )}
            >
              {item.label}
            </a>
          ))}
          {session && (
            <a href="/dashboard/buyer" className="text-sm font-medium text-zinc-400 transition-colors hover:text-indigo-400">Dashboard</a>
          )}
          {isAdmin && (
            <a href="/admin" className="text-sm font-semibold text-amber-500 hover:text-amber-400">Control Panel</a>
          )}
        </nav>

        {/* Right: Search & Auth */}
        <div className="flex items-center gap-4">
          
          {/* Desktop Search */}
          <div className="relative hidden items-center md:flex">
            <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search skills..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                  window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                }
              }}
              className="h-9 w-48 rounded-full border border-zinc-800 bg-zinc-900/50 pl-9 pr-12 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="absolute right-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
              ⌘K
            </div>
          </div>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-zinc-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-2xl">
                      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                        <h3 className="font-semibold text-zinc-100">Notifications</h3>
                        <a href="/notifications" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">View All</a>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-center text-sm text-zinc-500">No notifications yet.</p>
                        ) : (
                          notifications.slice(0, 10).map((n: any) => (
                            <div 
                              key={n.id} 
                              onClick={() => markNotificationRead(n.id, n.link)}
                              className={cn(
                                "mb-1 flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-zinc-800/50",
                                !n.is_read && "bg-zinc-800/30"
                              )}
                            >
                              <div className="mt-0.5 text-lg">
                                {n.type === 'success' ? '🟢' : n.type === 'error' ? '🔴' : n.type === 'bounty' ? '🏆' : '🔵'}
                              </div>
                              <div>
                                <div className={cn("text-sm text-zinc-100", !n.is_read && "font-semibold")}>{n.title}</div>
                                <div className="mt-1 text-xs text-zinc-400">{n.message}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <a href="/dashboard/profile" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 transition-transform hover:scale-105">
                  {userData?.avatar_url ? (
                    <img src={userData.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-6 w-6 text-zinc-400" />
                  )}
                </a>

                {/* Logout */}
                <button 
                  onClick={handleLogout}
                  className="rounded-full border border-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-sm font-medium text-zinc-300 hover:text-white">Log in</a>
                <a href="/signup" className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-500">
                  Get Started
                </a>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-4">
            {session && (
              <a href="/dashboard/profile" className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                {userData?.avatar_url ? (
                  <img src={userData.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-5 w-5 text-zinc-400" />
                )}
              </a>
            )}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-zinc-300 hover:text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full w-full border-b border-zinc-800 bg-zinc-950 px-4 py-4 md:hidden shadow-2xl">
          <div className="relative mb-6 flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search skills..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                  window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                  closeMenu();
                }
              }}
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            />
          </div>

          <nav className="flex flex-col gap-4 mb-6">
            <a href="/browse" onClick={closeMenu} className="text-base font-medium text-zinc-300">Browse</a>
            <a href="/requests" onClick={closeMenu} className="text-base font-medium text-zinc-300">Requests</a>
            <a href="/sell" onClick={closeMenu} className="text-base font-medium text-zinc-300">Create a Skill</a>
            <a href="/guides" onClick={closeMenu} className="text-base font-medium text-zinc-300">Guides</a>
            <a href="/mcp" onClick={closeMenu} className="text-base font-medium text-zinc-300">MCP</a>
            {session && <a href="/dashboard/buyer" onClick={closeMenu} className="text-base font-medium text-indigo-400">Dashboard</a>}
          </nav>

          <div className="border-t border-zinc-800 pt-4">
            {session ? (
              <button 
                onClick={(e) => { handleLogout(e); closeMenu(); }}
                className="w-full rounded-lg border border-zinc-800 py-2.5 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <a href="/login" onClick={closeMenu} className="w-full rounded-lg border border-zinc-800 py-2.5 text-center text-sm font-medium text-zinc-300">Log in</a>
                <a href="/signup" onClick={closeMenu} className="w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white shadow-lg">Get Started</a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
