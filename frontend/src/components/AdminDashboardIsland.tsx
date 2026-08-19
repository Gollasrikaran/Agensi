import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { showToast } from '../lib/toast';
import { Users, BookOpen, Banknote, ShieldAlert, Activity, CheckCircle2, XCircle, Search, RefreshCw, X, FileCode } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboardIsland() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [previewSkill, setPreviewSkill] = useState<any | null>(null);
  const [confirmSkillId, setConfirmSkillId] = useState<string | null>(null);
  const [confirmSkillAction, setConfirmSkillAction] = useState<'approved' | 'rejected' | null>(null);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);
  const [sweepLoading, setSweepLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        let errorMsg = 'Not authorized as admin or server error';
        try {
          const errData = await res.json();
          if (errData.detail) errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        } catch {
          const text = await res.text();
          if (text) errorMsg = `${errorMsg} (${res.status}: ${text.slice(0, 100)})`;
        }
        throw new Error(errorMsg);
      }
      
      const dashboardData = await res.json();
      setData(dashboardData);

      // Fetch appeals
      const appealsRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/appeals`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (appealsRes.ok) {
        setAppeals(await appealsRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to unblock user');
      
      showToast('User unblocked successfully!', 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const updateSkillStatus = async (skillId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/skills/${skillId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      showToast(`Skill ${status} successfully.`, 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setConfirmSkillId(null);
      setConfirmSkillAction(null);
    }
  };

  const completePayout = async (payoutId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/payouts/${payoutId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to complete payout');
      
      showToast('Payout marked as completed successfully!', 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const runSweep = async () => {
    try {
      setSweepLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/cron/sweep`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to run sweep');
      const result = await res.json();
      
      showToast(`Sweep complete! ${result.payouts_created} payouts created.`, 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSweepLoading(false);
    }
  };

  const generateUpiLink = (upiId: string, amount: number) => {
    // We use a generic Payee Name because user usernames might contain special characters 
    // that some UPI apps reject in the pn parameter.
    // CRITICAL: Do NOT encodeURIComponent the upiId! UPI apps expect the raw '@' symbol (pa=name@bank).
    // If encoded to '%40', the bank network will fail to find the account.
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent("BodhicAI Creator")}&am=${amount.toFixed(2)}&cu=INR`;
  };

  const fetchPreview = async (skillId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/skills/${skillId}/preview`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch preview');
      
      const data = await res.json();
      setPreviewSkill({ id: skillId, content: data.content });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const viewUserSkills = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users/${userId}/skills`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user skills');
      setUserSkills(await res.json());
      setViewingUser(userId);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium">Loading admin dashboard...</p>
    </div>
  );
  if (error) return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 text-center font-medium">
      <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-red-500" />
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-400">
            <Users className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Total Users</h3>
          </div>
          <p className="text-4xl font-black text-zinc-100">
            {data.stats.total_users || 0}
          </p>
        </div>
        
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-400">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Listed Skills</h3>
          </div>
          <p className="text-4xl font-black text-zinc-100">
            {data.stats.total_skills_listed || 0}
          </p>
        </div>
        
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-400">
            <Banknote className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Total Sales Volume</h3>
          </div>
          <div className="flex items-end gap-1 text-4xl font-black text-zinc-100 font-mono">
            <span className="text-2xl text-zinc-500 mb-1">₹</span>
            {(data.stats.total_sales_volume || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Recent Skills */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 rounded-t-2xl">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" /> Recent Skills
            </h2>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[480px] rounded-b-2xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Complexity</th>
                  <th className="px-6 py-4">Credits / Chat</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {data.recent_skills?.map((skill: any) => {
                  const comp = skill.complexity_level || 1;
                  const costMap: Record<number, number> = { 1: 10, 2: 20, 3: 40, 4: 70, 5: 100 };
                  const creditsPerChat = costMap[comp] || (comp * 10);
                  return (
                  <tr key={skill.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-200">{skill.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                        Level {comp}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-400">{creditsPerChat} CR</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-300">₹{skill.base_price_usd || skill.base_price_inr}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                        skill.moderation_status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        {skill.moderation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {skill.moderation_status === 'pending' && (
                        <div className="flex items-center gap-2">
                          {confirmSkillId === skill.id ? (
                            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                              <span className="text-xs font-medium text-zinc-400 px-2">Confirm?</span>
                              <button 
                                onClick={() => updateSkillStatus(skill.id, confirmSkillAction!)}
                                className={cn(
                                  "px-3 py-1 text-xs font-bold text-white rounded-md transition-colors",
                                  confirmSkillAction === 'approved' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                                )}
                              >
                                Yes, {confirmSkillAction === 'approved' ? 'Approve' : 'Reject'}
                              </button>
                              <button 
                                onClick={() => { setConfirmSkillId(null); setConfirmSkillAction(null); }}
                                className="px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => fetchPreview(skill.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-500/20"
                              >
                                Inspect
                              </button>
                              <button 
                                onClick={() => { setConfirmSkillId(skill.id); setConfirmSkillAction('approved'); }}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => { setConfirmSkillId(skill.id); setConfirmSkillAction('rejected'); }}
                                className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-zinc-800 flex flex-wrap gap-4 items-center justify-between bg-zinc-900/80">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-emerald-400" /> Pending Payouts
            </h2>
            <button 
              onClick={runSweep}
              disabled={sweepLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", sweepLoading && "animate-spin")} />
              {sweepLoading ? 'Running Sweep...' : 'Run Weekly Sweep'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4">UPI ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {data.pending_payouts?.map((payout: any) => {
                  const upiLink = generateUpiLink(payout.upi_id || '', parseFloat(payout.amount));
                  return (
                    <tr key={payout.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-200">{payout.seller_username || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{payout.seller_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400">{payout.upi_id || 'Not set'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400 font-mono">₹{parseFloat(payout.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {payout.upi_id && (
                              <>
                                <button 
                                  onClick={() => setShowQrFor(showQrFor === payout.id ? null : payout.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-500/20"
                                >
                                  {showQrFor === payout.id ? 'Hide QR' : '📱 QR Code'}
                                </button>
                                <a 
                                  href={upiLink}
                                  className="px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-500/20 flex items-center gap-1"
                                >
                                  💸 Pay Now
                                </a>
                              </>
                            )}
                            <button 
                              onClick={() => completePayout(payout.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20 flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                            </button>
                          </div>
                          {showQrFor === payout.id && payout.upi_id && (
                            <div className="mt-2 p-4 bg-white rounded-xl inline-block shadow-lg max-w-max border border-zinc-200">
                              <QRCodeSVG 
                                value={upiLink} 
                                size={180}
                                level="M"
                                includeMargin={false}
                              />
                              <div className="text-center text-xs font-medium text-zinc-600 mt-3">Scan with GPay / PhonePe</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!data.pending_payouts || data.pending_payouts.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No pending payouts. Click "Run Weekly Sweep" to generate payouts for eligible creators.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Appeals */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" /> Pending Appeals
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Warnings</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {appeals?.map((appeal: any) => (
                  <tr key={appeal.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{appeal.id}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                        {appeal.warnings_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 max-w-xs truncate" title={appeal.appeal_message}>{appeal.appeal_message}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => unblockUser(appeal.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                        >
                          Unblock
                        </button>
                        <button 
                          onClick={() => viewUserSkills(appeal.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-500/20"
                        >
                          View History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!appeals || appeals.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No pending appeals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-indigo-400" /> Recent Purchases
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {data.recent_purchases?.map((purchase: any) => (
                  <tr key={purchase.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-zinc-200">₹{purchase.amount}</td>
                    <td className="px-6 py-4 text-zinc-400">{purchase.currency}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                        purchase.payment_status === 'completed' || purchase.payment_status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        {purchase.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data.recent_purchases || data.recent_purchases.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                      No recent purchases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Preview Modal */}
      {previewSkill && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="h-6 w-6 text-indigo-400" /> Skill Inspection Preview
              </h2>
              <button 
                onClick={() => setPreviewSkill(null)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-black p-6 font-mono text-[13px] leading-relaxed text-emerald-500 selection:bg-emerald-500/30 whitespace-pre-wrap select-none shadow-inner"
                 onCopy={(e) => e.preventDefault()}
                 onContextMenu={(e) => e.preventDefault()}>
              {previewSkill.content}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 shrink-0">
                <button 
                    onClick={() => { setConfirmSkillId(previewSkill.id); setConfirmSkillAction('rejected'); setPreviewSkill(null); }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-500"
                >
                    <XCircle className="h-4 w-4" /> Reject Skill
                </button>
                <button 
                    onClick={() => { setConfirmSkillId(previewSkill.id); setConfirmSkillAction('approved'); setPreviewSkill(null); }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500"
                >
                    <CheckCircle2 className="h-4 w-4" /> Approve Skill
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing User Skills Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6 shrink-0 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-indigo-400" /> Upload History for {viewingUser.slice(0, 12)}...
              </h2>
              <button 
                onClick={() => setViewingUser(null)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Complexity</th>
                    <th className="px-4 py-3">Credits / Chat</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {userSkills.map(skill => {
                    const comp = skill.complexity_level || 1;
                    const costMap: Record<number, number> = { 1: 10, 2: 20, 3: 40, 4: 70, 5: 100 };
                    const creditsPerChat = costMap[comp] || (comp * 10);
                    return (
                    <tr key={skill.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-zinc-200">{skill.title}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                          Level {comp}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-emerald-400">{creditsPerChat} CR</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                          skill.moderation_status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                          skill.moderation_status === 'rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {skill.moderation_status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                         <button 
                           onClick={() => setPreviewSkill(skill)}
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700"
                         >
                           <Search className="h-3.5 w-3.5" /> Secure Preview
                         </button>
                      </td>
                    </tr>
                    );
                  })}
                  {userSkills.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-500">No skills found for this user.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Secure MD Preview Modal (for View User Skills) */}
      {previewSkill && viewingUser && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
             <div className="flex items-center justify-between mb-6 shrink-0 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="h-6 w-6 text-indigo-400" /> Secure Preview: {previewSkill.title}.md
              </h2>
              <button 
                onClick={() => setPreviewSkill(null)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black p-6 overflow-x-auto shadow-inner">
              <pre className="font-mono text-sm leading-relaxed text-emerald-500 selection:bg-emerald-500/30 whitespace-pre-wrap select-none m-0"
                   onCopy={(e) => e.preventDefault()}
                   onContextMenu={(e) => e.preventDefault()}>
                {previewSkill.md_content || "No content available."}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
