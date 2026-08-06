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

    if (loading) return <div className="text-zinc-400">Loading wallet...</div>;

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            <div>
                <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
                    <h2 className="text-[13px] text-indigo-500 font-mono font-medium uppercase tracking-[1px]">Available Balance</h2>
                    <div className="text-5xl font-bold tracking-[-2px] mt-2 text-zinc-100">
                        ₹{balance.toFixed(2)}
                    </div>
                    
                    <div className="flex gap-6 mt-4">
                        <div>
                            <div className="text-[11px] text-zinc-400 uppercase tracking-[0.5px]">Total Earned</div>
                            <div className="text-lg font-semibold text-emerald-500">₹{totalEarnings.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-zinc-400 uppercase tracking-[0.5px]">Total Withdrawn</div>
                            <div className="text-lg font-semibold text-red-500">₹{totalWithdrawn.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <hr className="border-none border-t border-zinc-800/50 my-6" />

                    {/* Auto-payout info banner */}
                    <div className="bg-indigo-500/10 border border-indigo-500/15 rounded-xl p-4 mb-6 text-[13px] text-zinc-300">
                        <strong className="text-indigo-400">🔄 Auto-Payouts</strong>
                        <p className="m-0 mt-1 text-[14px] text-zinc-400">
                            Payouts are processed automatically every week for balances above ₹100. Make sure your UPI ID is saved below.
                        </p>
                    </div>
                    
                    {/* UPI Settings */}
                    <h3 className="text-lg font-semibold mb-4 text-zinc-100">UPI Settings</h3>
                    <form onSubmit={saveUpi} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-300">Your UPI ID</label>
                            <input 
                                className="w-full rounded-xl border border-zinc-700 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                type="text" 
                                value={upiId} 
                                onChange={e => setUpiId(e.target.value)} 
                                required 
                                placeholder="e.g. name@okhdfcbank"
                            />
                            {savedUpi && (
                                <div className="text-xs text-emerald-500 mt-1">
                                    ✓ Currently saved: {savedUpi}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50" disabled={savingUpi}>
                            {savingUpi ? 'Saving...' : (savedUpi ? 'Update UPI ID' : 'Save UPI ID')}
                        </button>
                    </form>
                </div>
            </div>
            
            <div>
                <div className="group flex flex-col p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/50 relative overflow-hidden">
                    <h3 className="text-lg font-semibold mb-4 text-zinc-100">Payout History</h3>
                    {history.length === 0 ? (
                        <p className="text-zinc-400 text-sm">No payouts yet. Once your balance reaches ₹100, payouts will be processed automatically.</p>
                    ) : (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-zinc-950/50 text-zinc-400 uppercase text-xs font-semibold tracking-wider border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Amount (₹)</th>
                                        <th className="px-6 py-4">Provider</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {history.map(item => (
                                        <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4 text-zinc-400">{new Date(item.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-zinc-200 font-semibold">₹{parseFloat(item.amount).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{item.provider}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'} capitalize`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
