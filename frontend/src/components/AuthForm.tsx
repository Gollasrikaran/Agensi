import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function AuthForm({ type, onSuccess }: AuthFormProps) {
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
          
        if (onSuccess) {
          onSuccess();
        } else if (adminData) {
          window.location.href = '/admin'; // Redirect admin to admin panel
        } else {
          const oauthRedirect = sessionStorage.getItem('oauth_redirect');
          if (oauthRedirect) {
            sessionStorage.removeItem('oauth_redirect');
            window.location.href = oauthRedirect;
          } else {
            window.location.href = '/dashboard/buyer'; // Redirect user to buyer dashboard
          }
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

  const handleOAuth = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: onSuccess ? window.location.href : window.location.origin + '/dashboard/buyer'
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
            style={{ width: '100%', background: '#fff', border: '1px solid var(--hairline)', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Google
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
