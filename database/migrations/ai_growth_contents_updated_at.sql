ALTER TABLE ai.growth_contents
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ai_growth_contents_updated_at ON ai.growth_contents(updated_at);

