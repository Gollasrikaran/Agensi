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
            
            const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/payouts`, {
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
            
            const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/payouts/${id}/complete`, {
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

    if (loading) return <div className="text-zinc-400">Loading payouts...</div>;

    return (
        <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
            {payouts.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No payout requests found.</p>
            ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm overflow-x-auto w-full">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Creator Email</th>
                                <th className="px-6 py-4">UPI ID</th>
                                <th className="px-6 py-4">Amount (₹)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {payouts.map(p => (
                                <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="px-6 py-4 text-zinc-400 text-[14px]">{new Date(p.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-zinc-200">{p.users?.email || p.seller_id}</td>
                                    <td className="px-6 py-4 text-zinc-300 font-mono text-[13px]">{p.upi_id}</td>
                                    <td className="px-6 py-4 font-semibold text-zinc-100">₹{p.amount_inr.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.status === 'pending' ? (
                                            <button 
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950" 
                                                onClick={() => completePayout(p.id)}
                                            >
                                                Mark Paid
                                            </button>
                                        ) : (
                                            <span className="text-zinc-500 text-[14px]">Done</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
