import React from 'react';
import { Activity, Wifi, WifiOff, CheckCircle2, Globe, Layers, LayoutDashboard, Loader2 } from 'lucide-react';

interface LiveStatusBarProps {
  activeProvider?: string;
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    run_count?: number;
    estimated?: boolean;
    available?: boolean;
  } | null;
  liveUsage?: { available?: boolean; active?: boolean } | null;
  progress: number;
  label: string;
  stage?: string;
  connected: boolean;
}

export const LiveStatusBar: React.FC<LiveStatusBarProps> = ({ activeProvider, usage, liveUsage, progress, label, stage, connected }) => {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const totalTokens = Number(usage?.total_tokens || 0);
  const providerName = activeProvider === 'agy' ? 'AGY' : activeProvider === 'claude' ? 'Claude Code' : 'AI';

  const isResearchDone = safeProgress >= 70 || stage === 'script_plan' || stage === 'script_ready' || stage === 'script_review' || stage === 'preview_review' || stage === 'completed';
  const isResearchActive = !isResearchDone && (stage === 'research' || (safeProgress > 0 && safeProgress < 70) || !!liveUsage?.active);

  const isPlanDone = safeProgress >= 95 || stage === 'script_ready' || stage === 'script_review' || stage === 'preview_review' || stage === 'completed';
  const isPlanActive = !isPlanDone && isResearchDone && (stage === 'script_plan' || (safeProgress >= 70 && safeProgress < 95));

  const isDashboardDone = safeProgress === 100 || stage === 'script_ready' || stage === 'script_review' || stage === 'preview_review' || stage === 'completed';
  const isDashboardActive = !isDashboardDone && isPlanDone && (stage === 'script_ready' || safeProgress >= 95);

  return (
    <div style={{ background: '#0b1220', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '8px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
          <Activity size={14} color="#38bdf8" />
          {providerName} tokens: <strong style={{ color: '#e2e8f0' }}>{usage?.available || Number(usage?.run_count || 0) === 0 ? totalTokens.toLocaleString() : 'unavailable'}</strong>
          {usage?.available && usage?.estimated && <span style={{ color: '#fbbf24' }}>(estimated)</span>}
          {liveUsage?.active && <span style={{ color: '#38bdf8' }}>(running)</span>}
        </span>

        {/* Milestone Steps with Small Icons */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '20px', border: '1px solid rgba(51, 65, 85, 0.6)' }}>
          {/* Step 1: CLI Research */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: isResearchDone ? 'rgba(74, 222, 128, 0.15)' : isResearchActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: isResearchDone ? '#4ade80' : isResearchActive ? '#38bdf8' : '#64748b',
            border: `1px solid ${isResearchDone ? 'rgba(74, 222, 128, 0.35)' : isResearchActive ? 'rgba(56, 189, 248, 0.45)' : 'transparent'}`
          }} title="Milestone 1: Multi-website deep research">
            {isResearchDone ? <CheckCircle2 size={12} color="#4ade80" /> : isResearchActive ? <Loader2 size={12} className="spin-animate" color="#38bdf8" /> : <Globe size={12} />}
            <span>CLI Research</span>
            {isResearchDone && <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>✓</span>}
          </span>

          <span style={{ color: '#475569', fontSize: '9px' }}>▶</span>

          {/* Step 2: CLI Plan Ready */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: isPlanDone ? 'rgba(74, 222, 128, 0.15)' : isPlanActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: isPlanDone ? '#4ade80' : isPlanActive ? '#38bdf8' : '#64748b',
            border: `1px solid ${isPlanDone ? 'rgba(74, 222, 128, 0.35)' : isPlanActive ? 'rgba(56, 189, 248, 0.45)' : 'transparent'}`
          }} title="Milestone 2: Scene blueprints, narration & timing">
            {isPlanDone ? <CheckCircle2 size={12} color="#4ade80" /> : isPlanActive ? <Loader2 size={12} className="spin-animate" color="#38bdf8" /> : <Layers size={12} />}
            <span>Plan Ready</span>
            {isPlanDone && <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>✓</span>}
          </span>

          <span style={{ color: '#475569', fontSize: '9px' }}>▶</span>

          {/* Step 3: Get Into Dashboard */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: isDashboardDone ? 'rgba(74, 222, 128, 0.15)' : isDashboardActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: isDashboardDone ? '#4ade80' : isDashboardActive ? '#38bdf8' : '#64748b',
            border: `1px solid ${isDashboardDone ? 'rgba(74, 222, 128, 0.35)' : isDashboardActive ? 'rgba(56, 189, 248, 0.45)' : 'transparent'}`
          }} title="Milestone 3: Script saved and loaded in dashboard for human review">
            {isDashboardDone ? <CheckCircle2 size={12} color="#4ade80" /> : isDashboardActive ? <Loader2 size={12} className="spin-animate" color="#38bdf8" /> : <LayoutDashboard size={12} />}
            <span>In Dashboard</span>
            {isDashboardDone && <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>✓</span>}
          </span>
        </div>

        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
          {connected ? <Wifi size={14} color="#4ade80" /> : <WifiOff size={14} color="#f87171" />}
          {connected ? 'Live connected' : 'Live reconnecting'}
        </span>

        <span style={{ minWidth: '180px', display: 'inline-flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
          Progress: <strong style={{ color: '#e2e8f0' }}>{safeProgress}%</strong>
          <span style={{ flex: 1, height: '5px', borderRadius: '99px', background: '#1e293b', overflow: 'hidden' }}>
            <span style={{ display: 'block', width: `${safeProgress}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'width 240ms ease' }} />
          </span>
        </span>

        <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>{label}</span>
      </div>
    </div>
  );
};
