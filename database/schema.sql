-- AI Animation Pipeline PostgreSQL Database Schema

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    input_content TEXT NOT NULL,
    input_type VARCHAR(50) DEFAULT 'text', -- 'text', 'topic', 'url'
    stage VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- Stages: 'draft', 'research', 'script_review', 'script_approved', 'animation_prep', 'preview_render', 'preview_review', 'preview_approved', 'final_render', 'completed', 'failed'
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    -- Statuses: 'Draft', 'Queued for research', 'Researching', 'Script ready for review', 'Script changes requested', 'Script approved', 'Preparing animation', 'Rendering preview', 'Preview ready for review', 'Preview changes requested', 'Rendering final video', 'Completed', 'Failed / Needs attention'
    current_script_version INT DEFAULT 0,
    current_preview_version INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scripts Table (Versioned)
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INT NOT NULL,
    topic_interpretation TEXT,
    research_notes TEXT,
    sources JSONB DEFAULT '[]'::jsonb, -- array of {url, title, note}
    fact_check_notes TEXT,
    narration TEXT NOT NULL,
    scene_plan JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {scene_number, duration_sec, on_screen_text, visual_direction, asset_suggestions}
    change_request_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, version)
);

-- Approvals Table (Gate 1 & Gate 2)
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    approval_type VARCHAR(50) NOT NULL, -- 'script', 'preview'
    approved_version_id UUID, -- references script or preview id
    version_number INT NOT NULL,
    approved_by VARCHAR(100) DEFAULT 'human_reviewer',
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL, -- 'audio', 'image', 'video', 'svg', 'code'
    storage_url TEXT NOT NULL,
    source_url TEXT,
    attribution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Queue Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'research_script', 'generate_animation', 'render_preview', 'render_final'
    provider VARCHAR(50) DEFAULT 'codex', -- 'codex', 'claude'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'claimed', 'running', 'completed', 'failed'
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    claimed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Render Jobs Table (Preview & Final Video rendering)
CREATE TABLE IF NOT EXISTS render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    render_type VARCHAR(50) NOT NULL, -- 'preview', 'final'
    preview_version INT NOT NULL,
    script_version INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'rendering', 'completed', 'failed'
    progress INT DEFAULT 0, -- 0 to 100
    composition_id VARCHAR(100) DEFAULT 'MainComposition',
    output_location TEXT,
    errors TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos Table (Final output library)
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    render_job_id UUID REFERENCES render_jobs(id) ON DELETE SET NULL,
    storage_url TEXT NOT NULL,
    preview_version_approved INT NOT NULL,
    script_version_approved INT NOT NULL,
    duration_seconds NUMERIC(10, 2),
    file_size_bytes BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent Runs Table (Audit log for AI interactions)
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- 'codex', 'claude'
    task VARCHAR(100) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    input_references JSONB DEFAULT '{}'::jsonb,
    output_references JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    execution_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_scripts_project_ver ON scripts(project_id, version);
CREATE INDEX IF NOT EXISTS idx_approvals_project ON approvals(project_id, approval_type);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_project ON render_jobs(project_id);
