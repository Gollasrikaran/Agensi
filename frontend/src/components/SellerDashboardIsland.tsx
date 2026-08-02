import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import ReferralShareCardIsland from './ReferralShareCardIsland';

const CATEGORIES = [
  { value: 'automation', label: 'Automation' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'general', label: 'General' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'security', label: 'Security' }
];

export default function SellerDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [bountyClaims, setBountyClaims] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [upiId, setUpiId] = useState('');
  const [savedUpi, setSavedUpi] = useState<string | null>(null);
  const [savingUpi, setSavingUpi] = useState(false);
  const [dmcaSkill, setDmcaSkill] = useState<{id: string, title: string} | null>(null);
  const [dmcaUrl, setDmcaUrl] = useState('');
  const [dmcaMessage, setDmcaMessage] = useState('');
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', base_price_inr: 0, category: 'development', target_audience: 'all' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchListedSkills();
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/wallet`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setBalance(data.balance_inr || 0);
            setSavedUpi(data.upi_id || null);
            if (data.upi_id) setUpiId(data.upi_id);
        }
    } catch (e) {
        console.error("Failed to load wallet", e);
    }
  };

  const saveUpi = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!upiId || !upiId.includes('@')) {
          showToast('Please enter a valid UPI ID (e.g., name@bank)', 'error');
          return;
      }
      try {
          setSavingUpi(true);
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/upi`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ upi_id: upiId })
          });
          
          const data = await res.json();
          if (res.ok) {
              showToast('UPI ID saved successfully!', 'success');
              setSavedUpi(upiId);
          } else {
              showToast(`Error: ${data.detail}`, 'error');
          }
      } catch (e) {
          showToast('An error occurred while saving UPI ID.', 'error');
      } finally {
          setSavingUpi(false);
      }
  };

  const submitDmca = async (e: React.FormEvent) => {
    e.preventDefault();
    setDmcaMessage('');
    if (!dmcaSkill) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    try {
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/dmca`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ skill_id: dmcaSkill.id, infringing_url: dmcaUrl })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit DMCA request');
      
      setDmcaMessage('Request submitted successfully. Our team will review this shortly.');
      setTimeout(() => {
        setDmcaSkill(null);
        setDmcaUrl('');
        setDmcaMessage('');
      }, 3000);
    } catch (err: any) {
      setDmcaMessage(err.message);
    }
  };

  const openEditModal = (skill: any) => {
    setEditingSkill(skill);
    setEditForm({
      title: skill.title || '',
      description: skill.description || '',
      base_price_inr: skill.base_price_inr || 0,
      category: (skill.category || 'development').split(',')[0].trim(),
      target_audience: skill.target_audience || 'all'
    });
  };

  const saveSkillEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      setSavingEdit(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/skills/${editingSkill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          base_price_inr: Number(editForm.base_price_inr),
          category: editForm.category,
          target_audience: editForm.target_audience
        })
      });

      if (res.ok) {
        showToast('Skill details updated successfully!', 'success');
        setSkills(prev => prev.map(s => s.id === editingSkill.id ? { ...s, ...editForm, base_price_inr: Number(editForm.base_price_inr) } : s));
        setEditingSkill(null);
      } else {
        const data = await res.json();
        showToast(`Error: ${data.detail || 'Failed to update skill'}`, 'error');
      }
    } catch (err) {
      showToast('Error updating skill', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchListedSkills = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const [skillsRes, claimsRes] = await Promise.all([
        fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/skills`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/requests/claims/my-claims`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);
      
      if (!skillsRes.ok) throw new Error('Failed to fetch listed skills');
      
      setSkills(await skillsRes.json());
      
      if (claimsRes.ok) {
        const claims = await claimsRes.json();
        setBountyClaims(claims.filter((c: any) => c.status === 'accepted'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading seller dashboard...</div>;
  if (error) return <div className="glass-card" style={{ color: 'var(--error)' }}>Error: {error}</div>;

  return (
    <div className="seller-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>Seller Dashboard</h1>
        <a 
          href="/dashboard/buyer" 
          style={{ 
            background: 'var(--bg-tertiary)', 
            border: '1px solid var(--accent-deep)', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            color: 'var(--accent)',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
        >
          <span>Switch to Buyer Dashboard</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>

      <ReferralShareCardIsland />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Available Balance</h3>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-1px' }}>₹{balance.toFixed(2)}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Active Skills</h3>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)' }}>{skills.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Completed Bounties</h3>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ink)' }}>{bountyClaims.length}</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Your Listed Skills</h2>
        
        {skills.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            You haven't listed any skills yet. <a href="/sell" style={{ color: 'var(--accent-color)' }}>Sell your first skill</a>
          </p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Title</th>
                <th style={{ padding: '0.5rem' }}>Price</th>
                <th style={{ padding: '0.5rem' }}>Moderation Status</th>
                <th style={{ padding: '0.5rem' }}>Listed On</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill: any) => (
                <tr key={skill.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{skill.title}</td>
                  <td style={{ padding: '0.5rem' }}>₹{skill.base_price_inr ?? 0}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: skill.moderation_status === 'approved' ? 'var(--success-soft)' : (skill.moderation_status === 'rejected' ? '#7f1d1d' : 'var(--warning-soft)'),
                      color: skill.moderation_status === 'approved' ? 'var(--success)' : (skill.moderation_status === 'rejected' ? 'var(--error)' : 'var(--warning)')
                    }}>
                      {skill.moderation_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(skill.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      onClick={() => openEditModal(skill)}
                      style={{
                        background: 'var(--primary-soft)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Edit ✏️
                    </button>
                    {skill.moderation_status === 'approved' && (
                        <button 
                            onClick={() => setDmcaSkill({id: skill.id, title: skill.title})}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--error)',
                                color: 'var(--error)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Report Stolen Skill
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Approved Bounties</h2>
        
        {bountyClaims.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            You haven't completed any bounties yet. <a href="/requests" style={{ color: 'var(--accent-color)' }}>Browse Open Bounties</a>
          </p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Bounty Title</th>
                <th style={{ padding: '0.5rem' }}>Earned Amount (80%)</th>
                <th style={{ padding: '0.5rem' }}>Completed On</th>
              </tr>
            </thead>
            <tbody>
              {bountyClaims.map((claim: any) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{claim.bounty?.title || 'Unknown'}</td>
                  <td style={{ padding: '0.5rem' }}>₹{(parseFloat(claim.bounty?.bounty_inr || '0') * 0.8).toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(claim.updated_at || claim.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2>Payouts & Earnings</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1rem' }}>Payouts are processed automatically every week for balances above ₹1. Make sure your UPI ID is saved below.</p>
        
        {/* UPI Settings */}
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '0.5rem', marginTop: '1.5rem' }}>UPI Settings</h3>
        <form onSubmit={saveUpi} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <div>
                <input 
                    type="text" 
                    value={upiId} 
                    onChange={e => setUpiId(e.target.value)} 
                    required 
                    placeholder="e.g. name@okhdfcbank"
                    style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--hairline-strong)', 
                        background: 'var(--bg-tertiary)', 
                        color: 'var(--ink)'
                    }}
                />
                {savedUpi && (
                    <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '6px' }}>
                        ✓ Currently saved: {savedUpi}
                    </div>
                )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingUpi}>
                {savingUpi ? 'Saving...' : (savedUpi ? 'Update UPI ID' : 'Save UPI ID')}
            </button>
        </form>

        <a href="/dashboard/wallet" className="btn btn-secondary" style={{ textDecoration: 'none', marginTop: '1.5rem', display: 'inline-block' }}>View Full Payout History</a>
      </div>
      {dmcaSkill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => { setDmcaSkill(null); setDmcaMessage(''); }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Report Stolen Skill (DMCA)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              Did you find "{dmcaSkill.title}" being distributed on another platform without permission? Submit the infringing URL below and our team will issue an automated legal takedown notice.
            </p>
            
            <form onSubmit={submitDmca} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Infringing URL</label>
                <input 
                  type="url" 
                  value={dmcaUrl} 
                  onChange={(e) => setDmcaUrl(e.target.value)} 
                  required 
                  placeholder="https://example.com/stolen-skill"
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ background: 'var(--error)', width: '100%', border: 'none' }}
              >
                Submit DMCA Takedown Request
              </button>
              {dmcaMessage && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: dmcaMessage.includes('success') ? 'var(--success-soft)' : 'var(--error-soft)', color: dmcaMessage.includes('success') ? 'var(--success)' : 'var(--error)', borderRadius: '8px', fontSize: '14px' }}>
                  {dmcaMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {editingSkill && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '550px', background: 'var(--bg-secondary)', padding: '2rem', position: 'relative', border: '1px solid var(--hairline-strong)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setEditingSkill(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
            >
              ×
            </button>
            <h2 style={{ fontSize: '22px', marginBottom: '0.5rem', color: 'var(--ink)' }}>Edit Skill Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.5rem' }}>Update marketing metadata for "{editingSkill.title}". Note: Skill code file cannot be modified to protect buyer security and maintain scan integrity.</p>
            
            <form onSubmit={saveSkillEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Title</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Description</label>
                <textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                  required 
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Price (INR ₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editForm.base_price_inr} 
                    onChange={(e) => setEditForm({...editForm, base_price_inr: parseFloat(e.target.value) || 0})} 
                    required 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Category</label>
                  <select 
                    value={editForm.category} 
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontSize: '14px' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Target Audience</label>
                <select 
                  value={editForm.target_audience} 
                  onChange={(e) => setEditForm({...editForm, target_audience: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="all">All (General Audience)</option>
                  <option value="student">Students</option>
                  <option value="professional">Professionals</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingSkill(null)}
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingEdit}
                  style={{ flex: 2, padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: savingEdit ? 'not-allowed' : 'pointer', opacity: savingEdit ? 0.7 : 1 }}
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
