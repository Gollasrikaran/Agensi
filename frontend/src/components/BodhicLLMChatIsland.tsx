import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function BodhicLLMChatIsland({ skillId }: { skillId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
        throw new Error("You must be logged in to test this skill.");
      }

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/agents/web-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ skill_id: skillId, message: userMessage })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-md)' }}>
      {!isOpen ? (
        <button className="btn btn-primary btn-lg" onClick={() => setIsOpen(true)} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          <span>✨</span> Test with Bodhic LLM (-10 Credits)
        </button>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: 'var(--space-md)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Bodhic LLM</h3>
                <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: '10px' }}>-10 Credits / MSG</span>
            </div>
            <button className="btn" onClick={() => setIsOpen(false)} style={{ padding: '4px 8px', fontSize: '12px' }}>Close</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--mute)', margin: 'auto' }}>
                <p>Send a message to test this skill's capabilities.</p>
                <p style={{ fontSize: '12px' }}>This will deduct 10 Bodhic Credits per response.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--canvas-soft)', 
                  color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  maxWidth: '80%',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  fontSize: '15px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'var(--canvas-soft)', padding: '12px 16px', borderRadius: '12px', color: 'var(--mute)' }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {error && <div style={{ padding: '8px var(--space-md)', color: 'var(--error)', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}
          
          <form onSubmit={handleSend} style={{ display: 'flex', padding: 'var(--space-md)', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', gap: '8px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask something..." 
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--canvas)', color: 'var(--ink)' }}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
