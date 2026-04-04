CREATE TABLE IF NOT EXISTS ai.growth_contents (
  id BIGSERIAL PRIMARY KEY,
  kind VARCHAR(32) NOT NULL,
  tone VARCHAR(32),
  topic VARCHAR(128),
  country VARCHAR(8),
  city VARCHAR(64),
  language VARCHAR(16),
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  content TEXT NOT NULL,
  raw_json JSONB,
  model_hint VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_growth_contents_created_at ON ai.growth_contents(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_growth_contents_status ON ai.growth_contents(status);

