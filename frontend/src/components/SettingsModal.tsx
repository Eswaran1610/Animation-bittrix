import React, { useEffect, useState } from 'react';
import { Cpu, Database, CheckCircle2, Clock, LogIn, LoaderCircle, AlertCircle } from 'lucide-react';
import { AgyConnection, api } from '../services/api';

export const SettingsModal: React.FC = () => {
  const [agy, setAgy] = useState<AgyConnection | null>(null);
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshAgy = async () => setAgy(await api.getAgyConnection().catch(() => null));
  useEffect(() => { void refreshAgy(); }, []);

  useEffect(() => {
    if (!agy || !['starting', 'verifying'].includes(agy.state)) return;
    const timer = window.setInterval(() => void refreshAgy(), 1_500);
    return () => window.clearInterval(timer);
  }, [agy?.state]);

  const connectAgy = async () => {
    setBusy(true);
    try {
      setAgy(await api.connectAgy());
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agy?.sessionId || !authorizationCode.trim()) return;
    setBusy(true);
    try {
      setAgy(await api.submitAgyAuthorizationCode(agy.sessionId, authorizationCode));
      setAuthorizationCode('');
    } finally {
      setBusy(false);
    }
  };

  const connected = agy?.state === 'connected';
  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
          AI Providers & Pipeline Architecture Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Provider credentials and keys reside securely on the backend worker. Remotion is integrated by default without requiring third-party accounts.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <LogIn size={17} color="#38bdf8" />
          <span><strong style={{ color: 'var(--text-primary)' }}>AGY runs locally:</strong> connect this machine once, then its backend worker can create plans without asking you to log in for every project.</span>
        </div>

        {/* AI Providers Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#38bdf8" /> AI Script & Creative Direction Providers
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* AGY */}
            <div style={{
              background: '#0f172a',
              border: '1px solid var(--accent-blue)',
              borderRadius: '8px',
              padding: '16px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '15px' }}>Antigravity (AGY)</strong>
                <span className={`badge ${connected ? 'badge-approved' : 'badge-draft'}`} style={{ fontSize: '11px' }}>
                  {connected ? <CheckCircle2 size={11} /> : <Clock size={11} />} {connected ? 'Connected' : 'Login required'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Autonomous CLI & Agent orchestration engine for research, fact-checking, full script generation, and Remotion composition code.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Integration: Native local CLI {agy?.cliAvailable === false ? '• CLI unavailable' : ''}
              </div>
              <p style={{ fontSize: '12px', color: agy?.state === 'failed' ? '#fb7185' : 'var(--text-secondary)', lineHeight: '1.4', margin: '10px 0' }}>
                {agy?.message || 'Checking local AGY status…'}
              </p>
              {!connected && (
                <button type="button" className="btn btn-primary" disabled={busy || agy?.state === 'verifying'} onClick={() => void connectAgy()} style={{ width: '100%', justifyContent: 'center' }}>
                  {busy || agy?.state === 'starting' ? <LoaderCircle size={15} /> : <LogIn size={15} />} Connect AGY
                </button>
              )}
              {agy?.state === 'awaiting_code' && agy.authUrl && (
                <form onSubmit={submitCode} style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                  <a className="btn btn-secondary" href={agy.authUrl} target="_blank" rel="noreferrer" style={{ justifyContent: 'center' }}>Open Google sign-in</a>
                  <input className="input-text" value={authorizationCode} onChange={(event) => setAuthorizationCode(event.target.value)} placeholder="Paste authorization code" autoComplete="one-time-code" />
                  <button type="submit" className="btn btn-primary" disabled={busy || !authorizationCode.trim()} style={{ justifyContent: 'center' }}>
                    {busy ? <LoaderCircle size={15} /> : <CheckCircle2 size={15} />} Verify AGY
                  </button>
                </form>
              )}
              {agy?.state === 'failed' && <div style={{ display: 'flex', gap: '6px', marginTop: '8px', color: '#fb7185', fontSize: '11px' }}><AlertCircle size={14} /> No credentials are saved in this dashboard.</div>}
            </div>

            {/* Claude */}
            <div style={{
              background: '#0f172a',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              opacity: 0.8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '15px' }}>Anthropic Claude</strong>
                <span className="badge badge-draft" style={{ fontSize: '11px' }}>
                  <Clock size={11} /> Adapter Later
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Modular provider adapter interface designed for pluggable Claude 3.5 Sonnet / Opus script planning and storytelling.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Status: Adapter interface ready
              </div>
            </div>

            {/* Codex */}
            <div style={{
              background: '#0f172a',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              opacity: 0.8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '15px' }}>OpenAI Codex</strong>
                <span className="badge badge-draft" style={{ fontSize: '11px' }}>
                  <Clock size={11} /> Adapter Later
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Secondary code generation adapter for high-precision Remotion animations, SVG generation, and canvas rendering.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Status: Adapter interface ready
              </div>
            </div>
          </div>
        </div>

        {/* Animation Engine Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
            Animation & Rendering Engine
          </h3>
          <div style={{
            background: '#0f172a',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '14px' }}>Remotion Engine</strong>
              <span className="badge badge-approved" style={{ fontSize: '11px' }}>
                <CheckCircle2 size={11} /> Integrated by Default
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Remotion is bundled directly inside the Animation Pipeline project. No separate user account or login is required.
            </p>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#10b981" /> Database & Storage Infrastructure
          </h3>
          <div style={{
            background: '#0f172a',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <div><strong>Database:</strong> PostgreSQL (Port 5434, database <code>animation_pipeline</code>)</div>
            <div><strong>Persistence:</strong> Versioned tables for <code>projects</code>, <code>scripts</code>, <code>approvals</code>, <code>render_jobs</code>, <code>videos</code></div>
            <div><strong>Media Storage:</strong> Local worker media storage with migration path to Cloudinary/S3</div>
          </div>
        </div>
      </div>
    </div>
  );
};
