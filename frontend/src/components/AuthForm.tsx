import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  type: 'login' | 'signup';
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'default' | 'forgot_password'>('default');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/update-password',
        });
        if (error) throw error;
        setSuccess('Password reset link sent! Please check your email.');
        return;
      }

      if (type === 'signup' && password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess('Account created successfully! You can now log in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Check if user is an admin
        const userId = data.user.id;
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
          
        if (adminData) {
          window.location.href = '/admin'; // Redirect admin to admin panel
        } else {
          window.location.href = '/dashboard/buyer'; // Redirect user to buyer dashboard
        }
      }
    } catch (err: any) {
      if (err.message?.includes('rate limit') || err.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard/buyer'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred with OAuth.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</div>}
        
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        {mode === 'default' && (
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ marginBottom: 0 }}>Password</label>
              {type === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setMode('forgot_password')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'var(--mute)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Processing...' : (mode === 'forgot_password' ? 'Send Reset Link' : (type === 'login' ? 'Login' : 'Sign Up'))}
        </button>

        {mode === 'forgot_password' && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={() => { setMode('default'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--mute)', fontSize: '14px', cursor: 'pointer' }}
            >
              ← Back to Login
            </button>
          </div>
        )}
      </form>

      {mode === 'default' && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--mute)', fontSize: '14px', marginBottom: '1rem' }}>Or continue with</p>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button 
            onClick={() => handleOAuth('google')}
            className="btn" 
            style={{ width: '100%', background: 'var(--canvas)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)' }}
            type="button"
          >
            Google
          </button>
          <button 
            onClick={() => handleOAuth('github')}
            className="btn" 
            style={{ width: '100%', background: 'var(--ink)', border: '1px solid var(--ink)', color: 'var(--canvas)' }}
            type="button"
          >
            GitHub
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
