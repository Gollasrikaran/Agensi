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

  return (
    <header className="navbar">
      <div className="logo">
        <a href="/">Agensi<span className="highlight">Competitor</span></a>
      </div>
      <nav>
        <a href="/browse">Browse Skills</a>
        <a href="/sell">Sell a Skill</a>
        <a href="/pricing">Pricing</a>
        {isAdmin && <a href="/admin" style={{ color: '#fbbf24' }}>Admin Panel</a>}
        {session && <a href="/dashboard/buyer">Buyer Dashboard</a>}
        {session && <a href="/dashboard/seller">Seller Dashboard</a>}
      </nav>
      <div className="auth-buttons">
        <ThemeToggleIsland />
        {session ? (
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        ) : (
          <>
            <a href="/login" className="btn btn-secondary">Login</a>
            <a href="/signup" className="btn btn-primary">Sign Up</a>
          </>
        )}
      </div>
    </header>
  );
}
