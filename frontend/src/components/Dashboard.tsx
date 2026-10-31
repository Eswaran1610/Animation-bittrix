import React, { useState } from 'react';
import { Project } from '../types';
import { Sparkles, Plus, Clock, FileText, Play, Trash2, ArrowRight, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  loading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (content: string, type: 'text' | 'topic' | 'url', title?: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  loading,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [inputType, setInputType] = useState<'text' | 'topic' | 'url'>('topic');
  const [inputContent, setInputContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const totalAgyTokens = projects.reduce((sum, project) => sum + Number(project.agy_total_tokens || 0), 0);
  const totalAgyRuns = projects.reduce((sum, project) => sum + Number(project.agy_run_count || 0), 0);
  const hasEstimatedUsage = projects.some((project) => project.agy_usage_estimated);
  const formatTokens = (value: number) => new Intl.NumberFormat().format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) {
      setErrorMsg('Please enter some text, a topic, or a URL to begin.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onCreateProject(inputContent, inputType, projectTitle.trim() || undefined);
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
            Submit your topic, pasted text, or URL. AGY will research and generate a full script, scene breakdown, and voice-over narration. 
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Project Title (Optional)
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. How Transformers Work"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {inputType === 'topic' ? 'Topic Description' : inputType === 'url' ? 'Source URL' : 'Content / Text'}
              </label>
              <input
                type="text"
                className="input-text"
                placeholder={
                  inputType === 'topic'
                    ? 'e.g. Quantum Computing for Beginners: Key principles and future outlook'
                    : inputType === 'url'
                    ? 'https://example.com/article'
                    : 'Paste article or transcript content here...'
                }
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        </form>
      </div>

      {/* AGY Usage Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>AGY Tokens Used</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '8px' }}>
            <Cpu size={20} color="var(--accent-blue)" />
            <strong style={{ fontSize: '25px' }}>{formatTokens(totalAgyTokens)}</strong>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '5px' }}>
            {hasEstimatedUsage ? 'Includes estimated runs until AGY reports native usage' : 'Reported by AGY process'}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>AGY Runs</div>
          <strong style={{ display: 'block', fontSize: '25px', marginTop: '8px' }}>{formatTokens(totalAgyRuns)}</strong>
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
                    <span title={proj.agy_usage_estimated ? 'Estimated from AGY input/output size' : 'Reported by AGY'}>
                      <Cpu size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                      AGY {formatTokens(Number(proj.agy_total_tokens || 0))} tokens{proj.agy_usage_estimated ? ' ~' : ''}
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
