import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, Cpu, Database, RefreshCw, XCircle, AlertCircle, Power,
} from 'lucide-react';
import { api, CliConnection, ActiveProviderStatus } from '../services/api';

// ──────────────────────────────────────────────────
// Sub-component: single CLI connection card
// ──────────────────────────────────────────────────

interface CliCardProps {
  id: 'agy' | 'claude';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  description: React.ReactNode;
  connection: CliConnection | null;
  isActive: boolean;
  loading: boolean;
  busy: boolean;
  message: string;
  detail?: string;
  onConnect: () => void;
  onDisconnect?: () => void;
}

const CliCard: React.FC<CliCardProps> = ({
  title,
  subtitle,
  icon,
  description,
  connection,
  isActive,
  loading,
  busy,
  message,
  detail,
  onConnect,
  onDisconnect,
}) => {
  const isAvailable = connection?.cliAvailable;
  const isFailed = connection?.state === 'failed';
  const notInstalled = connection?.cliAvailable === false;
  const isStandby = connection?.state === 'standby' || (!isActive && isAvailable && !isFailed);

  let badgeClass = 'badge-draft';
  let badgeLabel = 'Disconnected';
  let BadgeIcon = AlertCircle;

  if (notInstalled || isFailed) {
    badgeClass = 'badge-failed';
    badgeLabel = notInstalled ? 'Not installed' : 'Auth failed';
    BadgeIcon = XCircle;
  } else if (isActive) {
    badgeClass = 'badge-approved';
    badgeLabel = 'Active & Connected';
    BadgeIcon = CheckCircle2;
  } else if (isStandby) {
    badgeClass = 'badge-review';
    badgeLabel = 'Ready (Standby)';
    BadgeIcon = Clock;
  }

  return (
    <section
      style={{
        background: '#0f172a',
        border: `1px solid ${isActive ? 'rgba(52,211,153,0.45)' : isFailed || notInstalled ? 'rgba(248,113,113,0.25)' : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: isActive ? '0 0 16px rgba(52,211,153,0.1)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          {icon}
          {title}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{subtitle}</span>
        </h3>
        {!loading && (
          <span className={`badge ${badgeClass}`} style={{ whiteSpace: 'nowrap' }}>
            <BadgeIcon size={11} /> {badgeLabel}
          </span>
        )}
        {loading && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Checking…</span>}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
        {description}
      </p>

      {detail && (
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
          {detail}
        </div>
      )}

      {/* Action Buttons */}
      {!notInstalled && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isActive ? (
            <>
              <button
                className="btn btn-primary"
                type="button"
                onClick={onConnect}
                disabled={busy || loading}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <RefreshCw size={13} />
                {busy ? 'Working…' : 'Refresh Active Status'}
              </button>
              {onDisconnect && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={onDisconnect}
                  disabled={busy || loading}
                  style={{ fontSize: '12px', padding: '6px 12px', color: '#fb7185', borderColor: 'rgba(251,113,133,0.3)' }}
                >
                  <Power size={13} />
                  Disconnect CLI
                </button>
              )}
            </>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              onClick={onConnect}
              disabled={busy || loading || isFailed}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <Power size={13} />
              {busy ? 'Connecting…' : 'Connect & Make Active'}
            </button>
          )}
        </div>
      )}

      {notInstalled && (
        <div style={{ fontSize: '12px', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <XCircle size={14} /> {connection?.message}
        </div>
      )}

      {message && !notInstalled && (
        <div
          role="status"
          style={{
            color: /failed|unavailable|error|not\s+installed|not\s+logged/i.test(message) ? '#fb7185' : '#34d399',
            fontSize: '12px',
            marginTop: '10px',
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
};

// ──────────────────────────────────────────────────
// Main Settings modal
// ──────────────────────────────────────────────────

export const SettingsModal: React.FC<{ onActiveProviderChange?: (provider: 'agy' | 'claude' | 'none') => void }> = ({ onActiveProviderChange }) => {
  const [activeProvider, setActiveProvider] = useState<'agy' | 'claude' | 'none'>('agy');

  const updateActiveProvider = (provider: 'agy' | 'claude' | 'none') => {
    setActiveProvider(provider);
    onActiveProviderChange?.(provider);
    void loadAll();
  };

  // AGY
  const [agy, setAgy] = useState<CliConnection | null>(null);
  const [agyBusy, setAgyBusy] = useState(false);
  const [agyMsg, setAgyMsg] = useState('');
  const [agyLoading, setAgyLoading] = useState(true);

  // Claude Code
  const [claude, setClaude] = useState<CliConnection | null>(null);
  const [claudeBusy, setClaudeBusy] = useState(false);
  const [claudeMsg, setClaudeMsg] = useState('');
  const [claudeLoading, setClaudeLoading] = useState(true);

  const loadAll = async () => {
    setAgyLoading(true);
    setClaudeLoading(true);

    const [activeRes, agyRes, claudeRes] = await Promise.allSettled([
      api.getActiveProvider(),
      api.getAgyConnection(),
      api.getClaudeConnection(),
    ]);

    if (activeRes.status === 'fulfilled') {
      setActiveProvider(activeRes.value.activeProvider);
    }

    if (agyRes.status === 'fulfilled') {
      setAgy(agyRes.value);
      setAgyMsg(agyRes.value.message || '');
    } else {
      setAgyMsg('Could not reach backend for AGY status.');
    }
    setAgyLoading(false);

    if (claudeRes.status === 'fulfilled') {
      setClaude(claudeRes.value);
      setClaudeMsg(claudeRes.value.message || '');
    } else {
      setClaudeMsg('Could not reach backend for Claude Code status.');
    }
    setClaudeLoading(false);
  };

  useEffect(() => { void loadAll(); }, []);

  const handleAgyConnect = async () => {
    setAgyBusy(true);
    setAgyMsg('');
    try {
      const res = await api.connectAgy();
      setAgy(res);
      setAgyMsg(res.message || '');
      updateActiveProvider('agy');
    } catch (e: any) {
      setAgyMsg(e?.message || 'AGY connection failed.');
    } finally {
      setAgyBusy(false);
    }
  };

  const handleAgyDisconnect = async () => {
    setAgyBusy(true);
    try {
      const res = await api.disconnectAgy();
      setAgy(res);
      setAgyMsg('AGY disconnected.');
      updateActiveProvider('none');
    } catch (e: any) {
      setAgyMsg(e?.message || 'Disconnect failed.');
    } finally {
      setAgyBusy(false);
    }
  };

  const handleClaudeConnect = async () => {
    setClaudeBusy(true);
    setClaudeMsg('');
    try {
      const res = await api.connectClaude();
      setClaude(res);
      setClaudeMsg(res.message || '');
      if (res.isActive) updateActiveProvider('claude');
    } catch (e: any) {
      setClaudeMsg(e?.message || 'Claude Code connection check failed.');
    } finally {
      setClaudeBusy(false);
    }
  };

  const handleClaudeDisconnect = async () => {
    setClaudeBusy(true);
    try {
      const res = await api.disconnectClaude();
      setClaude(res);
      setClaudeMsg('Claude Code disconnected.');
      updateActiveProvider('none');
    } catch (e: any) {
      setClaudeMsg(e?.message || 'Disconnect failed.');
    } finally {
      setClaudeBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
          AI Providers &amp; Pipeline Architecture Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          All CLI credentials live on the backend machine. The dashboard only reads connection status — no secrets cross this API.
        </p>

        {/* ── Active Provider Banner ── */}
        <div style={{
          background: activeProvider === 'none' ? 'rgba(248,113,113,0.1)' : 'rgba(56,189,248,0.1)',
          border: `1px solid ${activeProvider === 'none' ? 'rgba(248,113,113,0.3)' : 'rgba(56,189,248,0.3)'}`,
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Connected Active CLI (One CLI at a Time)
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeProvider === 'agy' && <><span style={{ color: '#38bdf8' }}>⚡ AGY Antigravity</span> (Active)</>}
              {activeProvider === 'claude' && <><span style={{ color: '#f97316' }}>🟠 Claude Code</span> (Active)</>}
              {activeProvider === 'none' && <><span style={{ color: '#fb7185' }}>No CLI Connected</span> (Disconnected)</>}
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Select one active CLI. Other installed CLIs remain available as standby.
          </span>
        </div>

        {/* ── Section: CLI Connections ── */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#38bdf8" /> AI CLI Backends
          </h3>

          {/* AGY */}
          <CliCard
            id="agy"
            title="AGY — Antigravity"
            subtitle="agy CLI · v1.1.22+"
            icon={<span style={{ fontSize: '16px' }}>⚡</span>}
            description={
              <>
                AGY (Antigravity) CLI is available on this machine. It supports Gemini and Claude models and can be used as an
                alternative AI backend for script generation.
              </>
            }
            connection={agy}
            isActive={activeProvider === 'agy'}
            loading={agyLoading}
            busy={agyBusy}
            message={agyMsg}
            detail={agy?.version ? `CLI version: ${agy.version} · Gemini, Claude & GPT models available` : undefined}
            onConnect={handleAgyConnect}
            onDisconnect={handleAgyDisconnect}
          />

          {/* Claude Code */}
          <CliCard
            id="claude"
            title="Claude Code"
            subtitle="claude CLI · Anthropic"
            icon={<span style={{ fontSize: '16px' }}>🟠</span>}
            description={
              <>
                Claude Code CLI provides Anthropic's Claude models locally. Install via:{' '}
                <code>npm install -g @anthropic-ai/claude-code</code>, then run <code>claude login</code>.
                {claude?.cliAvailable === false && (
                  <span style={{ color: '#f97316', marginLeft: 6 }}>⚠ Not installed on this machine.</span>
                )}
              </>
            }
            connection={claude}
            isActive={activeProvider === 'claude'}
            loading={claudeLoading}
            busy={claudeBusy}
            message={claudeMsg}
            onConnect={handleClaudeConnect}
            onDisconnect={handleClaudeDisconnect}
          />
        </section>

        {/* ── Section: Database ── */}
        <section>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#10b981" /> Database &amp; Storage Infrastructure
          </h3>
          <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
            <div><strong>Database:</strong> PostgreSQL (port 5434, <code>animation_pipeline</code>)</div>
            <div><strong>Persistence:</strong> Versioned projects, scripts, approvals, render jobs, and videos</div>
            <div><strong>Media:</strong> Local worker storage with a migration path to Cloudinary/S3</div>
          </div>
        </section>

        {/* Reload all */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => void loadAll()}
            style={{ fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Reload all connection statuses
          </button>
        </div>

        {/* Legend */}
        <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><CheckCircle2 size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} color="#34d399" />Active & Connected</span>
          <span><Clock size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} color="#38bdf8" />Ready (Standby)</span>
          <span><XCircle size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} color="#f87171" />Auth failed / Not installed</span>
        </div>
      </div>
    </div>
  );
};
