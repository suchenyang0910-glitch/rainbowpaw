CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.leads (
  lead_id VARCHAR(32) PRIMARY KEY,
  global_user_id VARCHAR(64),
  country VARCHAR(8),
  city VARCHAR(64),
  language VARCHAR(16),
  channel VARCHAR(32),
  intent VARCHAR(16),
  stage VARCHAR(16),
  session_id VARCHAR(64),
  utm JSONB,
  ref JSONB,
  last_event_at TIMESTAMP,
  owner VARCHAR(64),
  next_followup_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_global_user_id ON crm.leads(global_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm.leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_country_city ON crm.leads(country, city);
CREATE INDEX IF NOT EXISTS idx_crm_leads_updated_at ON crm.leads(updated_at);

CREATE TABLE IF NOT EXISTS crm.lead_events (
  id BIGSERIAL PRIMARY KEY,
  lead_id VARCHAR(32) NOT NULL,
  global_user_id VARCHAR(64),
  event_name VARCHAR(64) NOT NULL,
  source_bot VARCHAR(32),
  idempotency_key VARCHAR(128),
  event_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_events_lead_id ON crm.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_events_event_name ON crm.lead_events(event_name);
CREATE INDEX IF NOT EXISTS idx_crm_lead_events_created_at ON crm.lead_events(created_at);

