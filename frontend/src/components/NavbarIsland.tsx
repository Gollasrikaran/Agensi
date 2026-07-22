import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ThemeToggleIsland from './ThemeToggleIsland';

export default function NavbarIsland() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Handle scroll for glassmorphism effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
        fetchUserData(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
        fetchUserData(session.user.id);
      } else {
        setIsAdmin(false);
        setUserData(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: isScrolled ? 'var(--bg-glass)' : 'transparent',
    backdropFilter: isScrolled ? 'var(--glass-blur)' : 'none',
    borderBottom: isScrolled ? 'var(--glass-border)' : '1px solid transparent',
    transition: 'var(--transition-smooth)',
  };

  return (
    <header style={navStyle}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: 'var(--accent-glow)'
          }}>
            B
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Bodhic<span style={{ color: 'var(--accent-primary)' }}>AI</span>
          </span>
        </a>
      </div>
      
      {/* Center: Links */}
      <nav style={{ display: 'flex', gap: '24px', fontWeight: '500', fontSize: '14px' }}>
        <a href="/browse" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Browse</a>
        <a href="/requests" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Request</a>
        <a href="/sell" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Sell a Skill</a>
        <a href="/mcp" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MCP</a>
        <a href="/dashboard/buyer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</a>
        {isAdmin && (
          <a href="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Control Panel</a>
        )}
      </nav>

      {/* Right: Search & Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search skills..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
              }
            }}
            style={{
              background: 'var(--bg-tertiary)',
              border: 'var(--glass-border)',
              borderRadius: 'var(--border-radius-pill)',
              padding: '8px 12px 8px 36px',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '200px',
              fontSize: '13px'
            }}
          />
          <div style={{ 
            position: 'absolute', 
            right: '12px', 
            background: 'var(--bg-secondary)', 
            border: 'var(--glass-border)',
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '10px',
            color: 'var(--text-muted)'
          }}>
            ⌘K
          </div>
        </div>

        <ThemeToggleIsland />

        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>🔔</span>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <a href="/dashboard/profile">
                <img 
                  src={userData?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${userData?.username || 'U'}`} 
                  alt="Avatar" 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%',
                    border: '2px solid var(--ring-standard)', // Defaulting to standard ring for now
                    background: 'var(--bg-tertiary)'
                  }} 
                />
              </a>
            </div>
            <button 
              onClick={handleLogout} 
              style={{
                background: 'transparent', 
                border: 'var(--glass-border)', 
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-pill)',
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
            <a href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }}>Log in</a>
            <a href="/signup" style={{
              background: 'var(--accent-gradient)',
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-pill)',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: 'var(--accent-glow)'
            }}>
              Get Started
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
