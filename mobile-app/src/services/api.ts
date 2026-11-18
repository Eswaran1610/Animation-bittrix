import { MobileMember, IdeaPitch, PreviewDetails, VideoRecord } from '../types';
import tunnelConfig from './tunnelConfig.json';

class ApiService {
  private baseUrl: string = tunnelConfig?.tunnelUrl || 'http://10.0.2.2:5000';
  private token: string | null = null;
  private currentMember: MobileMember | null = null;
  private ws: WebSocket | null = null;
  private listeners: Array<(event: any) => void> = [];

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
    this.reconnectWs();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string | null, member: MobileMember | null) {
    this.token = token;
    this.currentMember = member;
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentMember(): MobileMember | null {
    return this.currentMember;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data;
  }

  async login(username: string, password: string): Promise<{ token: string; member: MobileMember }> {
    const result = await this.request<{ token: string; member: MobileMember }>('/api/mobile/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(result.token, result.member);
    return result;
  }

  async listMembers(): Promise<MobileMember[]> {
    return this.request<MobileMember[]>('/api/mobile/members');
  }

  async listIdeas(): Promise<IdeaPitch[]> {
    return this.request<IdeaPitch[]>('/api/mobile/ideas');
  }

  async submitIdea(params: { topic: string; durationSec?: number; themeId?: string; notes?: string }): Promise<IdeaPitch> {
    return this.request<IdeaPitch>('/api/mobile/ideas', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async acceptIdea(ideaId: string): Promise<IdeaPitch> {
    return this.request<IdeaPitch>(`/api/mobile/ideas/${ideaId}/accept`, {
      method: 'POST',
    });
  }

  async generateVideo(ideaId: string): Promise<{ idea: IdeaPitch; projectId: string }> {
    return this.request<{ idea: IdeaPitch; projectId: string }>(`/api/mobile/ideas/${ideaId}/generate`, {
      method: 'POST',
    });
  }

  async getPreview(projectId: string): Promise<PreviewDetails> {
    return this.request<PreviewDetails>(`/api/mobile/projects/${projectId}/preview`);
  }

  async approvePreview(projectId: string, feedbackNotes?: string): Promise<any> {
    return this.request(`/api/mobile/projects/${projectId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ feedbackNotes }),
    });
  }

  async revisePreview(projectId: string, feedback: string): Promise<any> {
    return this.request(`/api/mobile/projects/${projectId}/revise`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async listVideos(): Promise<VideoRecord[]> {
    return this.request<VideoRecord[]>('/api/videos');
  }

  async getActiveProvider(): Promise<{ active: string }> {
    return this.request<{ active: string }>('/api/providers/active');
  }

  async setActiveProvider(provider: string): Promise<any> {
    return this.request('/api/providers/active', {
      method: 'PUT',
      body: JSON.stringify({ provider }),
    });
  }

  async getHealth(): Promise<any> {
    return this.request('/api/health');
  }

  async getTokenUsage(): Promise<any> {
    return this.request('/api/usage/active');
  }

  getMediaUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${clean}`;
  }

  connectWs(onMessage: (event: any) => void) {
    this.listeners.push(onMessage);
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.reconnectWs();
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== onMessage);
    };
  }

  private reconnectWs() {
    try {
      if (this.ws) {
        this.ws.close();
      }
      const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          this.listeners.forEach((listener) => listener(data));
        } catch {}
      };
      this.ws.onerror = () => {};
    } catch {}
  }
}

export const api = new ApiService();

