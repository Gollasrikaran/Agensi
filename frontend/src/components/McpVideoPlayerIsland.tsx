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
    <div className="w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
      {/* Video element - maximized inside window with NO second mac window header */}
      <div className="relative w-full bg-black">
        <video 
          ref={videoRef}
          src="/mcp-demo-video.mp4" 
          controls 
          preload="metadata" 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-auto block max-h-[80vh] mx-auto object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Sleek Custom Controls Bar with 10s Forward and Backward Skip */}
      <div className="px-6 py-3.5 bg-gradient-to-b from-zinc-900 to-zinc-950 border-t border-zinc-800/50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => skipTime(-10)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <span>⏪</span> 10s Backward
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <span>{isPlaying ? '⏸️' : '▶️'}</span> {isPlaying ? 'Pause' : 'Play Video'}
          </button>

          <button
            type="button"
            onClick={() => skipTime(10)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            10s Forward <span>⏩</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 font-medium">
            Interactive Demo Walkthrough
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center rounded-xl border border-zinc-700 bg-transparent px-3.5 py-2 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            🔲 Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}
