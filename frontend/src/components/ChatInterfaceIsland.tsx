import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE } from '../lib/config';
import AuthForm from './AuthForm';
import { ArrowLeft, Send, Paperclip, X, Bot, Diamond, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const renderMessageContent = (content: string) => {
  const fileRegex = /<file name="([^"]+)">([\s\S]*?)<\/file>/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = fileRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'file', name: match[1], content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.substring(lastIndex) });
  }

  return (
    <div className="flex flex-col gap-4">
      {parts.map((part, i) => {
        if (part.type === 'file') {
          return (
            <div key={i} className="border border-zinc-700 rounded-lg overflow-hidden my-2 bg-zinc-950">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700 text-xs font-mono text-zinc-300">
                <span className="flex items-center gap-2"><Paperclip size={14}/> {part.name}</span>
                <button 
                  onClick={() => {
                    const blob = new Blob([part.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = part.name;
                    a.click();
                  }}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Download
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-96">
                {part.content}
              </pre>
            </div>
          );
        }
        
        const textSegments = part.content.split(/```(\w*)\n([\s\S]*?)```/g);
        return (
          <div key={i}>
            {textSegments.map((seg, idx) => {
              if (idx % 3 === 2) {
                return (
                  <pre key={idx} className="bg-zinc-950 p-3 rounded-lg overflow-x-auto text-xs font-mono text-indigo-300 my-2 border border-zinc-800">
                    {seg}
                  </pre>
                );
              } else if (idx % 3 === 0) {
                return <span key={idx}>{seg}</span>;
              }
              return null;
            })}
          </div>
        );
      })}
    </div>
  );
};

export default function ChatInterfaceIsland({ skillId, skillTitle }: { skillId: string, skillTitle: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [skillData, setSkillData] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load memory on mount if it exists for this skill
  useEffect(() => {
    const savedMemory = localStorage.getItem(`bodhic_chat_memory_${skillId}`);
    if (savedMemory) {
      try {
        const parsed = JSON.parse(savedMemory);
        if (parsed.enabled) {
          setIsMemoryEnabled(true);
          if (parsed.messages && parsed.messages.length > 0) {
            setMessages(parsed.messages);
          }
        }
      } catch (e) {
        console.error("Failed to parse chat memory", e);
      }
    }
  }, [skillId]);

  // Save memory whenever messages or toggle changes
  useEffect(() => {
    if (isMemoryEnabled) {
      localStorage.setItem(`bodhic_chat_memory_${skillId}`, JSON.stringify({
        enabled: true,
        messages: messages
      }));
    } else {
      localStorage.removeItem(`bodhic_chat_memory_${skillId}`);
    }
  }, [messages, isMemoryEnabled, skillId]);

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
    if ((!input.trim() && selectedFiles.length === 0) || loading) return;

    const userMessage = input.trim();
    setInput('');
    const currentFiles = [...selectedFiles];
    setSelectedFiles([]);
    
    let contentStr = userMessage;
    if (currentFiles.length > 0) {
      contentStr += `\n[Attached ${currentFiles.length} file(s)]`;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: contentStr }]);
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

      const formData = new FormData();
      formData.append('skill_id', skillId);
      formData.append('message', userMessage);
      formData.append('history', JSON.stringify(messages));
      
      currentFiles.forEach(f => {
        formData.append('files', f);
      });

      const res = await fetch(`${API_BASE}/api/agents/web-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to communicate with agent");
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <a href={`/skill/${skillId}`} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Skill
          </a>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <h1 className="text-base font-bold text-zinc-100 m-0 leading-tight">{skillTitle}</h1>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              Powered by BodhicAI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMemoryEnabled(!isMemoryEnabled)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold border-2 transition-all cursor-pointer shrink-0 shadow-sm",
                isMemoryEnabled 
                  ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-blue-500/20" 
                  : "bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700 hover:text-white"
              )}
              title={isMemoryEnabled ? "Memory is ON (Saved locally)" : "Memory is OFF (History clears on refresh)"}
            >
              <Bot className="h-3.5 w-3.5" /> 
              Memory {isMemoryEnabled ? 'ON' : 'OFF'}
            </button>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-400 border border-purple-500/20">
                <Zap className="h-3.5 w-3.5" /> Level {skillData?.complexity_level || 1}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Diamond className="h-3.5 w-3.5" /> {skillData ? ({1:10, 2:20, 3:40, 4:70, 5:100} as Record<number, number>)[skillData.complexity_level || 1] || ((skillData.complexity_level || 1) * 10) : '10-100'} CR / MSG
            </div>
            <a href={`/skill/${skillId}`} className="px-4 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800/50">Exit Chat</a>
        </div>
      </header>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 my-24 max-w-md mx-auto">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900/50 border border-zinc-800/50 mb-6 shadow-xl">
                  <img src="/logo.png" alt="BodhicAI" className="h-10 w-10 rounded" />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-200 mb-3">How can I help you?</h2>
                <p className="text-sm leading-relaxed text-zinc-400 mb-6">Ask any question or test this skill's capabilities. Each message deducts <strong className="text-zinc-300">{skillData ? ({1:10, 2:20, 3:40, 4:70, 5:100} as Record<number, number>)[skillData.complexity_level || 1] || ((skillData.complexity_level || 1) * 10) : '10-100'} Bodhic Credits</strong> based on its Level {skillData?.complexity_level || 1} rating.</p>
                {!userSession && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
                  >
                    Log In to Start Testing →
                  </button>
                )}
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-4 items-start", msg.role === 'user' ? "justify-end" : "justify-start")}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm mt-0.5 overflow-hidden">
                    <img src="/logo.png" alt="BodhicAI" className="h-full w-full object-cover" />
                  </div>
                )}
                
                <div className={cn(
                  "px-5 py-3.5 text-[15px] leading-relaxed shadow-sm max-w-[85%] whitespace-pre-wrap",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-[20px_20px_4px_20px]" 
                    : "bg-zinc-900 text-zinc-200 rounded-[4px_20px_20px_20px] border border-zinc-800"
                )}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4 items-start">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(99,102,241,0.2)] mt-0.5 overflow-hidden">
                  <img src="/logo.png" alt="BodhicAI" className="h-full w-full object-cover" />
                </div>
                <div className="px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-[4px_20px_20px_20px] flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-10" />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-10 pt-10">
        <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
                <span>{error}</span>
                {(!userSession || error.toLowerCase().includes("logged in") || error.toLowerCase().includes("auth")) && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="shrink-0 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-colors"
                  >
                    Log In Now →
                  </button>
                )}
              </div>
            )}
            
            {!userSession && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3.5 text-sm text-zinc-300 shadow-sm backdrop-blur-sm">
                <span className="flex items-center gap-2">
                  <span className="text-base">🔐</span> Please log in before chatting. Your session will be saved.
                </span>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="shrink-0 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-colors"
                >
                  Log In Now →
                </button>
              </div>
            )}
            
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2 px-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
                    <Paperclip className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSend} className="relative flex items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                    e.target.value = '';
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-4 z-10 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Message BodhicAI..." 
                    disabled={loading}
                    className="w-full rounded-[24px] border border-zinc-700 bg-zinc-900/80 py-4 pl-14 pr-16 text-[15px] text-zinc-100 placeholder:text-zinc-500 shadow-xl backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <button 
                    type="submit" 
                    disabled={loading || (!input.trim() && selectedFiles.length === 0)}
                    className={cn(
                      "absolute right-2 flex h-10 w-10 items-center justify-center rounded-full transition-all",
                      (input.trim() || selectedFiles.length > 0) 
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md" 
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                >
                    <Send className="h-4 w-4 ml-0.5" />
                </button>
            </form>
            <div className="mt-3 text-center text-xs text-zinc-500">
                AI can make mistakes. Consider verifying important information.
            </div>
        </div>
      </div>
      
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
            <button 
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-6 top-6 rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Bot className="h-6 w-6 text-indigo-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-zinc-100">Log In to Continue</h2>
              <p className="text-sm text-zinc-400">Sign in to test this skill without losing your chat session.</p>
            </div>
            <AuthForm type="login" onSuccess={() => { setShowAuthModal(false); setError(''); }} />
          </div>
        </div>
      )}
    </div>
  );
}
