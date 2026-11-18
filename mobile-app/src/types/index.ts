export interface MobileMember {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
}

export interface IdeaPitch {
  id: string;
  pitcherId: string;
  pitcherName: string;
  topic: string;
  durationSec: number;
  themeId: string;
  status: 'pending' | 'accepted' | 'generating' | 'preview_ready' | 'completed' | 'rejected';
  acceptedBy?: string | null;
  acceptedByName?: string | null;
  acceptedAt?: string | null;
  projectId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  projectStage?: string;
  projectStatus?: string;
  previewUrl?: string;
  finalVideoUrl?: string;
}

export interface PreviewDetails {
  projectId: string;
  stage: string;
  status: string;
  previewUrl?: string;
  scriptVersion: number;
  previewVersion: number;
  narration?: string;
  scenes?: any[];
}

export interface VideoRecord {
  id: string;
  projectId: string;
  title: string;
  storageUrl: string;
  durationSec: number;
  createdAt: string;
}
