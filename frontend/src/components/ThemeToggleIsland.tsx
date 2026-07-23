import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggleIsland() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('bodhic-theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    } else if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      // Follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark-mode');
      }
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('bodhic-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('bodhic-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        background: 'transparent',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--ink)',
        cursor: 'pointer',
        fontSize: 16,
        transition: 'all 0.15s ease',
      }}
    >
      {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
    </button>
  );
}
