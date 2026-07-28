import React, { useEffect, useRef } from 'react';

interface StrictAntiCopyViewProps {
  code: string;
  username: string;
  ip?: string;
}

export default function StrictAntiCopyView({ code, username, ip = "127.0.0.1" }: StrictAntiCopyViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Forensic Watermarking + Canvas rendering to prevent DOM scraping
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Split code into lines
    const lines = code.split('\n');
    const lineHeight = 20;
    const padding = 20;
    
    // Set canvas dimensions
    canvas.width = 800; // Fixed width or dynamic
    canvas.height = Math.max(400, lines.length * lineHeight + padding * 2);

    // Background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Code
    ctx.font = '14px "Fira Code", monospace';
    ctx.fillStyle = '#ffffff'; // Bright white for max contrast
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + (i + 1) * lineHeight);
    });

    // Draw Forensic Watermark
    ctx.save();
    ctx.globalAlpha = 0.015; // Extremely faint, readable code
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.rotate(-Math.PI / 4); // Diagonal
    
    const timestamp = new Date().toISOString();
    const watermarkText = `ID: ${username} | IP: ${ip} | TIME: ${timestamp}`;
    
    // Repeat watermark across the canvas with wide spacing
    for (let x = -canvas.height; x < canvas.width * 2; x += 400) {
      for (let y = -canvas.width; y < canvas.height * 2; y += 250) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();

    // Prevent default shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        alert("Action blocked for security reasons.");
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, username, ip]);

  return (
    <div 
      style={{ 
        width: '100%', 
        overflowX: 'auto', 
        userSelect: 'none', 
        WebkitUserSelect: 'none',
        pointerEvents: 'none' // Prevents right-click and selection on the canvas
      }}
      onContextMenu={(e) => e.preventDefault()} // Block right-click
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          borderRadius: '8px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          maxWidth: '100%'
        }} 
      />
    </div>
  );
}
