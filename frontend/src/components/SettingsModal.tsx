import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2, Clock, LogIn, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const SettingsModal: React.FC = () => {
  const [agyAuthenticated, setAgyAuthenticated] = useState(false);
  const [agyCliInstalled, setAgyCliInstalled] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSaving, setAuthSaving] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authStatusUnavailable, setAuthStatusUnavailable] = useState(false);

  const loadAgyAuthStatus = () => {
    let active = true;
    setAuthLoading(true);
    setAuthStatusUnavailable(false);
    api.getAgyAuthStatus()
      .then((status) => {
        if (active) {
          setAgyAuthenticated(status.authenticated);
          setAgyCliInstalled(status.cliInstalled);
          setAuthMessage(status.message || '');
        }
      })
      .catch(() => {
        if (active) {
          setAgyAuthenticated(false);
          setAuthStatusUnavailable(true);
          setAuthMessage('Backend login status is unavailable. Restart the backend, then retry.');
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  };

  useEffect(() => loadAgyAuthStatus(), []);

  const handleAgyConnect = async () => {
    try {
      setAuthSaving(true);
      setAuthMessage('');
      const status = await api.connectAgy();
      setAgyAuthenticated(status.authenticated);
      setAgyCliInstalled(status.cliInstalled);
      setAuthMessage(status.message || (status.authenticated ? 'Local AGY CLI is connected.' : 'Local AGY is not authenticated yet.'));
    } catch (err: any) {
      if (/returned 404|failed to fetch|network/i.test(err.message || '')) setAuthStatusUnavailable(true);
      setAuthMessage(err.message || 'AGY connection check failed.');
    } finally {
      setAuthSaving(false);
    }
  };

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
          <span><strong style={{ color: 'var(--text-primary)' }}>Local AI connection:</strong> this project uses the AGY CLI installed and authenticated on the backend machine.</span>
        </div>

        <div style={{
          background: '#0f172a',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogIn size={18} color="#38bdf8" /> Local AGY connection
            </h3>
            {!authLoading && (
              <span className={`badge ${agyAuthenticated ? 'badge-approved' : 'badge-draft'}`} style={{ fontSize: '11px' }}>
                {agyAuthenticated ? <CheckCircle2 size={11} /> : <LogIn size={11} />}
                {agyAuthenticated ? 'Logged in' : 'Not logged in'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
            No Gemini API key is used here. The backend runs the local <code>agy</code> CLI directly. Authenticate it once with <code>agy</code> in a terminal on this machine, then use this button to check the connection.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="button" onClick={handleAgyConnect} disabled={authSaving}>
              <RefreshCw size={15} /> {authSaving ? 'Checking…' : agyAuthenticated ? 'Refresh connection' : 'Check local AGY'}
            </button>
            {authStatusUnavailable && (
              <button className="btn btn-secondary" type="button" onClick={loadAgyAuthStatus} disabled={authLoading || authSaving}>
                Retry status
              </button>
            )}
          </div>
          {authMessage && (
            <div role="status" style={{ color: /failed|unavailable|restart|could not|not authenticated|not available/i.test(authMessage) ? '#fb7185' : '#34d399', fontSize: '12px', marginTop: '10px' }}>
              {authMessage}
            </div>
          )}
          {agyCliInstalled && !authStatusUnavailable && (
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '8px' }}>
              To log out of the real local AGY account, run <code>agy</code> and use <code>/logout</code> in its terminal; this web app never stores or copies those credentials.
            </div>
          )}
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
                <span className="badge badge-approved" style={{ fontSize: '11px' }}>
                  <CheckCircle2 size={11} /> CLI Available
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
