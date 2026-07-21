import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
export default function WalletIsland() {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [upi, setUpi] = useState('');
    const [message, setMessage] = useState('');

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
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error("Failed to load wallet", e);
        } finally {
            setLoading(false);
        }
    };

    const requestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/payout`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount_inr: parseFloat(amount),
                    upi_id: upi
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setMessage('Payout requested successfully! We will process it shortly.');
                setAmount('');
                setUpi('');
                fetchWallet(); // Reload
            } else {
                setMessage(`Error: ${data.detail}`);
            }
        } catch (e) {
            setMessage('An error occurred.');
        }
    };

    if (loading) return <div style={{ color: 'var(--mute)' }}>Loading wallet...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-xl)' }}>
            <div>
                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '13px', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Balance</h2>
                    <div style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-2px', marginTop: 'var(--space-xs)' }}>
                        ₹{balance.toFixed(2)}
                    </div>
                    
                    <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: 'var(--space-lg) 0' }} />
                    
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Request Payout</h3>
                    <form onSubmit={requestPayout} className="form-group">
                        <div>
                            <label>Amount (₹)</label>
                            <input 
                                type="number" 
                                min="100" 
                                max={balance} 
                                step="1"
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                required 
                                placeholder="Min. 100"
                            />
                        </div>
                        <div>
                            <label>UPI ID</label>
                            <input 
                                type="text" 
                                value={upi} 
                                onChange={e => setUpi(e.target.value)} 
                                required 
                                placeholder="e.g. name@okhdfcbank"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
                            Submit Request →
                        </button>
                        {message && <div style={{ marginTop: 'var(--space-sm)', fontSize: '14px', color: message.startsWith('Error') ? 'var(--error)' : 'var(--success)' }}>{message}</div>}
                    </form>
                </div>
            </div>
            
            <div>
                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Payout History</h3>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--mute)', fontSize: '14px' }}>No payout requests yet.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>UPI ID</th>
                                    <th>Amount (₹)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ color: 'var(--mute)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.upi_id}</td>
                                        <td style={{ fontWeight: 600 }}>₹{item.amount_inr.toFixed(2)}</td>
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
