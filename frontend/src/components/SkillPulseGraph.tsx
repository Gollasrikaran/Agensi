import React, { useState, useEffect } from 'react';

type ActivityType = 'all' | 'upload' | 'sale' | 'upvote' | 'review' | 'bounty';

interface PulseData {
  date: string;
  intensity: number; // 0-4
  type: ActivityType;
  count: number;
  rawTypes?: Record<string, number>;
}

export default function SkillPulseGraph({ username }: { username: string }) {
  const [filter, setFilter] = useState<ActivityType>('all');
  const [pulseData, setPulseData] = useState<PulseData[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number, data: PulseData | null } | null>(null);

  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    fetch(`http://localhost:8000/api/public/users/${username}/activity`)
      .then(res => res.json())
      .then(data => {
        // Aggregate activity by date and type
        const activityMap: Record<string, { [key in ActivityType]?: number }> = {};
        if (data.activity) {
          data.activity.forEach((act: any) => {
            const date = new Date(act.created_at).toISOString().split('T')[0];
            const type = act.activity_type as ActivityType;
            if (!activityMap[date]) activityMap[date] = {};
            activityMap[date][type] = (activityMap[date][type] || 0) + 1;
            activityMap[date]['all'] = (activityMap[date]['all'] || 0) + 1;
          });
        }

        // Generate 364 days grid ending today
        const generatedData: PulseData[] = [];
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 364);

        for (let i = 0; i < 364; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayData = activityMap[dateStr] || {};
          
          generatedData.push({
            date: dateStr,
            intensity: dayData['all'] ? Math.min(dayData['all'], 4) : 0,
            type: 'all', // We store all in cell, filters handle visual later
            count: dayData['all'] || 0,
            rawTypes: dayData
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        setPulseData(generatedData);
        if (data.streaks) {
          setStreaks({ current: data.streaks.current_streak || 0, longest: data.streaks.longest_streak || 0 });
        }
      })
      .catch(err => console.error("Failed to fetch pulse activity", err));
  }, [username]);

  const getColorForType = (type: ActivityType, intensity: number) => {
    if (intensity === 0) return 'var(--pulse-empty)';
    
    // Base colors from CSS variables
    const colors: Record<string, string> = {
      'upload': 'var(--pulse-upload)',
      'sale': 'var(--pulse-sale)',
      'upvote': 'var(--pulse-upvote)',
      'review': 'var(--pulse-review)',
      'bounty': 'var(--pulse-bounty)',
      'all': 'var(--primary)' // Fallback if mixed (using --primary instead of undefined --accent-primary)
    };
    
    return colors[type] || colors['all'];
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: 'var(--glass-border)',
      borderRadius: 'var(--border-radius-card)',
      padding: '24px',
      position: 'relative',
      overflowX: 'auto'
    }}>
      
      {hoveredCell?.data && (
        <div style={{
          position: 'absolute',
          left: hoveredCell.x - 60,
          top: hoveredCell.y - 40,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--accent-deep)',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#fff',
          zIndex: 10,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap'
        }}>
          {hoveredCell.data.rawTypes?.[filter] || 0} {filter}s on {hoveredCell.data.date}
        </div>
      )}

      {/* Grid: 52 columns, 7 rows */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(52, 12px)',
        gridTemplateRows: 'repeat(7, 12px)',
        gridAutoFlow: 'column',
        gap: '4px',
        marginBottom: '20px',
        minWidth: 'max-content'
      }}>
        {pulseData.map((cell, idx) => {
          const filterCount = cell.rawTypes?.[filter] || 0;
          const isVisible = filter === 'all' ? cell.count > 0 : filterCount > 0;
          
          let displayIntensity = 0;
          if (isVisible) {
             displayIntensity = Math.min(filterCount || cell.count, 4);
          }
          
          return (
            <div
              key={idx}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect = e.currentTarget.parentElement!.getBoundingClientRect();
                if (isVisible) {
                  setHoveredCell({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top,
                    data: cell
                  });
                }
              }}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: getColorForType(filter, displayIntensity),
                opacity: displayIntensity === 0 ? 1 : (0.4 + displayIntensity * 0.15),
                transition: 'var(--transition-smooth)',
                cursor: displayIntensity > 0 ? 'pointer' : 'default',
                animation: `fadeIn 0.5s ease-out forwards`,
                animationDelay: `${(idx % 52) * 5}ms`
              }}
              onMouseOver={(e) => {
                if(displayIntensity > 0) e.currentTarget.style.transform = 'scale(1.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Footer Controls & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'upload', 'sale', 'upvote', 'review', 'bounty'] as ActivityType[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              onMouseEnter={(e) => {
                if (filter !== t) e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                if (filter !== t) e.currentTarget.style.background = 'transparent';
              }}
              style={{
                background: filter === t ? 'var(--bg-tertiary)' : 'transparent',
                border: filter === t ? `1px solid ${getColorForType(t, 4)}` : '1px solid transparent',
                color: filter === t ? '#fff' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--border-radius-pill)',
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'right', fontSize: '13px' }}>
          <div style={{ color: 'var(--text-secondary)' }}>🔥 Current Streak: <strong style={{ color: '#fff' }}>14 days</strong></div>
          <div style={{ color: 'var(--text-secondary)' }}>⚡ Longest Streak: <strong>42 days</strong></div>
        </div>

      </div>
    </div>
  );
}
