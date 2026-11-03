ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS style_signature TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_style_signature
  ON projects(style_signature);
