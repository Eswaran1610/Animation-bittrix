import React, { useState } from 'react';
import { ProjectDetail as IProjectDetail } from '../types';
import { api } from '../services/api';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Play, 
  FileText, Sparkles, RefreshCw, Eye, Download, History, ExternalLink 
} from 'lucide-react';

interface ProjectDetailProps {
  details: IProjectDetail;
  onBack: () => void;
  onRefresh: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ details, onBack, onRefresh }) => {
  const { project, scripts, approvals, renderJobs, videos } = details;
  const [activeTab, setActiveTab] = useState<'script' | 'preview' | 'video' | 'approvals'>('script');

  // Script Revision & Approval State
  const [scriptFeedback, setScriptFeedback] = useState('');
  const [changeNarration, setChangeNarration] = useState(false);
  const [isSubmittingScriptAction, setIsSubmittingScriptAction] = useState(false);

  // Preview Revision & Approval State
  const [previewFeedback, setPreviewFeedback] = useState('');
  const [isSubmittingPreviewAction, setIsSubmittingPreviewAction] = useState(false);

  // Selected Script Version
  const [selectedScriptVer, setSelectedScriptVer] = useState(project.current_script_version || 1);

  const activeScript = scripts.find((s) => s.version === selectedScriptVer) || scripts[scripts.length - 1];

  // Gate 1 check: Is the current or selected script version approved?
  const scriptApproval = approvals.find(
    (a) => a.approval_type === 'script' && a.version_number === (activeScript?.version || 1)
  );
  const isScriptApproved = !!scriptApproval;

  // Gate 2 check: Is the CURRENT preview version approved?
  const currentPreviewVer = project.current_preview_version || 0;
  const previewApproval = approvals.find(
    (a) => a.approval_type === 'preview' && a.version_number === currentPreviewVer
  );
  const isCurrentPreviewApproved = currentPreviewVer > 0 && !!previewApproval;

  const latestPreviewJob = renderJobs.find((j) => j.render_type === 'preview');
  const finalVideo = videos[0];

  // Actions
  const handleApproveScript = async () => {
    if (!activeScript) return;
    setIsSubmittingScriptAction(true);
    try {
      await api.approveScript(project.id, activeScript.id, activeScript.version);
      await onRefresh();
    } catch (err: any) {
      alert(`Script approval error: ${err.message}`);
    } finally {
      setIsSubmittingScriptAction(false);
    }
  };

  const handleReviseScript = async () => {
    if (!scriptFeedback.trim()) {
      alert('Please provide feedback notes explaining what changes are needed.');
      return;
    }
    setIsSubmittingScriptAction(true);
    try {
      const newScript = await api.reviseScript(project.id, scriptFeedback, changeNarration);
      setScriptFeedback('');
      await onRefresh();
      setSelectedScriptVer(newScript.version);
    } catch (err: any) {
      alert(`Revision error: ${err.message}`);
    } finally {
      setIsSubmittingScriptAction(false);
    }
  };

  const handleRenderPreview = async () => {
    if (!isScriptApproved) {
      alert('Gate 1 Violation: Script must be approved before generating animation and preview.');
      return;
    }
    setIsSubmittingPreviewAction(true);
    try {
      await api.renderPreview(project.id, activeScript.version);
      await onRefresh();
      setActiveTab('preview');
    } catch (err: any) {
      alert(`Preview render error: ${err.message}`);
    } finally {
      setIsSubmittingPreviewAction(false);
    }
  };

  const handleApprovePreview = async () => {
    if (!latestPreviewJob) return;
    setIsSubmittingPreviewAction(true);
    try {
      await api.approvePreview(project.id, latestPreviewJob.id, currentPreviewVer);
      await onRefresh();
    } catch (err: any) {
      alert(`Preview approval error: ${err.message}`);
    } finally {
      setIsSubmittingPreviewAction(false);
    }
  };

  const handleRevisePreview = async () => {
    if (!previewFeedback.trim()) {
      alert('Please provide visual feedback for the animation correction.');
      return;
    }
    setIsSubmittingPreviewAction(true);
    try {
      await api.revisePreview(project.id, previewFeedback);
      setPreviewFeedback('');
      await onRefresh();
    } catch (err: any) {
      alert(`Preview correction error: ${err.message}`);
    } finally {
      setIsSubmittingPreviewAction(false);
    }
  };

  const handleRenderFinal = async () => {
    if (!isCurrentPreviewApproved) {
      alert('Gate 2 Violation: Final render requires explicit approval of the current preview version.');
      return;
    }
    setIsSubmittingPreviewAction(true);
    try {
      await api.renderFinalVideo(project.id);
      await onRefresh();
      setActiveTab('video');
    } catch (err: any) {
      alert(`Final render error: ${err.message}`);
    } finally {
      setIsSubmittingPreviewAction(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-research">Stage: {project.stage}</span>
          <span className="badge badge-review">Status: {project.status}</span>
        </div>
      </div>

      {/* Project Title Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          {project.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '900px' }}>
          {project.input_content}
        </p>

        {/* Pipeline Stepper */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#0f172a',
            border: `1px solid ${scripts.length > 0 ? 'var(--accent-blue)' : 'var(--border-color)'}`
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 1</div>
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <FileText size={15} color="#38bdf8" /> Research & Script
            </div>
            <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
              v{project.current_script_version || 1} Generated
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#0f172a',
            border: `1px solid ${isScriptApproved ? 'var(--accent-green)' : 'var(--accent-amber)'}`
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 2 • Gate 1</div>
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <ShieldCheck size={15} color={isScriptApproved ? '#10b981' : '#f59e0b'} /> Script Approval
            </div>
            <div style={{ fontSize: '11px', color: isScriptApproved ? '#10b981' : '#f59e0b', marginTop: '4px' }}>
              {isScriptApproved ? 'Approved by Human' : 'Pending Approval'}
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#0f172a',
            border: `1px solid ${isCurrentPreviewApproved ? 'var(--accent-green)' : currentPreviewVer > 0 ? 'var(--accent-amber)' : 'var(--border-color)'}`
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 3 • Gate 2</div>
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Eye size={15} color={isCurrentPreviewApproved ? '#10b981' : '#f59e0b'} /> Preview Approval
            </div>
            <div style={{ fontSize: '11px', color: isCurrentPreviewApproved ? '#10b981' : '#f59e0b', marginTop: '4px' }}>
              {isCurrentPreviewApproved ? `Preview v${currentPreviewVer} Approved` : currentPreviewVer > 0 ? `Reviewing v${currentPreviewVer}` : 'Awaiting Preview'}
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#0f172a',
            border: `1px solid ${finalVideo ? 'var(--accent-green)' : 'var(--border-color)'}`
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 4</div>
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Play size={15} color={finalVideo ? '#10b981' : '#94a3b8'} /> Final Video
            </div>
            <div style={{ fontSize: '11px', color: finalVideo ? '#10b981' : 'var(--text-muted)', marginTop: '4px' }}>
              {finalVideo ? 'Rendered & Delivered' : 'Locked until Gate 2'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('script')}
          className={`btn ${activeTab === 'script' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={16} /> Gate 1: Script Review ({scripts.length} Versions)
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Play size={16} /> Gate 2: Remotion Preview ({renderJobs.filter(j => j.render_type === 'preview').length} Versions)
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <CheckCircle2 size={16} /> Final Video ({videos.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <History size={16} /> Approval History ({approvals.length})
        </button>
      </div>

      {/* TAB 1: SCRIPT REVIEW (GATE 1) */}
      {activeTab === 'script' && activeScript && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Script Details */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                  Script Version {activeScript.version}
                </h3>
                {isScriptApproved ? (
                  <span className="badge badge-approved">
                    <CheckCircle2 size={12} /> Gate 1 Approved
                  </span>
                ) : (
                  <span className="badge badge-review">
                    <AlertCircle size={12} /> Pending Gate 1 Approval
                  </span>
                )}
              </div>

              {/* Version Selector */}
              {scripts.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Version:</span>
                  {scripts.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScriptVer(s.version)}
                      className={`btn ${selectedScriptVer === s.version ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      v{s.version}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Research Notes & Sources */}
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
                AGY Topic Interpretation & Research Notes
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                {activeScript.research_notes}
              </p>

              <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Verified Source References:
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeScript.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={12} /> {src.title} — {src.note || src.url}
                  </a>
                ))}
              </div>
            </div>

            {/* Complete Voice-Over Narration */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>
                  Full Voice-Over Narration
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Read aloud word-for-word by voice engine
                </span>
              </div>
              <div style={{
                background: '#090d16',
                border: '1px solid var(--border-color)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#e2e8f0',
                fontStyle: 'normal'
              }}>
                "{activeScript.narration}"
              </div>
            </div>

            {/* Scene-by-Scene Breakdown */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                Scene Breakdown & Animation Direction ({activeScript.scene_plan.length} Scenes)
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px' }}>#</th>
                      <th style={{ padding: '10px' }}>Duration</th>
                      <th style={{ padding: '10px' }}>On-Screen Text</th>
                      <th style={{ padding: '10px' }}>Visual / Animation Direction</th>
                      <th style={{ padding: '10px' }}>Assets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeScript.scene_plan.map((scene, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--accent-blue)' }}>{scene.scene_number}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{scene.duration_sec}s</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{scene.on_screen_text}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{scene.visual_direction}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>{scene.asset_suggestions || 'Remotion vector graphics'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Gate 1 Approval & Revision Sidebar */}
          <div>
            {/* Approval Action Card */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color={isScriptApproved ? '#10b981' : '#f59e0b'} />
                Gate 1: Human Script Approval
              </h4>

              {isScriptApproved ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '14px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Script v{activeScript.version} is Approved
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Approved by: {scriptApproval?.approved_by} on {new Date(scriptApproval?.created_at || '').toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                    Review the voice-over narration and scene plan. Approving authorizes AGY to create Remotion animation code and render a preview.
                  </p>
                  <button
                    onClick={handleApproveScript}
                    disabled={isSubmittingScriptAction}
                    className="btn btn-success"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <CheckCircle2 size={18} />
                    {isSubmittingScriptAction ? 'Saving Approval...' : `Approve Script v${activeScript.version}`}
                  </button>
                </div>
              )}

              {/* Render Preview Button */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleRenderPreview}
                  disabled={!isScriptApproved || isSubmittingPreviewAction}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <Play size={18} />
                  {isSubmittingPreviewAction ? 'Rendering Remotion Preview...' : 'Generate & Render Remotion Preview'}
                </button>
                {!isScriptApproved && (
                  <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px', textAlign: 'center' }}>
                    🔒 Unlocked only after Gate 1 approval
                  </p>
                )}
              </div>
            </div>

            {/* Request Script Changes Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                Request Script Changes
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Provide feedback to AGY. A new script version will be generated while preserving history.
              </p>
              <textarea
                className="input-textarea"
                rows={4}
                placeholder="e.g. Please make scene 2 more concise and emphasize the security benefits..."
                value={scriptFeedback}
                onChange={(e) => setScriptFeedback(e.target.value)}
                style={{ marginBottom: '12px' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="checkbox"
                  id="changeNarration"
                  checked={changeNarration}
                  onChange={(e) => setChangeNarration(e.target.checked)}
                />
                <label htmlFor="changeNarration" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Rewrite voice narration (rule #7 preserves it by default)
                </label>
              </div>

              <button
                onClick={handleReviseScript}
                disabled={isSubmittingScriptAction || !scriptFeedback.trim()}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Sparkles size={16} /> Request AGY Script Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREVIEW REVIEW (GATE 2) */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Preview Player Area */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                  Remotion Preview (v{currentPreviewVer})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Derived from Approved Script v{project.current_script_version}
                </span>
              </div>

              {isCurrentPreviewApproved ? (
                <span className="badge badge-approved">
                  <CheckCircle2 size={12} /> Gate 2 Approved
                </span>
              ) : currentPreviewVer > 0 ? (
                <span className="badge badge-review">
                  <AlertCircle size={12} /> Pending Gate 2 Approval
                </span>
              ) : (
                <span className="badge badge-draft">No Preview Rendered</span>
              )}
            </div>

            {currentPreviewVer === 0 ? (
              <div style={{
                background: '#090d16',
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                height: '360px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}>
                <Play size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontSize: '15px' }}>No preview rendered yet.</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>
                  Approve the script in Gate 1 first to trigger preview rendering.
                </p>
              </div>
            ) : (
              <div>
                {/* Real HTML5 Video Player */}
                <div style={{
                  background: '#000000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  marginBottom: '16px'
                }}>
                  <video
                    key={latestPreviewJob?.output_location || 'preview-video'}
                    controls
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      maxHeight: '440px',
                      display: 'block'
                    }}
                  >
                    <source src={latestPreviewJob?.output_location} type="video/mp4" />
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>

                {/* Preview Meta & Direct Open Link */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)'
                }}>
                  <span>Preview Version: <strong>v{currentPreviewVer}</strong> (Script v{project.current_script_version})</span>
                  {latestPreviewJob?.output_location && (
                    <a
                      href={latestPreviewJob.output_location}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ExternalLink size={14} /> Open Video Directly in New Tab
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Gate 2 Approval & Visual Revision Sidebar */}
          <div>
            {/* Approval Action Card */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color={isCurrentPreviewApproved ? '#10b981' : '#f59e0b'} />
                Gate 2: Preview Approval
              </h4>

              {isCurrentPreviewApproved ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '14px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Preview v{currentPreviewVer} Approved!
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Approved on {new Date(previewApproval?.created_at || '').toLocaleDateString()}. Final rendering is now authorized.
                  </div>
                </div>
              ) : currentPreviewVer > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                    <strong>Non-negotiable rule:</strong> Final render is strictly locked until you explicitly approve this preview version (v{currentPreviewVer}).
                  </p>
                  <button
                    onClick={handleApprovePreview}
                    disabled={isSubmittingPreviewAction}
                    className="btn btn-success"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <CheckCircle2 size={18} />
                    {isSubmittingPreviewAction ? 'Recording Approval...' : `Approve Preview v${currentPreviewVer}`}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Generate a preview first to enable Gate 2 approval.
                </p>
              )}

              {/* Final Render Button */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleRenderFinal}
                  disabled={!isCurrentPreviewApproved || isSubmittingPreviewAction}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <Play size={18} />
                  {isSubmittingPreviewAction ? 'Rendering Final Video...' : 'Render Final High-Res Video'}
                </button>
                {!isCurrentPreviewApproved && (
                  <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px', textAlign: 'center' }}>
                    🔒 Locked until Gate 2 current preview is approved
                  </p>
                )}
              </div>
            </div>

            {/* Request Visual Changes Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                Request Visual Corrections
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Note: Rule #7 strictly preserves approved narration. Changes only update animation code and render a new preview version (v{currentPreviewVer + 1}).
              </p>
              <textarea
                className="input-textarea"
                rows={4}
                placeholder="e.g. Make title font bolder, speed up intro card transition to 2s..."
                value={previewFeedback}
                onChange={(e) => setPreviewFeedback(e.target.value)}
                style={{ marginBottom: '14px' }}
              />

              <button
                onClick={handleRevisePreview}
                disabled={isSubmittingPreviewAction || !previewFeedback.trim() || currentPreviewVer === 0}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Sparkles size={16} /> Render Updated Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINAL VIDEO */}
      {activeTab === 'video' && (
        <div className="glass-panel" style={{ padding: '28px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>
            Final Production Video
          </h3>

          {finalVideo ? (
            <div>
              <div style={{
                background: '#000000',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
              }}>
                <video
                  key={finalVideo.storage_url}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '440px', display: 'block' }}
                >
                  <source src={finalVideo.storage_url} type="video/mp4" />
                  Your browser does not support HTML5 video playback.
                </video>
              </div>

              <div style={{
                background: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div><strong>Approved Script:</strong> Version {finalVideo.script_version_approved}</div>
                <div><strong>Approved Preview:</strong> Version {finalVideo.preview_version_approved}</div>
                <div><strong>Storage Location:</strong> {finalVideo.storage_url}</div>
                <div><strong>Completion Time:</strong> {new Date(finalVideo.created_at).toLocaleString()}</div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href={finalVideo.storage_url}
                  download
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <Download size={16} /> Download Video File
                </a>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '15px', marginBottom: '8px' }}>
                No final video has been rendered yet.
              </p>
              <p style={{ fontSize: '13px' }}>
                Both Gate 1 (Script Approval) and Gate 2 (Current Preview Approval) must be completed first.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPROVAL AUDIT LOG */}
      {activeTab === 'approvals' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
            Human Approval Audit Trail
          </h3>
          {approvals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No approvals recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvals.map((appr) => (
                <div
                  key={appr.id}
                  style={{
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-approved">
                        {appr.approval_type.toUpperCase()} GATE VERIFIED
                      </span>
                      <strong style={{ fontSize: '14px' }}>
                        {appr.approval_type === 'script' ? `Script Version ${appr.version_number}` : `Preview Version ${appr.version_number}`}
                      </strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Approved by: {appr.approved_by}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(appr.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
