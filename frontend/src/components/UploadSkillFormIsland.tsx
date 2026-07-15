import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { value: 'development', label: 'Development' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'design', label: 'Design' },
  { value: 'automation', label: 'Automation' },
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'security', label: 'Security' },
  { value: 'legal', label: 'Legal' },
  { value: 'general', label: 'General' },
];

export default function UploadSkillFormIsland() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; content: React.ReactNode } | null>(null);
  const [appealMsg, setAppealMsg] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check session on load and redirect if not logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/signup';
      }
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => 
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const handleAppeal = async () => {
    if (!appealMsg) {
      alert('Please enter a message.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('http://localhost:8000/api/users/me/appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: appealMsg })
      });
      if (res.ok) {
        alert("Appeal submitted successfully. The admin will review it.");
        setAppealMsg('');
      } else {
        const errData = await res.json();
        alert("Failed to submit appeal: " + (errData.detail || "Unknown error"));
      }
    } catch (e) {
      alert("Error submitting appeal.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a .md file to upload.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject("Error reading file");
        reader.readAsText(file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/signup';
        return;
      }

      const res = await fetch('http://localhost:8000/api/skills/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          content,
          base_price_inr: parseFloat(price),
          billing_type: 'one-time',
          categories: selectedCategories
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsBlocked(false);
        setResult({
          success: true,
          content: (
            <>
              <h3 style={{ color: 'var(--success)', marginBottom: 'var(--space-xs)' }}>✓ Upload Successful</h3>
              <p style={{ color: 'var(--body)', fontSize: '14px' }}>Your skill passed all security checks and is now live on the marketplace.</p>
            </>
          )
        });
      } else {
        if (res.status === 403) {
          const blockMsg = data.detail?.message || data.detail || "Account Blocked";
          setIsBlocked(true);
          setResult({
            success: false,
            content: (
              <>
                <h3 style={{ color: 'var(--error)', marginBottom: 'var(--space-xs)' }}>Account Blocked</h3>
                <p style={{ color: 'var(--body)', fontSize: '14px' }}>{blockMsg}</p>
              </>
            )
          });
        } else {
          const issuesList = data.detail?.scan?.issues?.map((i: any, idx: number) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{i.rule}: {i.description}</li>
          )) || null;
          setIsBlocked(false);
          setResult({
            success: false,
            content: (
              <>
                <h3 style={{ color: 'var(--error)', marginBottom: 'var(--space-xs)' }}>Security Scan Failed</h3>
                <p style={{ color: 'var(--body)', fontSize: '14px' }}>{data.detail?.message || 'Warning'}</p>
                {issuesList && (
                  <ul style={{ marginLeft: 'var(--space-lg)', marginTop: 'var(--space-sm)', fontSize: '13px', color: 'var(--body)' }}>
                    {issuesList}
                  </ul>
                )}
              </>
            )
          });
        }
      }
    } catch (err) {
      console.error(err);
      setResult({
        success: false,
        content: <p style={{ color: 'var(--error)' }}>An unexpected error occurred.</p>
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--space-xl)' }}>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Skill Title</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. Postgres Expert Agent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Short Description</label>
          <textarea 
            required 
            rows={3} 
            placeholder="What does this agent skill do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)', resize: 'vertical' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }} ref={dropdownRef}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Domains / Categories</label>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '5px', minHeight: '42px', alignItems: 'center'
            }}
          >
            {selectedCategories.length === 0 ? (
              <span style={{ color: 'var(--mute)' }}>Select categories...</span>
            ) : (
              selectedCategories.map(cat => {
                const label = CATEGORIES.find(c => c.value === cat)?.label;
                return (
                  <span key={cat} style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label}
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '16px', lineHeight: 1 }}
                    >
                      &times;
                    </button>
                  </span>
                );
              })
            )}
          </div>
          
          {isDropdownOpen && (
            <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: '4px', background: 'var(--canvas)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              {CATEGORIES.map(category => (
                <div 
                  key={category.value}
                  onClick={() => toggleCategory(category.value)}
                  style={{ 
                    padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    background: selectedCategories.includes(category.value) ? 'var(--canvas-soft)' : 'transparent',
                    fontSize: '14px',
                    color: 'var(--ink)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--canvas-soft-2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = selectedCategories.includes(category.value) ? 'var(--canvas-soft)' : 'transparent'}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(category.value)} 
                    readOnly
                    style={{ cursor: 'pointer', margin: 0, width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <span style={{ lineHeight: 1 }}>{category.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Base Price (INR)</label>
          <input 
            type="number" 
            required 
            min="0" 
            step="1" 
            placeholder="500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Skill Content (.md File)</label>
          <input 
            type="file" 
            accept=".md" 
            required 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ padding: 'var(--space-sm)', height: 'auto', width: '100%' }} 
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-sm)' }} disabled={loading}>
          {loading ? 'Scanning...' : 'Upload & Scan →'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div className="card" style={{ 
            background: result.success ? 'var(--success-soft)' : 'var(--error-soft)', 
            borderColor: result.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            padding: 'var(--space-md)'
          }}>
            {result.content}
          </div>

          {/* Appeal form rendered outside result.content so appealMsg state updates correctly */}
          {isBlocked && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <h4 style={{ marginBottom: 'var(--space-xs)', fontSize: '16px' }}>Submit an Appeal</h4>
              <textarea
                rows={3}
                style={{ width: '100%', background: 'var(--canvas-soft-2)', border: '1px solid var(--hairline)', color: 'var(--ink)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', marginBottom: '10px', resize: 'vertical', boxSizing: 'border-box' }}
                placeholder="Explain your situation..."
                value={appealMsg}
                onChange={(e) => setAppealMsg(e.target.value)}
              />
              <button type="button" onClick={handleAppeal} className="btn btn-primary btn-sm">Submit Appeal</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
