-- Initialization script for OpenClaw & RainbowPaw unified database

-- 1. identity schema
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.global_users (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL UNIQUE,
  telegram_id BIGINT,
  username VARCHAR(128),
  first_source VARCHAR(64),
  primary_bot VARCHAR(32),
  pet_type VARCHAR(16),
  spend_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  spend_level VARCHAR(16) NOT NULL DEFAULT 'low',
  last_active_at TIMESTAMP,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_global_users_telegram_id ON identity.global_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_global_users_global_user_id ON identity.global_users(global_user_id);

CREATE TABLE IF NOT EXISTS identity.bot_user_mapping (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL,
  source_bot VARCHAR(32) NOT NULL,
  source_user_id VARCHAR(64) NOT NULL,
  telegram_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_bot, source_user_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_user_mapping_global_user_id ON identity.bot_user_mapping(global_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_user_mapping_telegram_id ON identity.bot_user_mapping(telegram_id);

CREATE TABLE IF NOT EXISTS identity.user_tags (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL,
  tag_key VARCHAR(64) NOT NULL,
  tag_value VARCHAR(128),
  score NUMERIC(8,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (global_user_id, tag_key)
);

CREATE INDEX IF NOT EXISTS idx_user_tags_global_user_id ON identity.user_tags(global_user_id);


-- 2. wallet schema
CREATE SCHEMA IF NOT EXISTS wallet;

CREATE TABLE IF NOT EXISTS wallet.wallets (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL UNIQUE,
  points_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  points_locked NUMERIC(12,2) NOT NULL DEFAULT 0,
  points_cashable NUMERIC(12,2) NOT NULL DEFAULT 0,
  wallet_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_global_user_id ON wallet.wallets(global_user_id);

CREATE TABLE IF NOT EXISTS wallet.wallet_logs (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL,
  biz_type VARCHAR(32) NOT NULL,
  asset_type VARCHAR(32) NOT NULL,
  change_direction VARCHAR(16) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  ref_type VARCHAR(32),
  ref_id VARCHAR(64),
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_logs_global_user_id ON wallet.wallet_logs(global_user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_ref_type_ref_id ON wallet.wallet_logs(ref_type, ref_id);

CREATE TABLE IF NOT EXISTS wallet.withdraw_requests (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64) NOT NULL,
  request_no VARCHAR(64) NOT NULL UNIQUE,
  points_cashable_amount NUMERIC(12,2) NOT NULL,
  cash_amount NUMERIC(12,2) NOT NULL,
  fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_cash_amount NUMERIC(12,2) NOT NULL,
  method VARCHAR(32) NOT NULL,
  account_info JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  reviewed_by VARCHAR(64),
  reviewed_at TIMESTAMP,
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_global_user_id ON wallet.withdraw_requests(global_user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON wallet.withdraw_requests(status);

CREATE TABLE IF NOT EXISTS wallet.idempotency_keys (
  id BIGSERIAL PRIMARY KEY,
  idem_key VARCHAR(128) NOT NULL UNIQUE,
  endpoint VARCHAR(128) NOT NULL,
  global_user_id VARCHAR(64),
  response_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_global_user_id ON wallet.idempotency_keys(global_user_id);


-- 3. bridge schema
CREATE SCHEMA IF NOT EXISTS bridge;

CREATE TABLE IF NOT EXISTS bridge.bridge_events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(64) NOT NULL,
  global_user_id VARCHAR(64) NOT NULL,
  source_bot VARCHAR(32) NOT NULL,
  source_user_id VARCHAR(64),
  telegram_id BIGINT,
  idempotency_key VARCHAR(128),
  event_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bridge_events_global_user_id ON bridge.bridge_events(global_user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_events_event_name ON bridge.bridge_events(event_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bridge_events_idempotency_key
  ON bridge.bridge_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE TABLE IF NOT EXISTS bridge.deep_link_tokens (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  global_user_id VARCHAR(64) NOT NULL,
  from_bot VARCHAR(32) NOT NULL,
  to_bot VARCHAR(32) NOT NULL,
  scene VARCHAR(32) NOT NULL,
  extra_data JSONB,
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deep_link_tokens_global_user_id ON bridge.deep_link_tokens(global_user_id);
CREATE INDEX IF NOT EXISTS idx_deep_link_tokens_token ON bridge.deep_link_tokens(token);


-- 4. ai schema
CREATE SCHEMA IF NOT EXISTS ai;

CREATE TABLE IF NOT EXISTS ai.call_logs (
  id BIGSERIAL PRIMARY KEY,
  global_user_id VARCHAR(64),
  role VARCHAR(32) NOT NULL,
  model VARCHAR(128) NOT NULL,
  provider_base_url VARCHAR(256),
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  cost_usd NUMERIC(12,6),
  latency_ms INT,
  request_json JSONB,
  response_json JSONB,
  status VARCHAR(32),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_global_user_id ON ai.call_logs(global_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_role ON ai.call_logs(role);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_created_at ON ai.call_logs(created_at);

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


-- 5. marketplace schema
CREATE SCHEMA IF NOT EXISTS marketplace;

CREATE TABLE IF NOT EXISTS marketplace.products (
  id BIGSERIAL PRIMARY KEY,
  merchant_id VARCHAR(64) NOT NULL,
  merchant_name VARCHAR(128) NOT NULL,
  category_code VARCHAR(64) NOT NULL,
  default_lang VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
  price_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'USD',
  production_time_days INT NOT NULL DEFAULT 0,
  delivery_type VARCHAR(32) NOT NULL DEFAULT 'shipment',
  stock INT,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_merchant_id ON marketplace.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category_code ON marketplace.products(category_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace.products(status);

CREATE TABLE IF NOT EXISTS marketplace.product_i18n (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  lang VARCHAR(16) NOT NULL,
  name TEXT,
  category_label TEXT,
  description TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_product_i18n_product_id ON marketplace.product_i18n(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_product_i18n_lang ON marketplace.product_i18n(lang);


-- 6. crm schema
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


-- 7. pricing schema
CREATE SCHEMA IF NOT EXISTS pricing;

CREATE TABLE IF NOT EXISTS pricing.aftercare_pricebooks (
  id BIGSERIAL PRIMARY KEY,
  country VARCHAR(8) NOT NULL,
  city VARCHAR(64) NOT NULL,
  package_code VARCHAR(32) NOT NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'USD',
  base_price_cents INT NOT NULL DEFAULT 0,
  pickup_fee_cents INT NOT NULL DEFAULT 0,
  weight_fee_rules JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country, city, package_code)
);

CREATE INDEX IF NOT EXISTS idx_aftercare_pricebooks_country_city ON pricing.aftercare_pricebooks(country, city);
