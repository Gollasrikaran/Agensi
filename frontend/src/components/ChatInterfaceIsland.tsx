import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE } from '../lib/config';
import AuthForm from './AuthForm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterfaceIsland({ skillId, skillTitle }: { skillId: string, skillTitle: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [skillData, setSkillData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/skills/${skillId}`)
      .then(res => res.json())
      .then(data => setSkillData(data))
      .catch(console.error);
  }, [skillId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserSession(session);
      if (session) {
        setShowAuthModal(false);
        setError('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to test this skill.");
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/agents/web-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          skill_id: skillId,
          message: userMessage,
          history: messages
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to communicate with agent");
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--canvas)', color: 'var(--ink)' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid var(--hairline)', background: 'var(--canvas-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href={`/skill/${skillId}`} style={{ color: 'var(--mute)', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            ← Back to Skill
          </a>
          <div style={{ height: '24px', width: '1px', background: 'var(--hairline)' }}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.5px' }}>{skillTitle}</h1>
            <span style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 8px var(--accent)' }}></span>
              Powered by BodhicAI
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: '6px 12px', background: 'var(--canvas-soft-2, #222)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius-pill)', fontSize: '12px', color: 'var(--accent, #a855f7)', fontWeight: 700 }}>
                ⚡ Level {skillData?.complexity_level || 1}
            </div>
            <div style={{ padding: '6px 12px', background: 'var(--success-soft)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-pill)', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                💎 {skillData ? ({1:10, 2:20, 3:40, 4:70, 5:100} as Record<number, number>)[skillData.complexity_level || 1] || ((skillData.complexity_level || 1) * 10) : '10-100'} CR / MSG
            </div>
            <a href={`/skill/${skillId}`} style={{ color: 'var(--mute)', textDecoration: 'none', fontSize: '14px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'color 0.2s' }}>Exit Chat</a>
        </div>
      </header>
      
      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '32px', scrollBehavior: 'smooth' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--mute)', margin: '100px auto', maxWidth: '400px' }}>
                <img src="/logo.png" alt="Bodhic" style={{ width: '80px', height: '80px', opacity: 0.5, marginBottom: '24px', filter: 'grayscale(100%) brightness(200%)' }} />
                <h2 style={{ color: 'var(--ink)', fontSize: '24px', marginBottom: '12px', fontWeight: 500 }}>How can I help you?</h2>
                <p style={{ lineHeight: 1.6, color: 'var(--body)' }}>Ask any question or test this skill's capabilities. Each message deducts <strong>{skillData ? ({1:10, 2:20, 3:40, 4:70, 5:100} as Record<number, number>)[skillData.complexity_level || 1] || ((skillData.complexity_level || 1) * 10) : '10-100'} Bodhic Credits</strong> based on its Level {skillData?.complexity_level || 1} rating.</p>
                {!userSession && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
                  >
                    Log In to Start Testing →
                  </button>
                )}
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <img src="/logo.png" alt="AI" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }} />
                )}
                
                <div style={{ 
                  background: msg.role === 'user' ? 'var(--grad-brand)' : 'var(--canvas-elevated)', 
                  color: msg.role === 'user' ? 'var(--on-primary)' : 'var(--ink)',
                  padding: '16px 20px', 
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px', 
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: '15px',
                  border: msg.role === 'assistant' ? '1px solid var(--hairline)' : 'none',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img src="/logo.png" alt="AI" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-glow)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ padding: '16px 20px', borderRadius: '4px 20px 20px 20px', background: 'var(--canvas-elevated)', border: '1px solid var(--hairline)', color: 'var(--mute)' }}>
                  <span style={{ display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }}>.</span>
                  <span style={{ display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}>.</span>
                  <span style={{ display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '40px' }} />
        </div>
      </div>
      
      {/* Input Area */}
      <div style={{ padding: '24px', background: 'linear-gradient(to top, var(--canvas) 50%, transparent 100%)', zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {error && (
              <div style={{ padding: '12px 16px', color: 'var(--error)', fontSize: '14px', background: 'var(--error-soft)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <span>{error}</span>
                {(!userSession || error.toLowerCase().includes("logged in") || error.toLowerCase().includes("auth")) && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(108, 60, 225, 0.3)' }}
                  >
                    Log In Now →
                  </button>
                )}
              </div>
            )}
            
            {!userSession && (
              <div style={{ padding: '10px 16px', background: 'var(--canvas-elevated)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔐</span> Please log in before chatting. Don't worry, your chat session stays right here!
                </span>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(108, 60, 225, 0.3)' }}
                >
                  Log In Now →
                </button>
              </div>
            )}
            
            <form onSubmit={handleSend} style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
                <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Message BodhicAI..." 
                    style={{ flex: 1, padding: '18px 60px 18px 24px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--hairline)', background: 'var(--canvas-soft-2)', color: 'var(--ink)', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'var(--shadow-md)' }}
                    disabled={loading}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--hairline)'}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    style={{ 
                        position: 'absolute', right: '8px', 
                        width: '44px', height: '44px', 
                        borderRadius: '50%', border: 'none', 
                        background: input.trim() ? 'var(--primary)' : 'var(--canvas-elevated)', 
                        color: input.trim() ? 'var(--on-primary)' : 'var(--mute)',
                        cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </form>
            <div style={{ textAlign: 'center', margin: '12px 0 0', fontSize: '12px', color: 'var(--mute)' }}>
                AI can make mistakes. Consider verifying important information.
            </div>
        </div>
      </div>
      
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px', position: 'relative', background: 'var(--canvas-elevated)', borderRadius: '24px', border: '1px solid var(--hairline-strong)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              type="button"
              onClick={() => setShowAuthModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--mute)', fontSize: '20px', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src="/logo.png" alt="Bodhic" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '12px' }} />
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>Log In to Continue</h2>
              <p style={{ color: 'var(--body)', fontSize: '14px', margin: 0 }}>Sign in to test this skill without losing your chat session.</p>
            </div>
            <AuthForm type="login" onSuccess={() => { setShowAuthModal(false); setError(''); }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
        @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
