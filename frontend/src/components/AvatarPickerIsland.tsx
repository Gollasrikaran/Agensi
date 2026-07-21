import React, { useState, useEffect } from 'react';
import AvatarBadge from './AvatarBadge';

const FREE_STYLES = [
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'bottts', label: 'Bottts' },
  { id: 'avataaars', label: 'Avataaars' },
  { id: 'thumbs', label: 'Thumbs' },
  { id: 'fun-emoji', label: 'Fun Emoji' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'initials', label: 'Initials' },
  { id: 'identicon', label: 'Identicon' },
  { id: 'rings', label: 'Rings' },
  { id: 'glass', label: 'Glass' }
];

export default function AvatarPickerIsland({ userId, currentUsername, onAvatarSelect }: { userId: string, currentUsername: string, onAvatarSelect?: (url: string) => void }) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const [selectedStyle, setSelectedStyle] = useState('pixel-art');
  const [seed, setSeed] = useState(currentUsername || 'bodhic');
  
  const [packs, setPacks] = useState<any[]>([]);
  const [unlockedPackIds, setUnlockedPackIds] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);

  const getSessionToken = () => {
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('sb-localhost-auth-token') || localStorage.getItem('supabase.auth.token');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          return session?.currentSession?.access_token || session?.access_token;
        } catch(e) {}
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/avatars/packs`);
        if (res.ok) {
          const data = await res.json();
          setPacks(data);
        }
      } catch (e) {
        console.error("Failed to fetch packs", e);
      }
    };

    const fetchUnlocks = async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/avatars/my-unlocks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // data is an array of packs the user has unlocked
          setUnlockedPackIds(new Set(data.map((p: any) => p.id)));
        }
      } catch(e) {
        console.error("Failed to fetch unlocks", e);
      }
    };

    fetchPacks();
    fetchUnlocks();
  }, []);

  const handleBuy = async (pack: any) => {
    const token = getSessionToken();
    if (!token) {
      alert("Please log in to purchase packs.");
      return;
    }
    try {
      const orderRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/avatars/packs/${pack.slug}/order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!orderRes.ok) {
        const err = await orderRes.json();
        alert(err.detail || "Failed to initiate purchase");
        return;
      }
      
      const order = await orderRes.json();

      if (order.is_free) {
        const verifyRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/avatars/packs/${pack.slug}/verify`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpay_payment_id: "free", razorpay_order_id: "free", razorpay_signature: "free" })
        });
        if (verifyRes.ok) {
          setUnlockedPackIds(prev => new Set(prev).add(pack.id));
        }
        return;
      }

      const options = {
        key: order.razorpay_key_id || "rzp_test_mockkey", // mock key for testing
        amount: Math.round(order.amount_inr * 100),
        currency: "INR",
        name: "Bodhic AI",
        description: `Unlock ${pack.name}`,
        order_id: order.client_secret,
        handler: async function (response: any) {
          const verifyRes = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'}/api/avatars/packs/${pack.slug}/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id || "mock_payment",
              razorpay_order_id: response.razorpay_order_id || order.client_secret,
              razorpay_signature: response.razorpay_signature || "mock_signature"
            })
          });
          if (verifyRes.ok) {
            setUnlockedPackIds(prev => new Set(prev).add(pack.id));
          } else {
            alert("Payment verification failed");
          }
        },
        theme: {
          color: "#6C3CE1"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch(e) {
      console.error(e);
      alert("An error occurred");
    }
  };

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const handleSaveFree = async () => {
    const url = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}`;
    setLoading(true);
    if (onAvatarSelect) {
      onAvatarSelect(url);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: 'var(--border-radius-card)', padding: '24px' }}>
      <h2 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Choose Avatar</h2>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--bg-tertiary)' }}>
        <button 
          onClick={() => setActiveTab('free')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '12px 0', 
            color: activeTab === 'free' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'free' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
          Free Styles
        </button>
        <button 
          onClick={() => setActiveTab('premium')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '12px 0', 
            color: activeTab === 'premium' ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'premium' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
          Premium Packs
        </button>
      </div>

      {activeTab === 'free' && (
        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Left: Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AvatarBadge 
              url={`https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}`}
              size={120}
            />
            <button 
              onClick={handleRandomize}
              style={{ background: 'var(--bg-tertiary)', border: 'var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer' }}
            >
              🎲 Randomize
            </button>
            <button 
              onClick={handleSaveFree}
              disabled={loading}
              style={{ background: 'var(--accent-gradient)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 'var(--border-radius-pill)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {loading ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>
          
          {/* Right: Style Grid */}
          <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
            {FREE_STYLES.map(style => (
              <div 
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: selectedStyle === style.id ? 'var(--bg-tertiary)' : 'transparent',
                  border: selectedStyle === style.id ? '1px solid var(--accent-primary)' : '1px solid var(--bg-tertiary)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <img 
                  src={`https://api.dicebear.com/9.x/${style.id}/svg?seed=preview`} 
                  alt={style.label} 
                  style={{ width: '48px', height: '48px', marginBottom: '8px' }} 
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{style.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'premium' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {packs.map(pack => {
            const isUnlocked = unlockedPackIds.has(pack.id);
            return (
              <div key={pack.id} style={{
                background: 'var(--bg-tertiary)',
                border: 'var(--glass-border)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}>
                {pack.tier === 'exclusive' && (
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--ring-exclusive)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)' }}>
                    Limited
                  </div>
                )}
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{pack.icon_emoji}</div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{pack.name}</h3>
                
                <div style={{ marginTop: '16px' }}>
                  {isUnlocked ? (
                    <button style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>
                      ✓ Unlocked
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBuy(pack); }}
                      style={{ width: '100%', background: 'var(--price-paid)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>
                      Buy ₹{pack.price_inr}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
