import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
export default function WalletIsland() {
    const [balance, setBalance] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [upiId, setUpiId] = useState('');
    const [savedUpi, setSavedUpi] = useState<string | null>(null);
    const [savingUpi, setSavingUpi] = useState(false);

    useEffect(() => {
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
                setTotalEarnings(data.total_earnings || 0);
                setTotalWithdrawn(data.total_withdrawn || 0);
                setHistory(data.history || []);
                setSavedUpi(data.upi_id || null);
                if (data.upi_id) setUpiId(data.upi_id);
            }
        } catch (e) {
            console.error("Failed to load wallet", e);
        } finally {
            setLoading(false);
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

    if (loading) return <div style={{ color: 'var(--mute)' }}>Loading wallet...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-xl)' }}>
            <div>
                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '13px', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</h2>
                    <div style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-2px', marginTop: 'var(--space-xs)' }}>
                        ₹{balance.toFixed(2)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Earned</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)' }}>₹{totalEarnings.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Withdrawn</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--error)' }}>₹{totalWithdrawn.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: 'var(--space-lg) 0' }} />

                    {/* Auto-payout info banner */}
                    <div style={{ 
                        background: 'var(--primary-soft)', 
                        border: '1px solid rgba(108, 60, 225, 0.15)', 
                        borderRadius: '12px', 
                        padding: 'var(--space-md)', 
                        marginBottom: 'var(--space-lg)',
                        fontSize: '13px',
                        color: 'var(--body)'
                    }}>
                        <strong style={{ color: 'var(--primary)' }}>🔄 Auto-Payouts</strong>
                        <p style={{ margin: '6px 0 0 0', lineHeight: 1.5 }}>
                            Payouts are processed automatically every week for balances above ₹100. Make sure your UPI ID is saved below.
                        </p>
                    </div>
                    
                    {/* UPI Settings */}
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>UPI Settings</h3>
                    <form onSubmit={saveUpi} className="form-group">
                        <div>
                            <label>Your UPI ID</label>
                            <input 
                                type="text" 
                                value={upiId} 
                                onChange={e => setUpiId(e.target.value)} 
                                required 
                                placeholder="e.g. name@okhdfcbank"
                            />
                            {savedUpi && (
                                <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>
                                    ✓ Currently saved: {savedUpi}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingUpi}>
                            {savingUpi ? 'Saving...' : (savedUpi ? 'Update UPI ID' : 'Save UPI ID')}
                        </button>
                    </form>
                </div>
            </div>
            
            <div>
                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Payout History</h3>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--mute)', fontSize: '14px' }}>No payouts yet. Once your balance reaches ₹100, payouts will be processed automatically.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount (₹)</th>
                                    <th>Provider</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ color: 'var(--mute)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>₹{parseFloat(item.amount).toFixed(2)}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item.provider}</td>
                                        <td>
                                            <span className={`badge ${item.status === 'completed' ? 'success' : ''}`} style={{ textTransform: 'capitalize' }}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
