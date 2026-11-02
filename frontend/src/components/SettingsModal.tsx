import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Cpu, Database, LogIn, RefreshCw } from 'lucide-react';
import { api, CodexConnection } from '../services/api';

export const SettingsModal: React.FC = () => {
  const [codex, setCodex] = useState<CodexConnection | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await api.getCodexConnection();
      setCodex(status);
      setMessage(status.message || '');
    } catch (error: any) {
      setMessage(error?.message || 'Codex login status is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, []);

  const connect = async () => {
    setBusy(true);
    setMessage('');
    try {
      const status = await api.connectCodex();
      setCodex(status);
      setMessage(status.message || '');
    } catch (error: any) {
      setMessage(error?.message || 'Codex connection failed.');
    } finally {
      setBusy(false);
    }
  };

  const connected = codex?.state === 'connected';
  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>AI Providers & Pipeline Architecture Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Provider credentials stay on the backend worker. Remotion is integrated locally and does not require a third-party animation account.
        </p>

        <section style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><LogIn size={18} color="#38bdf8" /> Local Codex connection</h3>
            {!loading && <span className={`badge ${connected ? 'badge-approved' : 'badge-draft'}`}><CheckCircle2 size={11} /> {connected ? 'Connected' : 'Not connected'}</span>}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
            The backend runs the local <code>codex</code> CLI and checks its existing login session. Run <code>codex login</code> in the backend terminal if needed.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => void connect()} disabled={busy}>
            <RefreshCw size={15} /> {busy ? 'Connecting…' : connected ? 'Refresh connection' : 'Connect Codex'}
          </button>
          {message && <div role="status" style={{ color: /failed|unavailable|error/i.test(message) ? '#fb7185' : '#34d399', fontSize: '12px', marginTop: '10px' }}>{message}</div>}
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={18} color="#38bdf8" /> AI Script & Creative Direction Providers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#0f172a', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '16px' }}><strong>OpenAI Codex</strong><p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Script generation, creative direction, and Remotion scene planning.</p></div>
            <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', opacity: 0.8 }}><strong>Anthropic Claude</strong><p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Provider adapter reserved for a future integration.</p><Clock size={14} /> Adapter later</div>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={18} color="#10b981" /> Database & Storage Infrastructure</h3>
          <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
            <div><strong>Database:</strong> PostgreSQL (port 5434, <code>animation_pipeline</code>)</div>
            <div><strong>Persistence:</strong> Versioned projects, scripts, approvals, render jobs, and videos</div>
            <div><strong>Media:</strong> Local worker storage with a migration path to Cloudinary/S3</div>
          </div>
        </section>
      </div>
    </div>
  );
};
