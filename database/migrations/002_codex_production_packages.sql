CREATE TABLE IF NOT EXISTS production_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    script_version INT NOT NULL,
    package_version INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'queued',
    manifest JSONB DEFAULT '{}'::jsonb,
    package_path TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, package_version)
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requested_duration_sec INT;
CREATE INDEX IF NOT EXISTS idx_production_packages_project ON production_packages(project_id, package_version DESC);
