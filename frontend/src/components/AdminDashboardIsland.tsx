import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { showToast } from '../lib/toast';

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
        throw new Error('Not authorized as admin or server error');
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
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent("Bodhic AI Seller")}&am=${amount.toFixed(2)}&cu=INR`;
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

  if (loading) return <div>Loading admin dashboard...</div>;
  if (error) return <div className="glass-card" style={{ color: 'var(--error)' }}>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            {data.stats.total_users || 0}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3>Listed Skills</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            {data.stats.total_skills_listed || 0}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3>Total Sales Volume</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₹{(data.stats.total_sales_volume || 0).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="glass-card">
          <h2>Recent Skills</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Title</th>
                <th style={{ padding: '0.5rem' }}>Price</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_skills?.map((skill: any) => (
                <tr key={skill.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem' }}>{skill.title}</td>
                  <td style={{ padding: '0.5rem' }}>₹{skill.base_price_usd || skill.base_price_inr}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: skill.moderation_status === 'approved' ? 'var(--success-soft)' : 'var(--warning-soft)',
                      color: skill.moderation_status === 'approved' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {skill.moderation_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {skill.moderation_status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {confirmSkillId === skill.id ? (
                          <>
                            <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Confirm?</span>
                            <button 
                              onClick={() => updateSkillStatus(skill.id, confirmSkillAction!)}
                              style={{ padding: '0.2rem 0.5rem', background: confirmSkillAction === 'approved' ? 'var(--success)' : 'var(--error)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Yes, {confirmSkillAction === 'approved' ? 'Approve' : 'Reject'}
                            </button>
                            <button 
                              onClick={() => { setConfirmSkillId(null); setConfirmSkillAction(null); }}
                              style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--body)', border: '1px solid var(--hairline)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => fetchPreview(skill.id)}
                              style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Inspect Skill
                            </button>
                            <button 
                              onClick={() => { setConfirmSkillId(skill.id); setConfirmSkillAction('approved'); }}
                              style={{ padding: '0.2rem 0.5rem', background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => { setConfirmSkillId(skill.id); setConfirmSkillAction('rejected'); }}
                              style={{ padding: '0.2rem 0.5rem', background: 'var(--error-soft)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Pending Payouts</h2>
            <button 
              onClick={runSweep}
              disabled={sweepLoading}
              style={{ padding: '0.4rem 1rem', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
            >
              {sweepLoading ? 'Running...' : '🔄 Run Weekly Sweep'}
            </button>
          </div>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Seller</th>
                <th style={{ padding: '0.5rem' }}>UPI ID</th>
                <th style={{ padding: '0.5rem' }}>Amount</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.pending_payouts?.map((payout: any) => {
                const upiLink = generateUpiLink(payout.upi_id || '', parseFloat(payout.amount));
                return (
                  <tr key={payout.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{payout.seller_username || 'Unknown'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>{payout.seller_id.slice(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{payout.upi_id || 'Not set'}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>₹{parseFloat(payout.amount).toFixed(2)}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {payout.upi_id && (
                          <>
                            <button 
                              onClick={() => setShowQrFor(showQrFor === payout.id ? null : payout.id)}
                              style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              {showQrFor === payout.id ? 'Hide QR' : '📱 QR Code'}
                            </button>
                            <a 
                              href={upiLink}
                              style={{ padding: '0.2rem 0.5rem', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', textDecoration: 'none' }}
                            >
                              💸 Pay Now
                            </a>
                          </>
                        )}
                        <button 
                          onClick={() => completePayout(payout.id)}
                          style={{ padding: '0.2rem 0.5rem', background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✓ Mark as Paid
                        </button>
                      </div>
                      {showQrFor === payout.id && payout.upi_id && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#fff', borderRadius: '12px', display: 'inline-block', border: '1px solid var(--hairline)' }}>
                          <QRCodeSVG 
                            value={upiLink} 
                            size={180}
                            level="M"
                            includeMargin={false}
                          />
                          <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '6px' }}>Scan with GPay / PhonePe</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!data.pending_payouts || data.pending_payouts.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--mute)' }}>
                    No pending payouts. Click "Run Weekly Sweep" to generate payouts for eligible sellers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="glass-card">
          <h2>Pending Appeals</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>User ID</th>
                <th style={{ padding: '0.5rem' }}>Warnings</th>
                <th style={{ padding: '0.5rem' }}>Message</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appeals?.map((appeal: any) => (
                <tr key={appeal.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{appeal.id}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--error)' }}>{appeal.warnings_count}</td>
                  <td style={{ padding: '0.5rem' }}>{appeal.appeal_message}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => unblockUser(appeal.id)}
                        style={{ padding: '0.2rem 0.5rem', background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Unblock
                      </button>
                      <button 
                        onClick={() => fetchUserSkills(appeal.id)}
                        style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        View History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!appeals || appeals.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--mute)' }}>
                    No pending appeals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="glass-card">
          <h2>Recent Purchases</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                <th style={{ padding: '0.5rem' }}>Amount</th>
                <th style={{ padding: '0.5rem' }}>Currency</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_purchases?.map((purchase: any) => (
                <tr key={purchase.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ padding: '0.5rem' }}>₹{purchase.amount}</td>
                  <td style={{ padding: '0.5rem' }}>{purchase.currency}</td>
                  <td style={{ padding: '0.5rem' }}>{purchase.payment_status}</td>
                </tr>
              ))}
              {(!data.recent_purchases || data.recent_purchases.length === 0) && (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--mute)' }}>
                    No recent purchases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Preview Modal */}
      {previewSkill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--hairline-strong)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Skill Inspection Preview</h2>
              <button 
                onClick={() => setPreviewSkill(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>
            
            <div 
              style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#000', borderRadius: '8px', color: '#0f0', fontFamily: 'var(--font-mono)', fontSize: '14px', whiteSpace: 'pre-wrap', userSelect: 'none', WebkitUserSelect: 'none' }}
              onCopy={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {previewSkill.content}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                    onClick={() => { setConfirmSkillId(previewSkill.id); setConfirmSkillAction('rejected'); setPreviewSkill(null); }}
                    className="btn-primary"
                    style={{ background: 'var(--error)' }}
                >
                    Reject Skill
                </button>
                <button 
                    onClick={() => { setConfirmSkillId(previewSkill.id); setConfirmSkillAction('approved'); setPreviewSkill(null); }}
                    className="btn-primary"
                    style={{ background: 'var(--success)', border: 'none' }}
                >
                    Approve Skill
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing User Skills Modal */}
      {viewingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Upload History for {viewingUser}</h2>
              <button onClick={() => setViewingUser(null)} style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem' }}>Title</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userSkills.map(skill => (
                  <tr key={skill.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem' }}>{skill.title}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                        background: skill.moderation_status === 'approved' ? 'var(--success-soft)' : skill.moderation_status === 'rejected' ? 'var(--error-soft)' : 'var(--warning-soft)',
                        color: skill.moderation_status === 'approved' ? 'var(--success)' : skill.moderation_status === 'rejected' ? 'var(--error)' : 'var(--warning)'
                      }}>
                        {skill.moderation_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                       <button 
                         onClick={() => setPreviewSkill(skill)}
                         style={{ padding: '0.2rem 0.5rem', background: 'var(--canvas-soft-2)', color: 'var(--ink)', border: '1px solid var(--hairline-strong)', borderRadius: '4px', cursor: 'pointer' }}
                       >
                         Secure Preview .md
                       </button>
                    </td>
                  </tr>
                ))}
                {userSkills.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>No skills found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Secure MD Preview Modal */}
      {previewSkill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Secure Preview: {previewSkill.title}.md</h2>
              <button onClick={() => setPreviewSkill(null)} style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ background: 'var(--canvas-soft-2)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--hairline-strong)' }}>
              <pre style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', margin: 0 }}>
                {previewSkill.md_content || "No content available."}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
