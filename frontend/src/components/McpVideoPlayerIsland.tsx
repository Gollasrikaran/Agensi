import React, { useRef, useState } from 'react';

export default function McpVideoPlayerIsland() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div style={{ width: '100%', background: '#0a0a0f', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
      {/* Video element - maximized inside window with NO second mac window header */}
      <div style={{ position: 'relative', width: '100%', background: '#000' }}>
        <video 
          ref={videoRef}
          src="/mcp-demo-video.mp4" 
          controls 
          preload="metadata" 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '80vh', margin: '0 auto', objectFit: 'contain' }} 
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Sleek Custom Controls Bar with 10s Forward and Backward Skip */}
      <div style={{ 
        padding: '14px 24px', 
        background: 'linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)', 
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => skipTime(-10)}
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
          >
            <span>⏪</span> 10s Backward
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="btn"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(108, 60, 225, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <span>{isPlaying ? '⏸️' : '▶️'}</span> {isPlaying ? 'Pause' : 'Play Video'}
          </button>

          <button
            type="button"
            onClick={() => skipTime(10)}
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
          >
            10s Forward <span>⏩</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Interactive Demo Walkthrough
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🔲 Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}
