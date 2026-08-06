import React from 'react';

export default function MiniPulse({ intensityArray = Array(28).fill(0) }: { intensityArray?: number[] }) {
  // Pad or truncate to exactly 28 days
  const data = [...intensityArray, ...Array(28)].slice(0, 28);
  
  return (
    <div className="grid grid-cols-4 grid-rows-7 gap-[2px] w-fit">
      {data.map((intensity, i) => (
        <div 
          key={i}
          className={`w-[6px] h-[6px] rounded-[1px] ${intensity > 0 ? 'bg-indigo-500' : 'bg-zinc-800'}`}
          style={{
            opacity: intensity === 0 ? 1 : (intensity * 0.25),
          }}
        />
      ))}
    </div>
  );
}
