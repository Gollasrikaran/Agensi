import React from 'react';

export default function MiniPulse({ intensityArray = Array(28).fill(0) }: { intensityArray?: number[] }) {
  // Pad or truncate to exactly 28 days
  const data = [...intensityArray, ...Array(28)].slice(0, 28);
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(7, 1fr)',
      gap: '2px',
      width: 'fit-content'
    }}>
      {data.map((intensity, i) => (
        <div 
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '1px',
            background: intensity > 0 ? 'var(--accent-primary)' : 'var(--pulse-empty)',
            opacity: intensity === 0 ? 1 : (intensity * 0.25),
          }}
        />
      ))}
    </div>
  );
}
