CREATE TABLE IF NOT EXISTS ai.content_templates (
  id BIGSERIAL PRIMARY KEY,
  scene VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  template_text TEXT NOT NULL,
  variables_schema JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scene, name)
);

CREATE INDEX IF NOT EXISTS idx_ai_content_templates_scene ON ai.content_templates(scene);
CREATE INDEX IF NOT EXISTS idx_ai_content_templates_enabled ON ai.content_templates(enabled);

