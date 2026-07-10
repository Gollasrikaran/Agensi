import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  type: 'login' | 'signup';
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
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
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: '#34d399', marginBottom: '1rem' }}>{success}</div>}
      
      <div className="form-group">
        <label>Email</label>
        <input 
          type="email" 
          placeholder="you@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '1rem' }}
        disabled={loading}
      >
        {loading ? 'Processing...' : (type === 'login' ? 'Login' : 'Sign Up')}
      </button>
    </form>
  );
}
