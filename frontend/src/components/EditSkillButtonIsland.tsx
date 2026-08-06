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
      <div className="bg-indigo-500/10 border border-indigo-500/30 px-5 py-3 rounded-2xl flex justify-between items-center mb-6 shadow-lg shadow-indigo-500/5">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <span className="text-lg">👑</span>
          <span>You are the creator of this skill</span>
        </div>
        <button 
          onClick={() => setEditing(true)} 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Edit Skill Details ✏️
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900 w-full max-w-xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditing(false)}
              className="absolute top-4 right-4 bg-transparent border-none text-zinc-400 hover:text-zinc-100 cursor-pointer text-2xl leading-none transition-colors"
            >
              ×
            </button>
            <h2 className="text-2xl mb-2 text-zinc-100 font-semibold">Edit Skill Details</h2>
            <p className="text-zinc-400 text-sm mb-6">Update marketing metadata for "{skill.title}". Note: Skill code file cannot be modified to protect buyer security and maintain scan integrity.</p>
            
            <form onSubmit={saveEdit} className="flex flex-col gap-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-zinc-100">Title</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                  required 
                  className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-zinc-100">Description</label>
                <textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                  required 
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-y"
                />
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-zinc-100">Price (INR ₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editForm.base_price_inr} 
                    onChange={(e) => setEditForm({...editForm, base_price_inr: parseFloat(e.target.value) || 0})} 
                    required 
                    className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-zinc-100">Category</label>
                  <select 
                    value={editForm.category} 
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-zinc-100">Target Audience</label>
                <select 
                  value={editForm.target_audience} 
                  onChange={(e) => setEditForm({...editForm, target_audience: e.target.value})}
                  className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="all">All (General Audience)</option>
                  <option value="student">Students</option>
                  <option value="professional">Professionals</option>
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setEditing(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50"
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
