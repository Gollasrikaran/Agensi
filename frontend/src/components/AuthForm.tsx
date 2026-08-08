import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

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
        const domain = email.split('@')[1]?.toLowerCase();
        const disposableDomains = [
          'yopmail.com', 'mailinator.com', '10minutemail.com', 'tempmail.com',
          'guerrillamail.com', 'throwawaymail.com', 'temp-mail.org', 'temp-mail.io',
          'fakemail.net', 'tempmailaddress.com', 'nada.ltd', 'getnada.com',
          'dispostable.com', 'maildrop.cc', 'sharklasers.com', 'guerillamail.info',
          'guerillamail.biz', 'guerillamail.com', 'guerillamail.de', 'guerillamail.net',
          'guerillamail.org', 'guerillamailblock.com', 'pokemail.net', 'spam4.me', 'grr.la',
          'mail.ru', 'tempail.com', 'mohmal.com', 'trashmail.com'
        ];
        
        if (domain && disposableDomains.includes(domain)) {
          throw new Error('Temporary or disposable email addresses are not allowed.');
        }

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Account created successfully! You can now log in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        const userId = data.user.id;
        const { data: adminData } = await supabase.from('admins').select('id').eq('id', userId).maybeSingle();
          
        if (onSuccess) {
          onSuccess();
        } else if (adminData) {
          window.location.href = '/admin';
        } else {
          const oauthRedirect = sessionStorage.getItem('oauth_redirect');
          if (oauthRedirect) {
            sessionStorage.removeItem('oauth_redirect');
            window.location.href = oauthRedirect;
          } else {
            window.location.href = '/dashboard/buyer';
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard/buyer' },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500 font-medium">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-500 font-medium">{success}</div>}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition-all hover:bg-zinc-900 hover:border-zinc-700",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.07 24.07 0 0 0 0 21.56l7.98-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {loading ? 'Redirecting...' : (type === 'login' ? 'Continue with Google' : 'Sign up with Google')}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>
        
        {mode === 'default' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              {type === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setMode('forgot_password')}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (mode === 'forgot_password' ? 'Send Reset Link' : (type === 'login' ? 'Sign In' : 'Create Account'))}
        </button>

        {mode === 'forgot_password' && (
          <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={() => { setMode('default'); setError(''); setSuccess(''); }}
              className="text-sm text-zinc-400 hover:text-zinc-300"
            >
              ← Back to Login
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
