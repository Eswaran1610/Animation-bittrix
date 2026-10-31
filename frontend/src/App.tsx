import React, { useState, useEffect } from 'react';
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
  const [agyUsage, setAgyUsage] = useState<any>(null);
  const [liveProgress, setLiveProgress] = useState({ progress: 0, label: 'Waiting for a pipeline run' });
  const [liveConnected, setLiveConnected] = useState(false);

  // Load all initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [projs, vids, health, usage] = await Promise.all([
        api.listProjects().catch(() => []),
        api.listVideos().catch(() => []),
        api.getHealth().catch(() => null),
        api.getAgyUsage().catch(() => null),
      ]);
      setProjects(projs);
      setVideos(vids);
      setHealthInfo(health);
      setAgyUsage(usage);

      // If a project is selected, refresh its details too
      if (selectedProjectId) {
        const detail = await api.getProjectDetails(selectedProjectId).catch(() => null);
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
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    socket.onopen = () => setLiveConnected(true);
    socket.onclose = () => setLiveConnected(false);
    socket.onerror = () => setLiveConnected(false);
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        if (event.type === 'token_usage') {
          setAgyUsage((current: any) => ({
            ...(current || {}),
            input_tokens: Number(current?.input_tokens || 0) + Number(event.input_tokens || 0),
            output_tokens: Number(current?.output_tokens || 0) + Number(event.output_tokens || 0),
            total_tokens: Number(current?.total_tokens || 0) + Number(event.total_tokens || 0),
            estimated: Boolean(event.estimated),
          }));
        }
        if (event.type === 'pipeline_progress' || event.type === 'render_progress') {
          setLiveProgress({ progress: Number(event.progress || 0), label: String(event.status || event.stage || 'Pipeline update') });
          if (Number(event.progress) === 100) void loadData();
        }
      } catch {
        // Ignore malformed live messages so one event cannot break the dashboard.
      }
    };
    return () => socket.close();
  }, []);

  // Handle selecting a project to inspect
  const handleSelectProject = async (id: string) => {
    setSelectedProjectId(id);
    try {
      const detail = await api.getProjectDetails(id);
      setProjectDetail(detail);
    } catch (err: any) {
      alert(`Failed to load project details: ${err.message}`);
    }
  };

  // Handle creating a project
  const handleCreateProject = async (content: string, type: 'text' | 'topic' | 'url', title?: string) => {
    const newProj = await api.createProject(content, type, title);
    await loadData();
    await handleSelectProject(newProj.id);
  };

  // Handle deleting a project
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    await api.deleteProject(id);
    if (selectedProjectId === id) {
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
          setSelectedProjectId(null);
        }}
        onRefresh={loadData}
        healthInfo={healthInfo}
      />
      <LiveStatusBar usage={agyUsage} progress={liveProgress.progress} label={liveProgress.label} connected={liveConnected} />

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
                projects={projects}
                loading={loading}
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
