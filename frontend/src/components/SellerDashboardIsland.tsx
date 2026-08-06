import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import ReferralShareCardIsland from './ReferralShareCardIsland';
import { CheckCircle2, XCircle, AlertCircle, Edit2, ShieldAlert, ArrowRight, Wallet, Activity, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

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

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-24 bg-zinc-800 rounded-xl"></div><div className="h-64 bg-zinc-800 rounded-xl"></div></div>;
  if (error) return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500">Error: {error}</div>;

  const freeSkillsCount = skills.filter(s => s.base_price_inr === 0).length;
  const isMonetizationUnlocked = freeSkillsCount >= 2;
  const progressPercent = Math.min(100, (freeSkillsCount / 2) * 100);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100">Your Sales & Assets</h2>
        <a 
          href="/dashboard/buyer" 
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <span>Switch to Buyer Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <ReferralShareCardIsland />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Available Balance</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-100">₹{balance.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Skills</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-100">{skills.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Completed Bounties</h3>
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-100">{bountyClaims.length}</div>
        </div>
      </div>

      {/* Monetization Progress */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Creator Monetization Status</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Publish 2 free skills to build trust and unlock the ability to sell paid skills.
        </p>
        <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-950">
          <div 
            className={cn("h-full transition-all duration-500", isMonetizationUnlocked ? "bg-emerald-500" : "bg-indigo-500")}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-500">{freeSkillsCount} Free Skills Published</span>
          <span className={isMonetizationUnlocked ? "text-emerald-500 flex items-center gap-1" : "text-zinc-500"}>
            {isMonetizationUnlocked ? <><CheckCircle2 className="h-3 w-3" /> Monetization Unlocked</> : "2 Required"}
          </span>
        </div>
      </div>

      {/* Listed Skills */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="border-b border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Your Listed Skills</h2>
        </div>
        
        {skills.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            You haven't listed any skills yet. <a href="/sell" className="font-medium text-indigo-400 hover:text-indigo-300">Sell your first skill</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Listed On</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-transparent">
                {skills.map((skill: any) => (
                  <tr key={skill.id} className="transition-colors hover:bg-zinc-800/20">
                    <td className="px-6 py-4 font-medium text-zinc-100">{skill.title}</td>
                    <td className="px-6 py-4 text-zinc-300">₹{skill.base_price_inr ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                        skill.moderation_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        skill.moderation_status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                      )}>
                        {skill.moderation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(skill.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditModal(skill)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                        {skill.moderation_status === 'approved' && (
                          <button 
                            onClick={() => setDmcaSkill({id: skill.id, title: skill.title})}
                            className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" /> DMCA
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bounties & Payouts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Bounties */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-100">Approved Bounties</h2>
          </div>
          {bountyClaims.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              You haven't completed any bounties yet. <a href="/requests" className="font-medium text-indigo-400 hover:text-indigo-300">Browse Open Bounties</a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Bounty Title</th>
                    <th className="px-6 py-4 font-medium">Earned (80%)</th>
                    <th className="px-6 py-4 font-medium">Completed On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-transparent">
                  {bountyClaims.map((claim: any) => (
                    <tr key={claim.id} className="transition-colors hover:bg-zinc-800/20">
                      <td className="px-6 py-4 font-medium text-zinc-100">{claim.bounty?.title || 'Unknown'}</td>
                      <td className="px-6 py-4 text-emerald-400 font-medium">₹{(parseFloat(claim.bounty?.bounty_inr || '0') * 0.8).toFixed(2)}</td>
                      <td className="px-6 py-4">{new Date(claim.updated_at || claim.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* UPI & Payouts */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Payouts & Earnings</h2>
          <p className="text-sm text-zinc-400 mb-6">Payouts are processed automatically every week for balances above ₹1. Make sure your UPI ID is saved below.</p>
          
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-4 text-sm font-semibold text-zinc-200">UPI Settings</h3>
            <form onSubmit={saveUpi} className="flex flex-col gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={upiId} 
                  onChange={e => setUpiId(e.target.value)} 
                  required 
                  placeholder="e.g. name@okhdfcbank"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {savedUpi && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Currently saved: {savedUpi}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={savingUpi}
                className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingUpi ? 'Saving...' : (savedUpi ? 'Update UPI ID' : 'Save UPI ID')}
              </button>
            </form>
          </div>

          <div className="mt-6">
            <a href="/dashboard/wallet" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View Full Payout History <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Modals */}
      {dmcaSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <button 
              onClick={() => { setDmcaSkill(null); setDmcaMessage(''); }}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">Report Stolen Skill (DMCA)</h2>
            <p className="mb-6 text-sm text-zinc-400">
              Did you find "{dmcaSkill.title}" being distributed on another platform without permission? Submit the infringing URL below and our team will issue an automated legal takedown notice.
            </p>
            
            <form onSubmit={submitDmca} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Infringing URL</label>
                <input 
                  type="url" 
                  value={dmcaUrl} 
                  onChange={(e) => setDmcaUrl(e.target.value)} 
                  required 
                  placeholder="https://example.com/stolen-skill"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Submit Takedown Request
              </button>
              {dmcaMessage && (
                <div className="mt-2 rounded-md bg-zinc-900 p-3 text-sm font-medium text-emerald-400">
                  {dmcaMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {editingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingSkill(null)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-xl font-semibold text-zinc-100">Edit Skill Details</h2>
            
            <form onSubmit={saveSkillEdit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Title</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                  required 
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                  required 
                  rows={3}
                  className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Price (INR)</label>
                  <input 
                    type="number" 
                    value={editForm.base_price_inr} 
                    onChange={(e) => setEditForm({...editForm, base_price_inr: parseFloat(e.target.value) || 0})} 
                    required 
                    min="0"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Target Audience</label>
                  <select 
                    value={editForm.target_audience} 
                    onChange={(e) => setEditForm({...editForm, target_audience: e.target.value})} 
                    required
                    className="w-full appearance-none rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Everyone</option>
                    <option value="student">Students</option>
                    <option value="professional">Professionals</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Primary Category</label>
                <select 
                  value={editForm.category} 
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})} 
                  required
                  className="w-full appearance-none rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={savingEdit}
                className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
