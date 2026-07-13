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

    if (loading) return <div>Loading payouts...</div>;

    return (
        <div className="glass-card">
            {payouts.length === 0 ? (
                <p style={{ color: 'var(--mute)' }}>No payout requests found.</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Seller Email</th>
                            <th>UPI ID / Bank Details</th>
                            <th>Amount (₹)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.map(p => (
                            <tr key={p.id}>
                                <td>{new Date(p.created_at).toLocaleString()}</td>
                                <td>{p.users?.email || p.seller_id}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{p.upi_id}</td>
                                <td style={{ fontWeight: 600 }}>₹{p.amount_inr.toFixed(2)}</td>
                                <td>
                                    <span className={`badge ${p.status === 'completed' ? 'success' : ''}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>
                                    {p.status === 'pending' ? (
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ padding: '4px 12px', fontSize: '12px' }}
                                            onClick={() => completePayout(p.id)}
                                        >
                                            Mark Paid
                                        </button>
                                    ) : (
                                        <span style={{ color: 'var(--mute)', fontSize: '12px' }}>Done</span>
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
