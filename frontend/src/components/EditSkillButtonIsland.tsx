import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';

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

interface Props {
  skill: any;
}

export default function EditSkillButtonIsland({ skill }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: skill?.title || '',
    description: skill?.description || '',
    base_price_inr: skill?.base_price_inr || 0,
    category: (skill?.category || 'development').split(',')[0].trim(),
    target_audience: skill?.target_audience || 'all'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkOwnership();
  }, [skill]);

  const checkOwnership = async () => {
    if (!skill?.seller_id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user.id === skill.seller_id) {
      setIsOwner(true);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/skills/${skill.id}`, {
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
        showToast('Skill updated successfully!', 'success');
        setEditing(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json();
        showToast(`Error: ${data.detail || 'Failed to update skill'}`, 'error');
      }
    } catch (err) {
      showToast('Error updating skill', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <div style={{ background: 'var(--primary-soft)', border: '1px solid rgba(108, 60, 225, 0.3)', padding: '12px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 4px 15px rgba(108, 60, 225, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>
          <span style={{ fontSize: '18px' }}>👑</span>
          <span>You are the creator of this skill</span>
        </div>
        <button 
          onClick={() => setEditing(true)} 
          className="btn btn-primary" 
          style={{ padding: '6px 16px', fontSize: '13px', cursor: 'pointer' }}
        >
          Edit Skill Details ✏️
        </button>
      </div>

      {editing && (
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
              onClick={() => setEditing(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
            >
              ×
            </button>
            <h2 style={{ fontSize: '22px', marginBottom: '0.5rem', color: 'var(--ink)' }}>Edit Skill Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.5rem' }}>Update marketing metadata for "{skill.title}". Note: Skill code file cannot be modified to protect buyer security and maintain scan integrity.</p>
            
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
                  onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--hairline-strong)', color: 'var(--ink)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
