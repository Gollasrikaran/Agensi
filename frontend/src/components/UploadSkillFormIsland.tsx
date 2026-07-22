import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';

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
  const [pricingModel, setPricingModel] = useState<'free' | 'paid'>('free');
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; content: React.ReactNode } | null>(null);
  const [appealMsg, setAppealMsg] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load draft on mount
  useEffect(() => {
    const draftStr = localStorage.getItem('skill_upload_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.price) setPrice(draft.price);
        if (draft.pricingModel) setPricingModel(draft.pricingModel);
        if (draft.selectedCategories) setSelectedCategories(draft.selectedCategories);
      } catch(e) {}
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    const draft = { title, description, price, pricingModel, selectedCategories };
    localStorage.setItem('skill_upload_draft', JSON.stringify(draft));
  }, [title, description, price, pricingModel, selectedCategories]);

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
    if (!appealMsg.trim()) {
      showToast('Please enter a message.', 'error');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: appealMsg })
      });
      if (res.ok) {
        showToast("Appeal submitted successfully. The admin will review it.", "success");
        setAppealMsg('');
      } else {
        const errData = await res.json();
        showToast("Failed to submit appeal: " + (errData.detail || "Unknown error"), "error");
      }
    } catch (e) {
      showToast("Error submitting appeal.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast("Please select a .md file to upload.", "error");
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

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/skills/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          content,
          base_price_inr: pricingModel === 'free' ? 0 : parseFloat(price) || 0,
          billing_type: 'one-time',
          categories: selectedCategories
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsBlocked(false);
        localStorage.removeItem('skill_upload_draft');
        setResult({
          success: true,
          content: (
            <>
              <h3 style={{ color: 'var(--success)', marginBottom: 'var(--space-xs)' }}>✓ Upload Successful</h3>
              <p style={{ color: 'var(--body)', fontSize: '14px' }}>Your skill passed all security checks and is now <strong>pending admin approval</strong>. It will appear publicly once an admin reviews and approves it.</p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Step 1: File Upload */}
        <div className="card" style={{ padding: 'var(--space-xl)', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--ink)' }}>1. Skill Content</h3>
          <p style={{ color: 'var(--body)', fontSize: '14px', marginBottom: '24px' }}>Upload your agent code (.zip) or instructions (.md). We will automatically scan it for security vulnerabilities.</p>
          
          <div style={{ 
            border: '2px dashed var(--hairline-strong)', 
            borderRadius: '12px', 
            padding: '40px 20px', 
            textAlign: 'center',
            background: 'var(--canvas-soft-2)',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
            position: 'relative'
          }}>
            <input 
              type="file" 
              accept=".md" 
              required 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.7 }}>📄</div>
            <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 500 }}>{file ? file.name : "Click or drag file to upload"}</p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--mute)' }}>Supports .md only (Max 5MB)</p>
          </div>
        </div>

        {/* Step 2: Details */}
        <div className="card" style={{ padding: 'var(--space-xl)', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--ink)' }}>2. Identity & Details</h3>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Skill Name *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Code Reviewer Pro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Summary *</label>
            <textarea 
              required 
              rows={3} 
              placeholder="One line describing what this skill does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }} ref={dropdownRef}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Categories</label>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '48px', alignItems: 'center'
              }}
            >
              {selectedCategories.length === 0 ? (
                <span style={{ color: 'var(--mute)' }}>Select categories...</span>
              ) : (
                selectedCategories.map(cat => {
                  const label = CATEGORIES.find(c => c.value === cat)?.label;
                  return (
                    <span key={cat} style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: '8px', background: 'var(--canvas)', border: '1px solid var(--hairline-strong)', borderRadius: '12px', maxHeight: '240px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                {CATEGORIES.map(category => (
                  <div 
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    style={{ 
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
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
                      style={{ cursor: 'pointer', margin: 0, width: '18px', height: '18px', flexShrink: 0, accentColor: 'var(--primary)' }}
                    />
                    <span style={{ lineHeight: 1 }}>{category.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Pricing */}
        <div className="card" style={{ padding: 'var(--space-xl)', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--ink)' }}>3. Pricing Model</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div 
              onClick={() => setPricingModel('free')}
              style={{ 
                padding: '20px', borderRadius: '12px', border: pricingModel === 'free' ? '2px solid var(--primary)' : '1px solid var(--hairline-strong)',
                background: pricingModel === 'free' ? 'var(--primary-soft)' : 'var(--canvas)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎁</div>
              <div style={{ fontWeight: 600, color: pricingModel === 'free' ? 'var(--primary)' : 'var(--ink)' }}>Free</div>
              <div style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px' }}>Available to all users</div>
            </div>
            
            <div 
              onClick={() => setPricingModel('paid')}
              style={{ 
                padding: '20px', borderRadius: '12px', border: pricingModel === 'paid' ? '2px solid var(--primary)' : '1px solid var(--hairline-strong)',
                background: pricingModel === 'paid' ? 'var(--primary-soft)' : 'var(--canvas)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
              <div style={{ fontWeight: 600, color: pricingModel === 'paid' ? 'var(--primary)' : 'var(--ink)' }}>Paid</div>
              <div style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px' }}>One-time purchase</div>
            </div>
          </div>

          {pricingModel === 'paid' && (
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Base Price (INR) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)' }}>₹</span>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  step="1" 
                  placeholder="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 36px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', background: 'var(--canvas)', color: 'var(--ink)', fontSize: '16px' }}
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: 600 }} disabled={loading}>
          {loading ? 'Scanning...' : 'Publish Skill →'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '0' }}>
          <div className="card" style={{ 
            background: result.success ? 'var(--success-soft)' : 'var(--error-soft)', 
            borderColor: result.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            padding: 'var(--space-md)'
          }}>
            {result.content}
          </div>

          {isBlocked && (
            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--canvas-soft)', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>Submit an Appeal</h4>
              <textarea
                rows={3}
                style={{ width: '100%', background: 'var(--canvas)', border: '1px solid var(--hairline)', color: 'var(--ink)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-sans)', marginBottom: '12px', resize: 'vertical' }}
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

