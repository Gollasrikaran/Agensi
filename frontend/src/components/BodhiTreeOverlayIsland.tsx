import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, PenTool, Database, Zap, Megaphone, X } from 'lucide-react';

const DOMAIN_CONFIG = [
  { id: 'development', label: 'Development', icon: Code, color: '#10b981', x: '20%', y: '45%' },
  { id: 'copywriting', label: 'Copywriting', icon: PenTool, color: '#3b82f6', x: '35%', y: '30%' },
  { id: 'automation', label: 'Automation', icon: Zap, color: '#8b5cf6', x: '50%', y: '15%' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: '#ec4899', x: '65%', y: '30%' },
  { id: 'data-science', label: 'Data Science', icon: Database, color: '#f59e0b', x: '80%', y: '45%' },
];

export default function BodhiTreeOverlayIsland() {
  const [skills, setSkills] = useState<any[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => setSkills(data))
      .catch(console.error);
  }, []);

  const getSkillsForDomain = (domainId: string) => {
    return skills
      .filter(s => (s.category || '').toLowerCase().includes(domainId) || (s.categories || []).includes(domainId))
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      <div style={{ textAlign: 'center', zIndex: 10, marginTop: '40px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-1px', color: 'white', marginBottom: '8px' }}>Tree of Enlightenment</h1>
        <p style={{ color: '#a1a1aa' }}>Click a glowing branch node to explore top-rated skills.</p>
        <button onClick={() => setActiveDomain(null)} style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s' }}>Close All Branches</button>
      </div>

      {/* The Tree Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '800px', 
        aspectRatio: '1 / 1',
        backgroundImage: 'url(/logo.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        
        {/* Interactive Overlays */}
        {DOMAIN_CONFIG.map((domain) => {
          const isActive = activeDomain === domain.id;
          const isDimmed = activeDomain !== null && !isActive;
          const Icon = domain.icon;
          
          const domainSkills = getSkillsForDomain(domain.id);

          return (
            <div
              key={domain.id}
              style={{
                position: 'absolute',
                left: domain.x,
                top: domain.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 50 : 10,
                opacity: isDimmed ? 0.3 : 1,
                transition: 'opacity 0.3s ease'
              }}
            >
              {/* Pulsing Node */}
              <div 
                onClick={() => setActiveDomain(isActive ? null : domain.id)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <motion.div 
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', background: domain.color, zIndex: -1 }}
                  animate={{ scale: isActive ? [1, 1.3, 1] : 1, opacity: isActive ? [0.6, 0, 0.6] : 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <motion.div 
                  style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: isActive ? domain.color : 'rgba(24,24,27,0.8)', 
                    border: `2px solid ${domain.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActive ? `0 0 20px ${domain.color}` : 'none',
                    backdropFilter: 'blur(4px)'
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon color={isActive ? '#fff' : domain.color} size={24} />
                </motion.div>

                {/* Node Label (Hide when active to avoid clutter) */}
                {!isActive && (
                  <div style={{ position: 'absolute', top: '56px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: 'white', fontWeight: 600, fontSize: '13px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {domain.label}
                  </div>
                )}
              </div>

              {/* Skills Panel (The "Vines") */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    style={{
                      position: 'absolute',
                      top: '60px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(24, 24, 27, 0.85)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${domain.color}`,
                      borderRadius: '16px',
                      padding: '16px',
                      width: '280px',
                      boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${domain.color}22`,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: '12px', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>{domain.label} Skills</h3>
                      <span style={{ fontSize: '12px', color: domain.color, fontWeight: 'bold' }}>{domainSkills.length} Total</span>
                    </div>

                    {domainSkills.length === 0 ? (
                      <div style={{ color: '#a1a1aa', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No skills sprout here yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {domainSkills.map((skill, i) => {
                          // The higher the upvotes, the more "prominent" (thicker left border) the skill appears.
                          const upvotes = skill.upvotes || 0;
                          const vineThickness = Math.min(2 + (upvotes * 0.5), 8); 

                          return (
                            <a 
                              key={skill.id} 
                              href={`/skill/${skill.id}`}
                              style={{ 
                                display: 'block', 
                                textDecoration: 'none', 
                                padding: '12px', 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '8px',
                                borderLeft: `${vineThickness}px solid ${domain.color}`,
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                              <div style={{ fontSize: '14px', color: 'white', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.title}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa' }}>
                                <span>▲ {upvotes}</span>
                                <span>{skill.base_price_inr === 0 ? 'Free' : `₹${skill.base_price_inr}`}</span>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>
    </div>
  );
}
