import React from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface LiveStatusBarProps {
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    estimated?: boolean;
  } | null;
  liveUsage?: { total_tokens?: number; estimated?: boolean } | null;
  progress: number;
  label: string;
  connected: boolean;
}

export const LiveStatusBar: React.FC<LiveStatusBarProps> = ({ usage, liveUsage, progress, label, connected }) => {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const totalTokens = (Number(usage?.total_tokens || 0) + Number(liveUsage?.total_tokens || 0)).toLocaleString();
  const showingLiveUsage = Boolean(liveUsage && Number(liveUsage.total_tokens || 0) > 0);
  return (
    <div style={{ background: '#0b1220', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '8px 24px', display: 'flex', gap: '22px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
          <Activity size={14} color="#38bdf8" />
          Codex tokens: <strong style={{ color: '#e2e8f0' }}>{totalTokens}</strong>
          {usage?.estimated && <span style={{ color: '#fbbf24' }}>(estimated)</span>}
          {showingLiveUsage && <span style={{ color: '#38bdf8' }}>(live estimate)</span>}
        </span>
        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
          {connected ? <Wifi size={14} color="#4ade80" /> : <WifiOff size={14} color="#f87171" />}
          {connected ? 'Live connected' : 'Live reconnecting'}
        </span>
        <span style={{ minWidth: '230px', display: 'inline-flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
          Preview: <strong style={{ color: '#e2e8f0' }}>{safeProgress}%</strong>
          <span style={{ flex: 1, height: '5px', borderRadius: '99px', background: '#1e293b', overflow: 'hidden' }}>
            <span style={{ display: 'block', width: `${safeProgress}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'width 240ms ease' }} />
          </span>
        </span>
        <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px' }}>{label}</span>
      </div>
    </div>
  );
};
