import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PayoutsIsland() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            const res = await fetch('http://localhost:8000/api/admin/payouts', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setPayouts(data);
            }
        } catch (e) {
            console.error("Failed to load payouts", e);
        } finally {
            setLoading(false);
        }
    };

    const completePayout = async (id: string) => {
        if (!confirm("Are you sure you have transferred this amount via UPI? This action cannot be undone.")) return;
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            const res = await fetch(`http://localhost:8000/api/admin/payouts/${id}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            
            if (res.ok) {
                alert("Payout marked as completed.");
                fetchPayouts();
            } else {
                const data = await res.json();
                alert(`Error: ${data.detail}`);
            }
        } catch (e) {
            alert("An error occurred.");
        }
    };

    if (loading) return <div style={{ color: 'var(--mute)' }}>Loading payouts...</div>;

    return (
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
            {payouts.length === 0 ? (
                <p style={{ color: 'var(--mute)', textAlign: 'center', padding: 'var(--space-xl) 0' }}>No payout requests found.</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Seller Email</th>
                            <th>UPI ID</th>
                            <th>Amount (₹)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.map(p => (
                            <tr key={p.id}>
                                <td style={{ color: 'var(--mute)', fontSize: '14px' }}>{new Date(p.created_at).toLocaleString()}</td>
                                <td>{p.users?.email || p.seller_id}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{p.upi_id}</td>
                                <td style={{ fontWeight: 600 }}>₹{p.amount_inr.toFixed(2)}</td>
                                <td>
                                    <span className={`badge ${p.status === 'completed' ? 'success' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>
                                    {p.status === 'pending' ? (
                                        <button 
                                            className="btn btn-primary btn-sm" 
                                            onClick={() => completePayout(p.id)}
                                        >
                                            Mark Paid
                                        </button>
                                    ) : (
                                        <span style={{ color: 'var(--mute)', fontSize: '14px' }}>Done</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
