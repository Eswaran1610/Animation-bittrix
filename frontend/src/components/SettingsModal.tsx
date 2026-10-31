import React from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2, Clock, LogIn } from 'lucide-react';

export const SettingsModal: React.FC = () => {
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
          <span><strong style={{ color: 'var(--text-primary)' }}>One AI login entry:</strong> configure Codex and Claude Code credentials here for the backend worker.</span>
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
                  <CheckCircle2 size={11} /> Active Now
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Autonomous CLI & Agent orchestration engine for research, fact-checking, full script generation, and Remotion composition code.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Integration: Native local CLI
              </div>
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
