import React, { useState } from 'react';
import { Project } from '../types';
import { THEME_CATALOG } from '../data/themes';
import { 
  Sparkles, Plus, Clock, FileText, Play, Trash2, ArrowRight, 
  CheckCircle2, AlertCircle, Cpu, Globe, Layers, LayoutDashboard, Loader2 
} from 'lucide-react';

interface DashboardProps {
  activeProvider?: string;
  projects: Project[];
  loading: boolean;
  liveUsage?: { active?: boolean } | null;
  liveProgress?: { progress: number; label: string; stage?: string; projectId?: string };
  onSelectProject: (projectId: string) => void;
  onCreateProject: (content: string, type: 'text' | 'topic' | 'url', title?: string, durationSec?: number, themeId?: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeProvider,
  projects,
  loading,
  liveUsage,
  liveProgress,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const providerLabel = activeProvider === 'agy' ? 'AGY' : activeProvider === 'claude' ? 'Claude Code' : activeProvider === 'codex' ? 'Codex' : 'AI';
  const [inputType, setInputType] = useState<'text' | 'topic' | 'url'>('topic');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('character-explainer');
  const [inputContent, setInputContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [durationSec, setDurationSec] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const providerMetrics = (project: Project) => activeProvider === 'agy'
    ? { tokens: project.agy_total_tokens, runs: project.agy_run_count, estimated: project.agy_usage_estimated, available: project.agy_usage_available }
    : activeProvider === 'claude'
      ? { tokens: project.claude_total_tokens, runs: project.claude_run_count, estimated: project.claude_usage_estimated, available: project.claude_usage_available }
      : { tokens: project.codex_total_tokens, runs: project.codex_run_count, estimated: project.codex_usage_estimated, available: project.codex_usage_available };
  const totalProviderTokens = projects.reduce((sum, project) => sum + Number(providerMetrics(project).tokens || 0), 0);
  const totalProviderRuns = projects.reduce((sum, project) => sum + Number(providerMetrics(project).runs || 0), 0);
  const hasEstimatedUsage = projects.some((project) => providerMetrics(project).estimated);
  const hasAvailableUsage = projects.some((project) => providerMetrics(project).available);
  const formatTokens = (value: number) => new Intl.NumberFormat().format(value);

  const activeResearchProject = projects.find((p) => p.stage === 'research' || p.status?.toLowerCase().includes('research'));
  const isResearching = Boolean(submitting || activeResearchProject || (liveProgress?.stage === 'research' || liveProgress?.stage === 'script_plan'));

  const currentProgress = liveProgress?.progress ?? (isResearching ? (activeResearchProject ? 35 : 15) : 0);
  const currentStage = liveProgress?.stage ?? (isResearching ? (activeResearchProject ? 'research' : 'research') : '');

  const isStep1Done = currentProgress >= 70 || currentStage === 'script_plan' || currentStage === 'script_ready';
  const isStep1Active = isResearching || (!isStep1Done && (currentStage === 'research' || currentProgress > 0));

  const isStep2Done = currentProgress >= 95 || currentStage === 'script_ready';
  const isStep2Active = !isStep2Done && isStep1Done && (currentStage === 'script_plan' || currentProgress >= 70);

  const isStep3Done = currentProgress === 100 || currentStage === 'script_ready';
  const isStep3Active = !isStep3Done && isStep2Done && (currentStage === 'script_ready' || currentProgress >= 95);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) {
      setErrorMsg('Please enter some text, a topic, or a URL to begin.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onCreateProject(inputContent, inputType, projectTitle.trim() || undefined, durationSec, selectedThemeId);
      setInputContent('');
      setProjectTitle('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="badge badge-draft">Draft</span>;
      case 'Researching':
      case 'Queued for research':
        return <span className="badge badge-research"><Sparkles size={12} /> {status}</span>;
      case 'Script ready for review':
      case 'Preview ready for review':
        return <span className="badge badge-review"><AlertCircle size={12} /> {status}</span>;
      case 'Script approved':
      case 'Preview approved':
        return <span className="badge badge-approved"><CheckCircle2 size={12} /> {status}</span>;
      case 'Rendering preview':
      case 'Rendering final video':
      case 'Preparing animation':
        return <span className="badge badge-rendering"><Play size={12} /> {status}</span>;
      case 'Completed':
        return <span className="badge badge-completed"><CheckCircle2 size={12} /> Completed</span>;
      default:
        return <span className="badge badge-failed">{status}</span>;
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero / Creator Area */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '36px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
            Start a New Animation Video
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Submit your topic, pasted text, or URL. {providerLabel} will research and generate a full script, scene breakdown, and voice-over narration.
            <strong style={{ color: 'var(--accent-blue)', marginLeft: '6px' }}>
              Requires explicit script & preview approvals before final render.
            </strong>
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Input Type Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {(['topic', 'text', 'url'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInputType(type)}
                className={`btn ${inputType === type ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize', padding: '6px 14px', fontSize: '13px' }}
              >
                {type === 'topic' ? '💡 Topic Idea' : type === 'text' ? '📝 Pasted Text' : '🔗 Web URL'}
              </button>
            ))}
          </div>

          {/* Row 1: Theme, Duration & Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>🎨 Animation Theme ({THEME_CATALOG.length} Styles)</span>
                <span style={{ fontSize: '11px', color: (THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).palette.primary, fontWeight: 700 }}>
                  {(THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).name}
                </span>
              </label>
              <select
                className="input-text"
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                style={{
                  background: 'var(--surface-color, #1e293b)',
                  color: '#f8fafc',
                  border: `1px solid ${(THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).palette.primary}77`,
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {THEME_CATALOG.map((theme) => (
                  <option key={theme.id} value={theme.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    {theme.icon} {theme.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {(THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).tagline}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Video Duration (seconds)
              </label>
              <input
                type="number"
                min={20}
                max={40}
                step={1}
                className="input-text"
                value={durationSec}
                onChange={(e) => setDurationSec(Math.max(20, Math.min(40, Number(e.target.value) || 30)))}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{providerLabel} plans exactly this duration.</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Project Title (Optional)
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. VPN vs ZTNA Security"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Auto-derived if left blank.</div>
            </div>
          </div>

          {/* Row 2: Content Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {inputType === 'topic' ? 'Topic Description' : inputType === 'url' ? 'Source URL' : 'Content / Text'}
            </label>
            <textarea
              className="input-text"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder={
                inputType === 'topic'
                  ? 'e.g. Explain VPN vs ZTNA security: architectural differences, least-privilege access, attack surface, and performance'
                  : inputType === 'url'
                  ? 'https://example.com/article'
                  : 'Paste article or transcript content here...'
              }
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: (THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).palette.primary
              }} />
              <span>
                Selected: <strong>{(THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).name}</strong> — {(THEME_CATALOG.find((t) => t.id === selectedThemeId) || THEME_CATALOG[0]).description.slice(0, 75)}...
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || !inputContent.trim()}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '15px' }}
            >
              <Plus size={18} />
              {submitting ? 'Researching & Generating Script...' : 'Create Project / Start Video'}
            </button>
          </div>

          {isResearching && (
            <div style={{
              marginTop: '20px',
              padding: '20px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="#38bdf8" className="spin-animate" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    {providerLabel} Video Generation Pipeline {activeResearchProject ? `• ${activeResearchProject.title}` : ''}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                  {Math.max(15, Math.min(100, liveProgress?.progress || (isStep2Done ? 85 : 25)))}%
                </span>
              </div>

              {/* 3 Step Milestone Cards with Small Icons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {/* Milestone 1: CLI Research */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isStep1Done ? 'rgba(74, 222, 128, 0.1)' : isStep1Active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isStep1Done ? '#22c55e' : isStep1Active ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isStep1Done ? <CheckCircle2 size={16} color="#4ade80" /> : isStep1Active ? <Loader2 size={16} className="spin-animate" color="#38bdf8" /> : <Globe size={16} color="#64748b" />}
                      <strong style={{ fontSize: '13px', color: isStep1Done ? '#4ade80' : isStep1Active ? '#38bdf8' : '#94a3b8' }}>
                        1. CLI Research
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isStep1Done ? 'rgba(74, 222, 128, 0.2)' : isStep1Active ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: isStep1Done ? '#4ade80' : isStep1Active ? '#38bdf8' : '#64748b'
                    }}>
                      {isStep1Done ? 'Success ✓' : isStep1Active ? 'Running...' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    Multi-website deep research across authoritative scientific & academic portals
                  </p>
                </div>

                {/* Milestone 2: CLI Plan Ready */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isStep2Done ? 'rgba(74, 222, 128, 0.1)' : isStep2Active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isStep2Done ? '#22c55e' : isStep2Active ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isStep2Done ? <CheckCircle2 size={16} color="#4ade80" /> : isStep2Active ? <Loader2 size={16} className="spin-animate" color="#38bdf8" /> : <Layers size={16} color="#64748b" />}
                      <strong style={{ fontSize: '13px', color: isStep2Done ? '#4ade80' : isStep2Active ? '#38bdf8' : '#94a3b8' }}>
                        2. CLI Plan Ready
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isStep2Done ? 'rgba(74, 222, 128, 0.2)' : isStep2Active ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: isStep2Done ? '#4ade80' : isStep2Active ? '#38bdf8' : '#64748b'
                    }}>
                      {isStep2Done ? 'Success ✓' : isStep2Active ? 'Generating...' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    Structuring 7-9 scenes, blueprints, frame timing & narration
                  </p>
                </div>

                {/* Milestone 3: Get Into Dashboard */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isStep3Done ? 'rgba(74, 222, 128, 0.1)' : isStep3Active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isStep3Done ? '#22c55e' : isStep3Active ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isStep3Done ? <CheckCircle2 size={16} color="#4ade80" /> : isStep3Active ? <Loader2 size={16} className="spin-animate" color="#38bdf8" /> : <LayoutDashboard size={16} color="#64748b" />}
                      <strong style={{ fontSize: '13px', color: isStep3Done ? '#4ade80' : isStep3Active ? '#38bdf8' : '#94a3b8' }}>
                        3. Into Dashboard
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isStep3Done ? 'rgba(74, 222, 128, 0.2)' : isStep3Active ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: isStep3Done ? '#4ade80' : isStep3Active ? '#38bdf8' : '#64748b'
                    }}>
                      {isStep3Done ? 'Success ✓' : isStep3Active ? 'Loading...' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    Script ready in dashboard for human review & Gate 1 approval
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: '#0b1220', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(15, Math.min(100, currentProgress))}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #818cf8, #34d399)',
                  transition: 'width 400ms ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={13} className="spin-animate" />
                  {liveProgress?.label || `${providerLabel} deep research running across multiple web sources...`}
                </span>
                <span style={{ color: '#64748b' }}>
                  Please wait ~30-60s while deep research completes
                </span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Provider Usage Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{providerLabel} Tokens Used</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '8px' }}>
            <Cpu size={20} color="var(--accent-blue)" />
            <strong style={{ fontSize: '25px' }}>{formatTokens(totalProviderTokens)}</strong>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '5px' }}>
            {liveUsage?.active ? `${providerLabel} run in progress; live count updating` : hasEstimatedUsage ? 'Includes estimated runs' : totalProviderRuns === 0 ? 'No runs yet' : hasAvailableUsage ? `Reported by ${providerLabel} runs` : `Token counts are not reported by ${providerLabel}`}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{providerLabel} Runs</div>
            <strong style={{ display: 'block', fontSize: '25px', marginTop: '8px' }}>{formatTokens(totalProviderRuns)}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '5px' }}>Script and revision generations</div>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
            Active Projects ({projects.length})
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track progress across Research, Gate 1, Preview, and Gate 2
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '12px' }}>
              No animation projects found yet.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Submit a topic above to create your first video pipeline project!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    {getStatusBadge(proj.status)}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(proj.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', lineHeight: '1.4' }}>
                    {proj.title}
                  </h4>

                  {(proj.status === 'Researching' || proj.stage === 'research') && (
                    <div style={{
                      margin: '8px 0 12px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      gap: '4px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: isStep1Done ? '#4ade80' : '#38bdf8',
                        fontWeight: 600
                      }}>
                        {isStep1Done ? <CheckCircle2 size={12} color="#4ade80" /> : isStep1Active ? <Loader2 size={12} className="spin-animate" color="#38bdf8" /> : <Globe size={12} />}
                        Research {isStep1Done ? '✓' : ''}
                      </span>
                      <span style={{ color: '#475569', fontSize: '8px' }}>▶</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: isStep2Done ? '#4ade80' : isStep2Active ? '#38bdf8' : '#64748b',
                        fontWeight: 600
                      }}>
                        {isStep2Done ? <CheckCircle2 size={12} color="#4ade80" /> : isStep2Active ? <Loader2 size={12} className="spin-animate" color="#38bdf8" /> : <Layers size={12} />}
                        Plan {isStep2Done ? '✓' : ''}
                      </span>
                      <span style={{ color: '#475569', fontSize: '8px' }}>▶</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: isStep3Done ? '#4ade80' : isStep3Active ? '#38bdf8' : '#64748b',
                        fontWeight: 600
                      }}>
                        {isStep3Done ? <CheckCircle2 size={12} color="#4ade80" /> : isStep3Active ? <Loader2 size={12} className="spin-animate" color="#38bdf8" /> : <LayoutDashboard size={12} />}
                        Dashboard {isStep3Done ? '✓' : ''}
                      </span>
                    </div>
                  )}

                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {proj.input_content}
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    marginBottom: '16px'
                  }}>
                    <span>
                      <FileText size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                      Script v{proj.current_script_version || 1}
                    </span>
                    <span>
                      <Play size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                      Preview v{proj.current_preview_version || 0}
                    </span>
                    <span title={providerMetrics(proj).estimated ? 'Estimated from model input/output size' : `Reported by ${providerLabel}`}>
                      <Cpu size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                      {providerLabel} {Number(providerMetrics(proj).runs || 0) === 0 || providerMetrics(proj).available ? `${formatTokens(Number(providerMetrics(proj).tokens || 0))} tokens${providerMetrics(proj).estimated ? ' ~' : ''}` : 'token count unavailable'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Open Project Review <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
