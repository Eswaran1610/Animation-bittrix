import React from 'react';
import { Film, Video, Settings, ShieldCheck, Sparkles, RefreshCw, LogIn } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'videos' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'videos' | 'settings') => void;
  onRefresh: () => void;
  healthInfo: any;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onRefresh, healthInfo }) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #6366f1)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
          }}>
            <Film size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              AI Animation Pipeline
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className="badge badge-approved" style={{ fontSize: '10px', padding: '1px 6px' }}>
                <ShieldCheck size={11} /> 2-Gate Verified
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Remotion Integrated
              </span>
            </div>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <nav style={{ display: 'flex', gap: '8px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`btn ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              <Sparkles size={15} /> Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('videos')}
              className={`btn ${currentTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              <Video size={15} /> My Videos
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`btn ${currentTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              <Settings size={15} /> AI Settings
            </button>
          </nav>

          <button
            onClick={() => setCurrentTab('settings')}
            className="btn btn-secondary"
            title="AI provider login: Codex and Claude Code"
            aria-label="Open Codex and Claude Code login settings"
            style={{ padding: '8px', borderRadius: '8px' }}
          >
            <LogIn size={16} />
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            title="Refresh Data"
            style={{ padding: '8px', borderRadius: '8px' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
