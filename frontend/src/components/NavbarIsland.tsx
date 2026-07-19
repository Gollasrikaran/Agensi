import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ThemeToggleIsland from './ThemeToggleIsland';

export default function NavbarIsland() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      // Check if user exists in the admins table
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) setIsAdmin(true);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="logo">
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Bodhic AI Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }} />
          <span>Bodhic<strong>AI</strong></span>
        </a>
      </div>
      
      {/* Desktop Navigation */}
      <nav className={`desktop-nav ${isMenuOpen ? 'mobile-open' : ''}`} style={{
        display: isMenuOpen ? 'flex' : undefined,
        flexDirection: isMenuOpen ? 'column' : undefined,
        position: isMenuOpen ? 'absolute' : undefined,
        top: isMenuOpen ? '64px' : undefined,
        left: isMenuOpen ? '0' : undefined,
        right: isMenuOpen ? '0' : undefined,
        background: isMenuOpen ? 'var(--nav-bg)' : undefined,
        padding: isMenuOpen ? 'var(--space-md)' : undefined,
        borderBottom: isMenuOpen ? '1px solid var(--hairline)' : undefined,
        backdropFilter: isMenuOpen ? 'saturate(180%) blur(12px)' : undefined,
        zIndex: isMenuOpen ? 99 : undefined
      }}>
        <a href="/browse">Browse Skills</a>
        <a href="/sell">Sell a Skill</a>
        <a href="/pricing">Pricing</a>
        {isAdmin && <a href="/admin" className="badge success">Admin</a>}
        {session && <a href="/dashboard/buyer">Buyer</a>}
        {session && <a href="/dashboard/seller">Seller</a>}
        {session && <a href="/dashboard/wallet">Wallet</a>}
        {session && <a href="/dashboard/profile">Profile</a>}
      </nav>

      <div className="auth-buttons">
        <ThemeToggleIsland />
        {session ? (
          <button onClick={handleLogout} className="btn btn-secondary desktop-only">Logout</button>
        ) : (
          <>
            <a href="/login" className="btn btn-secondary desktop-only">Login</a>
            <a href="/signup" className="btn btn-primary desktop-only">Sign Up</a>
          </>
        )}
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            cursor: 'pointer',
            padding: '4px',
            display: 'none' // will be shown via CSS media query
          }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
