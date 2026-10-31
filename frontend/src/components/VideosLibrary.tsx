import React from 'react';
import { VideoRecord } from '../types';
import { Video, Download, Calendar } from 'lucide-react';

interface VideosLibraryProps {
  videos: VideoRecord[];
  onOpenProject: (projectId: string) => void;
}

export const VideosLibrary: React.FC<VideosLibraryProps> = ({ videos, onOpenProject }) => {
  return (
    <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
            Completed Videos Library
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Browse and download all videos that passed both Gate 1 and Gate 2 human approvals.
          </p>
        </div>
        <span className="badge badge-completed">
          {videos.length} Delivered Videos
        </span>
      </div>

      {videos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Video size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
            No final videos produced yet.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Complete Gate 1 (Script Approval) and Gate 2 (Preview Approval) on a project to render your first video.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {videos.map((vid) => (
            <div key={vid.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  background: '#090d16',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  border: '1px solid var(--border-color)'
                }}>
                  <video
                    src={vid.storage_url}
                    controls
                    preload="metadata"
                    playsInline
                    style={{ width: '100%', height: '180px', display: 'block', objectFit: 'contain' }}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                  {vid.project_title || 'Untitled animation'}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Approved Script v{vid.script_version_approved} • Approved Preview v{vid.preview_version_approved}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {new Date(vid.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onOpenProject(vid.project_id)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  View Project
                </button>
                <a
                  href={vid.storage_url}
                  download
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                  aria-label={`Download ${vid.project_title || 'video'}`}
                >
                  <Download size={13} /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
