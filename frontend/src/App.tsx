import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectDetail as IProjectDetail, VideoRecord } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { VideosLibrary } from './components/VideosLibrary';
import { SettingsModal } from './components/SettingsModal';
import { LiveStatusBar } from './components/LiveStatusBar';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'videos' | 'settings'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<IProjectDetail | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
 const [codexUsage, setCodexUsage] = useState<any>(null);
  const [liveCodexUsage, setLiveCodexUsage] = useState<any>(null);
  const [liveProgress, setLiveProgress] = useState<{ progress: number; label: string; stage?: string; projectId?: string }>({ progress: 0, label: 'Waiting for a pipeline run' });
  const [liveConnected, setLiveConnected] = useState(false);
  const selectedProjectIdRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Load all initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [projs, vids, health, usage] = await Promise.all([
        api.listProjects().catch(() => []),
        api.listVideos().catch(() => []),
        api.getHealth().catch(() => null),
        api.getCodexUsage().catch(() => null),
      ]);
      setProjects(projs);
      setVideos(vids);
      setHealthInfo(health);
      setCodexUsage(usage);

      // If a project is selected, refresh its details too
      if (selectedProjectIdRef.current) {
        const detail = await api.getProjectDetails(selectedProjectIdRef.current).catch(() => null);
        setProjectDetail(detail);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let socket: WebSocket | null = null;
    let disposed = false;

    const refreshUsage = async () => {
      const usage = await api.getCodexUsage().catch(() => null);
      if (usage) setCodexUsage(usage);
    };

    const applyProgress = (event: any) => {
      if (selectedProjectIdRef.current && event.projectId && event.projectId !== selectedProjectIdRef.current) return;
      setLiveProgress({
        progress: Number(event.progress || 0),
        label: String(event.status || event.stage || 'Pipeline update'),
        stage: event.stage,
        projectId: event.projectId
      });
      if (Number(event.progress) === 100) void loadData();
    };

    const getWsUrls = (): string[] => {
      const explicit = (import.meta as any).env?.VITE_WS_URL;
      if (explicit) return [explicit];
      const urls: string[] = [];
      // 1. Same-origin proxy (/ws)
      urls.push(`${protocol}://${window.location.host}/ws`);
      // 2. Direct backend port 5000 fallback if running on Vite dev port
      if (window.location.port === '5173' || window.location.port === '3000') {
        urls.push(`${protocol}://${window.location.hostname}:5000/ws`);
      }
      return urls;
    };

    let urlIndex = 0;
    const wsUrls = getWsUrls();

    const connect = () => {
      if (disposed) return;
      const targetUrl = wsUrls[urlIndex % wsUrls.length];
      try {
        socket = new WebSocket(targetUrl);
      } catch {
        urlIndex++;
        const delay = Math.min(5_000, 500 * 2 ** Math.min(reconnectAttemptsRef.current++, 4));
        reconnectTimerRef.current = window.setTimeout(connect, delay);
        return;
      }

      socket.onopen = () => {
        if (disposed) {
          socket?.close();
          return;
        }
        reconnectAttemptsRef.current = 0;
        setLiveConnected(true);
        // Recover aggregate data that may have changed while disconnected.
        void loadData();
      };
      socket.onerror = () => {
        urlIndex++;
        if (!disposed) socket?.close();
      };
      socket.onclose = () => {
        setLiveConnected(false);
        if (disposed) return;
        const delay = Math.min(5_000, 500 * 2 ** Math.min(reconnectAttemptsRef.current++, 4));
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
      socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
       if (event.type === 'token_usage') {
         // The API is authoritative; do not add event deltas locally because
         // reconnects and snapshots can otherwise produce incorrect totals.
          setLiveCodexUsage(null);
         void refreshUsage();
       }
        if (event.type === 'codex_usage_progress') {
          setLiveCodexUsage(event.active ? event : null);
        }
        if (event.type === 'project_created' && event.project) {
          setProjects((prev) => {
            const exists = prev.some((p) => p.id === event.project.id);
            return exists ? prev : [event.project, ...prev];
          });
          void loadData();
        }
        if (event.type === 'project_updated') {
          setProjects((prev) => prev.map((p) => {
            if (p.id === event.projectId) {
              return {
                ...p,
                stage: event.stage || p.stage,
                status: event.status || p.status,
                ...(event.project || {})
              };
            }
            return p;
          }));
          if (selectedProjectIdRef.current === event.projectId) {
            void api.getProjectDetails(event.projectId).then((detail) => {
              if (detail) setProjectDetail(detail);
            }).catch(() => null);
          }
        }
        if (event.type === 'pipeline_progress' || event.type === 'render_progress') {
          applyProgress(event);
          if (event.projectId) {
            setProjects((prev) => prev.map((p) => {
              if (p.id === event.projectId) {
                return {
                  ...p,
                  stage: event.stage || p.stage,
                  status: event.status || p.status
                };
              }
              return p;
            }));
          }
        }
        if (event.type === 'progress_snapshot' && Array.isArray(event.events)) {
          const scopedEvents = selectedProjectIdRef.current
            ? event.events.filter((item: any) => item.projectId === selectedProjectIdRef.current)
            : event.events;
          const latest = [...scopedEvents].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)).at(-1);
          if (latest) applyProgress(latest);
        }
      } catch {
        // Ignore malformed live messages so one event cannot break the dashboard.
      }
      };
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      if (socket) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            socket?.close();
          };
        }
      }
    };
  }, []);

  // Auto-sync safety net: if any project is actively researching or rendering,
  // quietly refresh every 3 seconds so the UI is 100% resilient even if WebSockets are temporarily interrupted
  useEffect(() => {
    const hasActive = projects.some((p) =>
      p.stage === 'research' ||
      p.stage === 'preview_render' ||
      p.stage === 'final_render' ||
      p.stage === 'animation_prep' ||
      p.status.toLowerCase().includes('research') ||
      p.status.toLowerCase().includes('render')
    );
    if (!hasActive) return;

    const timer = setInterval(() => {
      api.listProjects().then((projs) => {
        setProjects(projs);
        if (selectedProjectIdRef.current) {
          api.getProjectDetails(selectedProjectIdRef.current).then((detail) => {
            if (detail) setProjectDetail(detail);
          }).catch(() => null);
        }
      }).catch(() => null);
    }, 3000);

    return () => clearInterval(timer);
  }, [projects]);

  // Handle selecting a project to inspect
  const handleSelectProject = async (id: string) => {
    selectedProjectIdRef.current = id;
    setSelectedProjectId(id);
    try {
      const detail = await api.getProjectDetails(id);
      setProjectDetail(detail);
    } catch (err: any) {
      alert(`Failed to load project details: ${err.message}`);
    }
  };

  // Handle creating a project
  const handleCreateProject = async (content: string, type: 'text' | 'topic' | 'url', title?: string, durationSec?: number, themeId?: string) => {
    const newProj = await api.createProject(content, type, title, durationSec, themeId);
    // Instantly append new project so it immediately renders in dashboard
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === newProj.id);
      return exists ? prev : [newProj, ...prev];
    });
    setLiveProgress({
      progress: 15,
      label: 'Researching topic & literature...',
      stage: 'research',
      projectId: newProj.id
    });
    void loadData();
  };

  // Handle deleting a project
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    await api.deleteProject(id);
    if (selectedProjectId === id) {
      selectedProjectIdRef.current = null;
      setSelectedProjectId(null);
      setProjectDetail(null);
    }
    await loadData();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          selectedProjectIdRef.current = null;
          setSelectedProjectId(null);
        }}
        onRefresh={loadData}
        healthInfo={healthInfo}
      />
      <LiveStatusBar
        activeProvider={healthInfo?.aiProvider}
        usage={codexUsage}
        liveUsage={liveCodexUsage}
        progress={liveProgress.progress}
        label={liveProgress.label}
        stage={liveProgress.stage}
        connected={liveConnected}
      />

      <main style={{ flex: 1 }}>
        {selectedProjectId && projectDetail ? (
          <ProjectDetail
            details={projectDetail}
            onBack={() => {
              setSelectedProjectId(null);
              setProjectDetail(null);
              loadData();
            }}
            onRefresh={async () => {
              if (selectedProjectId) {
                const detail = await api.getProjectDetails(selectedProjectId);
                setProjectDetail(detail);
              }
              await loadData();
            }}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                activeProvider={healthInfo?.aiProvider}
                projects={projects}
                loading={loading}
                liveUsage={liveCodexUsage}
                liveProgress={liveProgress}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
              />
            )}

            {currentTab === 'videos' && (
              <VideosLibrary
                videos={videos}
                onOpenProject={(id) => {
                  setCurrentTab('dashboard');
                  handleSelectProject(id);
                }}
              />
            )}

            {currentTab === 'settings' && <SettingsModal />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
